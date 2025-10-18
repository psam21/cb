'use client';

import { useCartStore } from '@/stores/useCartStore';
import { PurchaseIntentButton } from '@/components/shop/PurchaseIntentButton';

interface CartSummaryProps {
  className?: string;
}

const formatSats = (sats: number): string => {
  return new Intl.NumberFormat('en-US').format(Math.round(sats));
};

export function CartSummary({ className = '' }: CartSummaryProps) {
  const items = useCartStore(state => state.items);
  const itemCount = useCartStore(state => state.itemCount);
  const totalSats = useCartStore(state => state.totalSats);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 sticky top-4 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

      {/* Item Count */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Items</span>
          <span className="font-medium text-gray-900">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Subtotal in Sats */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal (estimated)</span>
          <span className="font-medium text-gray-900">
            {formatSats(totalSats)} sats
          </span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-primary-600">
              {formatSats(totalSats)} sats
            </span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <PurchaseIntentButton disabled={itemCount === 0} />

      {/* Info Text */}
      <div className="mt-4 p-3 bg-primary-50 rounded-md">
        <p className="text-xs text-gray-700">
          <span className="font-semibold">Note:</span> Total is estimated based on approximate currency conversion rates. Final payment will be in Bitcoin Lightning sats.
        </p>
      </div>
    </div>
  );
}
