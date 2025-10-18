/**
 * useCartSync.ts
 * Hook Layer - Cart Relay Synchronization
 * 
 * Manages cart synchronization between local state and Nostr relays.
 * Provides the interface between UI state (useCartStore) and business logic
 * (CartBusinessService).
 * 
 * RESPONSIBILITIES:
 * - Load cart from relays on authentication (initial load)
 * - Manual sync to relays when cart page is visited
 * - Merge local and relay carts on load
 * - Handle authentication state changes
 * 
 * SYNC STRATEGY:
 * - Load: Automatic on authentication
 * - Save: Manual when user visits /cart page (not on every change)
 * - Benefit: Reduces unnecessary relay events for users browsing
 * 
 * SOA COMPLIANCE:
 * Hook Layer → Business Service → Generic Service
 * 
 * @architecture Hook Layer - Business Logic Interface
 * @layer Hook (orchestrates between UI state and business services)
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCartStore } from '@/stores/useCartStore';
import { cartBusinessService } from '@/services/business/CartBusinessService';
import { logger } from '@/services/core/LoggingService';

/**
 * Cart sync hook - manages relay synchronization
 * 
 * @architecture Hook Layer
 * @responsibilities
 * - Load cart on authentication
 * - Manual sync to relays (called by cart page)
 * - Merge local and relay carts
 * 
 * @usage
 * ```typescript
 * // In cart page
 * const { syncCartToRelay } = useCartSync();
 * useEffect(() => { syncCartToRelay(); }, []);
 * ```
 */

export const useCartSync = () => {
  const { signer, user } = useAuthStore();
  const hasLoadedRef = useRef(false);
  const previousItemsRef = useRef<string>('');

  // Exposed function to refresh cart from relay and repopulate state
  const refreshCartFromRelay = useCallback(async (mergeWithLocal = true) => {
    if (!user?.pubkey) return;
    try {
      logger.info('Refreshing cart from relays', {
        service: 'useCartSync',
        method: 'refreshCartFromRelay',
        userPubkey: user.pubkey.substring(0, 8) + '...',
      });
      const loadResult = await cartBusinessService.loadCartFromRelay(user.pubkey);
      if (!loadResult.success) {
        logger.error('Failed to refresh cart from relays', new Error(loadResult.error || 'Unknown error'), {
          service: 'useCartSync',
          method: 'refreshCartFromRelay',
        });
        return;
      }
      const relayItems = loadResult.items;
      const localItems = useCartStore.getState().items;
      if (mergeWithLocal && relayItems.length > 0 && localItems.length > 0) {
        const mergeResult = cartBusinessService.mergeCartItems(localItems, relayItems);
        useCartStore.setState({ items: mergeResult.mergedItems });
        useCartStore.getState()._updateComputedValues();
        logger.info('Cart merge complete (refresh)', {
          service: 'useCartSync',
          method: 'refreshCartFromRelay',
          mergedCount: mergeResult.mergedItems.length,
          conflictsResolved: mergeResult.conflictsResolved,
        });
      } else if (relayItems.length > 0) {
        useCartStore.setState({ items: relayItems });
        useCartStore.getState()._updateComputedValues();
        logger.info('Loaded cart from relay (refresh, no local items)', {
          service: 'useCartSync',
          method: 'refreshCartFromRelay',
          itemCount: relayItems.length,
        });
      } else {
        logger.info('No cart items on relay (refresh)', {
          service: 'useCartSync',
          method: 'refreshCartFromRelay',
          localCount: localItems.length,
        });
      }
      hasLoadedRef.current = true;
    } catch (error) {
      logger.error('Error refreshing cart from relays', error instanceof Error ? error : new Error(String(error)), {
        service: 'useCartSync',
        method: 'refreshCartFromRelay',
      });
    }
  }, [user?.pubkey]); // Only recreate when user pubkey changes

  // Load cart from relays on authentication (initial load)
  useEffect(() => {
    if (!signer || !user?.pubkey || hasLoadedRef.current) {
      return;
    }
    refreshCartFromRelay();
  }, [signer, user?.pubkey, refreshCartFromRelay]); // ✅ Added refreshCartFromRelay to dependencies

  // Manual sync function (called when cart page is visited)
  const syncCartToRelay = useCallback(async () => {
    const { signer: currentSigner, user: currentUser } = useAuthStore.getState();
    
    if (!currentSigner || !currentUser?.pubkey) {
      logger.debug('Skipping cart sync: user not authenticated', {
        service: 'useCartSync',
        method: 'syncCartToRelay',
      });
      return;
    }

    const currentItems = useCartStore.getState().items;

    logger.info('Manually syncing cart to relays (cart page visited)', {
      service: 'useCartSync',
      method: 'syncCartToRelay',
      itemCount: currentItems.length,
    });

    try {
      const syncResult = await cartBusinessService.saveCartToRelay(
        currentItems,
        currentSigner,
        currentUser.pubkey
      );

      if (syncResult.success) {
        logger.info('Cart synced to relays successfully', {
          service: 'useCartSync',
          method: 'syncCartToRelay',
          itemCount: syncResult.itemCount,
        });
      } else {
        logger.warn('Cart sync failed', {
          service: 'useCartSync',
          method: 'syncCartToRelay',
          error: syncResult.error,
        });
      }
    } catch (error) {
      logger.error('Error syncing cart to relays', error instanceof Error ? error : new Error(String(error)), {
        service: 'useCartSync',
        method: 'syncCartToRelay',
      });
    }
  }, []); // No dependencies - uses getState() to get current values

  // Reset on logout
  useEffect(() => {
    if (!user) {
      hasLoadedRef.current = false;
      previousItemsRef.current = '';
    }
  }, [user]);
  
  // Expose functions for use in components
  return { refreshCartFromRelay, syncCartToRelay };
};
