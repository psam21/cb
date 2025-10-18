'use client';

import { ShoppingBag, Loader2, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePurchaseIntent } from '@/hooks/usePurchaseIntent';
import { logger } from '@/services/core/LoggingService';

interface PurchaseIntentButtonProps {
  disabled?: boolean;
  className?: string;
}

export function PurchaseIntentButton({ disabled = false, className = '' }: PurchaseIntentButtonProps) {
  const router = useRouter();
  const { loading, success, error, result, sendPurchaseIntent, reset } = usePurchaseIntent();

  const handleClick = async () => {
    logger.info('Purchase intent button clicked', {
      service: 'PurchaseIntentButton',
      method: 'handleClick',
    });

    await sendPurchaseIntent();
  };

  // Success state - show confirmation then redirect
  if (success && result) {
    setTimeout(() => {
      logger.info('Purchase intent successful, navigating to messages', {
        service: 'PurchaseIntentButton',
        method: 'handleClick',
        sellerCount: result.sellerCount,
      });
      
      // TODO: In Feature #4, we'll create /my-purchases page to track orders
      // For now, navigate to messages where sellers will respond
      router.push('/messages');
    }, 2000);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-md">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-900">Purchase Intent Sent!</p>
            <p className="text-xs text-green-700 mt-1">
              Sent to {result.successCount} seller{result.successCount !== 1 ? 's' : ''}. 
              Check your messages for seller responses.
            </p>
          </div>
        </div>
        {result.failureCount > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-yellow-800">
                Note: Failed to contact {result.failureCount} seller{result.failureCount !== 1 ? 's' : ''}. 
                You may want to retry later.
              </p>
            </div>
          </div>
        )}
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
  );
}
