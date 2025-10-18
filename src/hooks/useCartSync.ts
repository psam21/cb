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

import { useEffect, useRef } from 'react';
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

  // Load cart from relays on authentication
  useEffect(() => {
    if (!signer || !user?.pubkey || hasLoadedRef.current) {
      return;
    }

    const loadCart = async () => {
      try {
        logger.info('Loading cart from relays', {
          service: 'useCartSync',
          method: 'loadCart',
          userPubkey: user.pubkey.substring(0, 8) + '...',
        });

        // Load from relays
        const loadResult = await cartBusinessService.loadCartFromRelay(user.pubkey);

        if (!loadResult.success) {
          logger.error('Failed to load cart from relays', new Error(loadResult.error || 'Unknown error'), {
            service: 'useCartSync',
            method: 'loadCart',
          });
          return;
        }

        const relayItems = loadResult.items;
        const localItems = useCartStore.getState().items;

        // Merge carts if both have items
        if (relayItems.length > 0 && localItems.length > 0) {
          logger.info('Merging local and relay carts', {
            service: 'useCartSync',
            method: 'loadCart',
            localCount: localItems.length,
            relayCount: relayItems.length,
          });

          const mergeResult = cartBusinessService.mergeCartItems(localItems, relayItems);
          
          useCartStore.setState({ items: mergeResult.mergedItems });
          useCartStore.getState()._updateComputedValues();

          logger.info('Cart merge complete', {
            service: 'useCartSync',
            method: 'loadCart',
            mergedCount: mergeResult.mergedItems.length,
            conflictsResolved: mergeResult.conflictsResolved,
          });

          // Sync merged cart back to relay
          await syncToRelay();
        } else if (relayItems.length > 0) {
          // Only relay has items, use them
          useCartStore.setState({ items: relayItems });
          useCartStore.getState()._updateComputedValues();

          logger.info('Loaded cart from relay (no local items)', {
            service: 'useCartSync',
            method: 'loadCart',
            itemCount: relayItems.length,
          });
        } else {
          // Only local items or both empty
          logger.info('No cart items on relay', {
            service: 'useCartSync',
            method: 'loadCart',
            localCount: localItems.length,
          });
        }

        hasLoadedRef.current = true;
      } catch (error) {
        logger.error('Error loading cart from relays', error instanceof Error ? error : new Error(String(error)), {
          service: 'useCartSync',
          method: 'loadCart',
        });
      }
    };

    loadCart();
  }, [signer, user?.pubkey]);

  // Sync cart to relays on changes (debounced)
  useEffect(() => {
    if (!signer || !user?.pubkey || !hasLoadedRef.current) {
      return;
    }

    // Check if items actually changed (avoid sync on merge)
    const itemsJson = JSON.stringify(items);
    if (itemsJson === previousItemsRef.current) {
      return;
    }
    previousItemsRef.current = itemsJson;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce sync
    syncTimeoutRef.current = setTimeout(() => {
      syncToRelay().catch(error => {
        logger.error('Debounced sync failed', error instanceof Error ? error : new Error(String(error)), {
          service: 'useCartSync',
          method: 'useEffect[items]',
        });
      });
    }, SYNC_DEBOUNCE_MS);

    // Cleanup
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
};
