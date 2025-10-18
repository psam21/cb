/**
 * usePurchaseIntent Hook
 * 
 * Manages purchase intent workflow: validates cart, sends encrypted messages to sellers.
 * SOA-compliant: Hook → Business Service → Message Service
 * 
 * @see docs/shop-purchase-flow.md - Feature #3: Purchase Intent
 */

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCartStore } from '@/stores/useCartStore';
import { purchaseBusinessService } from '@/services/business/PurchaseBusinessService';
import { PurchaseIntentResult } from '@/types/purchase';
import { logger } from '@/services/core/LoggingService';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

interface UsePurchaseIntentState {
  loading: boolean;
  success: boolean;
  error: string | null;
  result: PurchaseIntentResult | null;
}

interface UsePurchaseIntentReturn extends UsePurchaseIntentState {
  sendPurchaseIntent: () => Promise<void>;
  reset: () => void;
}

export function usePurchaseIntent(): UsePurchaseIntentReturn {
  const [state, setState] = useState<UsePurchaseIntentState>({
    loading: false,
    success: false,
    error: null,
    result: null,
  });

  const signer = useAuthStore(state => state.signer);
  const items = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);

  /**
   * Send purchase intent to all sellers
   */
  const sendPurchaseIntent = useCallback(async () => {
    logger.info('Starting purchase intent workflow', {
      service: 'usePurchaseIntent',
      method: 'sendPurchaseIntent',
      itemCount: items.length,
    });

    // Reset state
    setState({
      loading: true,
      success: false,
      error: null,
      result: null,
    });

    try {
      // Check authentication
      if (!signer) {
        throw new AppError(
          'Please sign in to proceed with checkout',
          ErrorCode.UNAUTHORIZED,
          HttpStatus.UNAUTHORIZED,
          ErrorCategory.AUTHENTICATION,
          ErrorSeverity.MEDIUM
        );
      }

      // Check cart is not empty
      if (!items || items.length === 0) {
        throw new AppError(
          'Your cart is empty',
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          ErrorCategory.VALIDATION,
          ErrorSeverity.LOW
        );
      }

      logger.info('Sending purchase intent via business service', {
        service: 'usePurchaseIntent',
        method: 'sendPurchaseIntent',
        itemCount: items.length,
      });

      // Send purchase intent via business service
      const result = await purchaseBusinessService.sendPurchaseIntent(items, signer);

      if (result.success) {
        // Success - clear cart and update state
        clearCart();

        setState({
          loading: false,
          success: true,
          error: null,
          result,
        });

        logger.info('Purchase intent sent successfully', {
          service: 'usePurchaseIntent',
          method: 'sendPurchaseIntent',
          sellerCount: result.sellerCount,
          successCount: result.successCount,
        });
      } else {
        // Partial failure
        setState({
          loading: false,
          success: false,
          error: result.error || 'Failed to send purchase intent',
          result,
        });

        logger.warn('Purchase intent partially failed', {
          service: 'usePurchaseIntent',
          method: 'sendPurchaseIntent',
          sellerCount: result.sellerCount,
          successCount: result.successCount,
          failureCount: result.failureCount,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof AppError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';

      setState({
        loading: false,
        success: false,
        error: errorMessage,
        result: null,
      });

      logger.error('Purchase intent failed', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'usePurchaseIntent',
        method: 'sendPurchaseIntent',
        itemCount: items.length,
      });
    }
  }, [signer, items, clearCart]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      success: false,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    sendPurchaseIntent,
    reset,
  };
}
