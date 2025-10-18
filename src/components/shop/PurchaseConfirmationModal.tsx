'use client';

import { useEffect, useState, useMemo } from 'react';
import { CartItem } from '@/types/cart';
import { profileService } from '@/services/business/ProfileBusinessService';
import { nip19 } from 'nostr-tools';
import Image from 'next/image';

interface PurchaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: CartItem[];
  total: number;
  isLoading?: boolean;
}

interface SellerGroup {
  sellerPubkey: string;
  items: CartItem[];
  subtotal: number;
}

interface SellerProfile {
  displayName?: string;
  npub: string;
}

// Format sats with commas
const formatSats = (sats: number): string => {
  return sats.toLocaleString('en-US');
};

export default function PurchaseConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  total,
  isLoading = false,
}: PurchaseConfirmationModalProps) {
  const [sellerProfiles, setSellerProfiles] = useState<Map<string, SellerProfile>>(new Map());

  // Group items by seller - memoized to prevent infinite re-renders
  const sellerGroups = useMemo(() => {
    return items.reduce((acc, item) => {
      const existingGroup = acc.find((g) => g.sellerPubkey === item.sellerPubkey);
      const itemSubtotal = item.price * item.quantity;

      if (existingGroup) {
        existingGroup.items.push(item);
        existingGroup.subtotal += itemSubtotal;
      } else {
        acc.push({
          sellerPubkey: item.sellerPubkey,
          items: [item],
          subtotal: itemSubtotal,
        });
      }

      return acc;
    }, [] as SellerGroup[]);
  }, [items]);

  // Extract seller pubkeys for effect dependency
  const sellerPubkeys = useMemo(
    () => sellerGroups.map(g => g.sellerPubkey).sort().join(','),
    [sellerGroups]
  );

  // Fetch seller profiles when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchProfiles = async () => {
      const profiles = new Map<string, SellerProfile>();
      
      for (const group of sellerGroups) {
        try {
          const npub = nip19.npubEncode(group.sellerPubkey);
          const profile = await profileService.getUserProfile(group.sellerPubkey);
          
          profiles.set(group.sellerPubkey, {
            displayName: profile?.display_name,
            npub,
          });
        } catch (error) {
          // Fallback to just npub if profile fetch fails
          const npub = nip19.npubEncode(group.sellerPubkey);
          profiles.set(group.sellerPubkey, { npub });
        }
      }
      
      setSellerProfiles(profiles);
    };

    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sellerPubkeys]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Confirm Purchase Request
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            You will send encrypted purchase requests to {sellerGroups.length}{' '}
            {sellerGroups.length === 1 ? 'seller' : 'sellers'}
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {sellerGroups.map((group) => {
            const sellerInfo = sellerProfiles.get(group.sellerPubkey);
            
            return (
              <div key={group.sellerPubkey} className="mb-6 last:mb-0">
                {/* Seller Header */}
                <div className="bg-gray-50 px-4 py-3 rounded-lg mb-3">
                  <h3 className="font-semibold text-gray-900">
                    {sellerInfo?.displayName || 'Seller'}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    ({sellerInfo?.npub || group.sellerPubkey.slice(0, 16) + '...'})
                  </p>
                </div>

              {/* Items */}
              <div className="space-y-3 ml-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {/* Image */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × {formatSats(item.price)}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatSats(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seller Subtotal */}
              <div className="mt-3 ml-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatSats(group.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          );
          })}

          {/* Total */}
          <div className="mt-6 pt-4 border-t-2 border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">
                Total Amount
              </span>
              <span className="text-2xl font-bold text-purple-600">
                {formatSats(total)}
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">What happens next:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Encrypted purchase requests will be sent to each seller</li>
                  <li>Sellers will respond with payment links</li>
                  <li>You can view messages in your Messages page</li>
                  <li>This does not charge you or reserve items</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  Send Purchase Requests
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
