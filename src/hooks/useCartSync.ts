/**
 * useCartSync.ts
 * Hook Layer - Cart Relay Synchronization
 * 
 * Manages cart synchronization between local state and Nostr relays.
 * Provides the interface between UI state (useCartStore) and business logic
 * (CartBusinessService).
 * 
 * RESPONSIBILITIES:
 * - Load cart from relays on mount (if authenticated)
 * - Debounce and trigger cart sync to relays on changes
 * - Merge local and relay carts on load
 * - Handle authentication state changes
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

const SYNC_DEBOUNCE_MS = 2000;

/**
 * Cart sync hook - manages relay synchronization
 * 
 * @architecture Hook Layer
 * @responsibilities
 * - Load cart on authentication
 * - Sync cart changes to relays (debounced)
 * - Merge local and relay carts
 * 
 * @usage
 * ```typescript
 * // In cart page or layout
 * useCartSync();
 * ```
 */

export const useCartSync = () => {
  const { signer, user } = useAuthStore();
  const { items } = useCartStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Sync cart to relays on changes (debounced)
  useEffect(() => {
    if (!signer || !user?.pubkey || !hasLoadedRef.current) {
      return;
    }
    const itemsJson = JSON.stringify(items);
    if (itemsJson === previousItemsRef.current) {
      return;
    }
    previousItemsRef.current = itemsJson;
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncToRelay().catch(error => {
        logger.error('Debounced sync failed', error instanceof Error ? error : new Error(String(error)), {
          service: 'useCartSync',
          method: 'useEffect[items]',
        });
      });
    }, SYNC_DEBOUNCE_MS);
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, signer, user?.pubkey]);

  // Helper function to sync to relay
  const syncToRelay = async () => {
    const { signer: currentSigner, user: currentUser } = useAuthStore.getState();
    
    if (!currentSigner || !currentUser?.pubkey) {
      logger.debug('Skipping cart sync: user not authenticated', {
        service: 'useCartSync',
        method: 'syncToRelay',
      });
      return;
    }

    const currentItems = useCartStore.getState().items;

    logger.info('Syncing cart to relays', {
      service: 'useCartSync',
      method: 'syncToRelay',
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
          method: 'syncToRelay',
          itemCount: syncResult.itemCount,
        });
      } else {
        logger.warn('Cart sync failed', {
          service: 'useCartSync',
          method: 'syncToRelay',
          error: syncResult.error,
        });
      }
    } catch (error) {
      logger.error('Error syncing cart to relays', error instanceof Error ? error : new Error(String(error)), {
        service: 'useCartSync',
        method: 'syncToRelay',
      });
    }
  };

  // Reset on logout
  useEffect(() => {
    if (!user) {
      hasLoadedRef.current = false;
      previousItemsRef.current = '';
    }
  }, [user]);
  // Expose refreshCartFromRelay for use in features
  return { refreshCartFromRelay };
};
