'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePurchaseIntent } from '@/hooks/usePurchaseIntent';
import { useCartStore } from '@/stores/useCartStore';
import PurchaseConfirmationModal from './PurchaseConfirmationModal';

import { logger } from '@/services/core/LoggingService';

interface PurchaseIntentButtonProps {
  disabled?: boolean;
  className?: string;
}

export function PurchaseIntentButton({ disabled = false, className = '' }: PurchaseIntentButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { items } = useCartStore();
  const { loading, success, error, result, sendPurchaseIntent, reset } = usePurchaseIntent();

  // Calculate total in sats
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleClick = () => {
    logger.info('Purchase intent button clicked - opening confirmation modal', {
      service: 'PurchaseIntentButton',
      method: 'handleClick',
      itemCount: items.length,
    });

    setShowModal(true);
  };

  const handleConfirm = async () => {
    logger.info('Purchase intent confirmed in modal', {
      service: 'PurchaseIntentButton',
      method: 'handleConfirm',
    });

    await sendPurchaseIntent();
    // Don't close modal here - let the success state trigger redirect
    // setShowModal(false);
  };

  const handleClose = () => {
    if (!loading) {
      setShowModal(false);
    }
  };

  // Redirect to messages after purchase intent is sent
  useEffect(() => {
    if (success && result) {
      logger.info('Purchase intent successful - redirecting to messages', {
        service: 'PurchaseIntentButton',
        method: 'useEffect[success]',
      });
      
      // Close modal first
      setShowModal(false);
      
      // Use replace to prevent back navigation to cart
      // Small delay to ensure modal closes and success message is visible
      setTimeout(() => {
        router.replace('/messages');
      }, 300);
      
      // Reset state after navigation completes
      setTimeout(() => {
        reset();
      }, 1000);
    }
  }, [success, result, router, reset]);

  // Success state - show brief message before redirect
  if (success && result) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-900">Purchase Intent Sent!</p>
            <p className="text-xs text-green-700 mt-1">Redirecting to messages...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900">Failed to Send Purchase Intent</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={reset}
          className="w-full btn-outline text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Default button state
  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`w-full btn-primary flex items-center justify-center gap-2 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Sending to Sellers...</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-5 h-5" />
            <span>Proceed to Checkout</span>
          </>
        )}
      </button>

      <PurchaseConfirmationModal
        isOpen={showModal}
        onClose={handleClose}
        onConfirm={handleConfirm}
        items={items}
        total={total}
        isLoading={loading}
      />
    </>
  );
}
