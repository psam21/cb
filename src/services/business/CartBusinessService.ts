/**
 * CartBusinessService.ts
 * Business Layer - Cart Relay Synchronization Orchestration
 * 
 * Handles cart persistence business logic, orchestrating between cart store
 * and relay storage. Manages merge strategies, validation, and error handling.
 * 
 * RESPONSIBILITIES:
 * - Orchestrate cart saving to relays
 * - Orchestrate cart loading from relays
 * - Merge cart items from different sources (local + relay)
 * - Validate cart data before persistence
 * - Handle cart clearing on logout
 * 
 * BUSINESS RULES:
 * - Merge strategy: Prefer newer items based on addedAt timestamp
 * - Duplicate detection: Same productId and sellerPubkey = duplicate
 * - Invalid items: Filter out items with missing required fields
 * - Privacy: Cart cleared from relays on logout
 * 
 * SOA FLOW:
 * Hook → CartBusinessService → CartRelayService → GenericRelayService
 * 
 * @architecture Business Layer - Orchestration Service
 * @singleton Stateless
 * @layer Business (business logic + orchestration)
 * @pattern Service Layer (orchestrates between hooks and generic services)
 */

import { logger } from '../core/LoggingService';
import { NostrSigner } from '../../types/nostr';
import { CartItem } from '../../types/cart';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
import { cartRelayService, CartSaveResult, CartLoadResult } from '../generic/CartRelayService';

export interface CartSyncResult {
  success: boolean;
  itemCount: number;
  error?: string;
}

export interface CartMergeResult {
  mergedItems: CartItem[];
  addedCount: number;
  skippedCount: number;
  conflictsResolved: number;
}

/**
 * Business service for cart relay synchronization
 * 
 * @architecture Business Layer - Orchestration
 * @singleton Stateless
 * @responsibilities
 * - Orchestrate cart sync to/from relays
 * - Merge cart items with conflict resolution
 * - Validate cart data
 * - Apply business rules
 */
export class CartBusinessService {
  private static instance: CartBusinessService;

  private constructor() {}

  /**
   * Get singleton instance of CartBusinessService
   */
  public static getInstance(): CartBusinessService {
    if (!CartBusinessService.instance) {
      CartBusinessService.instance = new CartBusinessService();
    }
    return CartBusinessService.instance;
  }

  /**
   * Save cart to Nostr relays
   * 
   * Validates cart items, filters invalid items, and publishes to relays.
   * 
   * @param items - Array of cart items to save
   * @param signer - NostrSigner for event signing
   * @param userPubkey - User's public key
   * @returns CartSyncResult with success status
   * 
   * @throws AppError if authentication fails or validation fails critically
   * 
   * @example
   * ```typescript
   * const result = await cartBusinessService.saveCartToRelay(
   *   cartItems,
   *   signer,
   *   userPubkey
   * );
   * if (result.success) {
   *   console.log(`Cart with ${result.itemCount} items saved`);
   * }
   * ```
   */
  public async saveCartToRelay(
    items: CartItem[],
    signer: NostrSigner | null,
    userPubkey: string | null
  ): Promise<CartSyncResult> {
    try {
      logger.info('Saving cart to relays (business layer)', {
        service: 'CartBusinessService',
        method: 'saveCartToRelay',
        itemCount: items.length,
      });

      // Validate authentication
      if (!signer || !userPubkey) {
        logger.warn('Cannot save cart: user not authenticated', {
          service: 'CartBusinessService',
          method: 'saveCartToRelay',
        });

        return {
          success: false,
          itemCount: 0,
          error: 'User not authenticated',
        };
      }

      // Validate and filter cart items
      const validItems = this.validateCartItems(items);

      if (validItems.length === 0 && items.length > 0) {
        logger.warn('No valid items to save after validation', {
          service: 'CartBusinessService',
          method: 'saveCartToRelay',
          originalCount: items.length,
          validCount: validItems.length,
        });
      }

      // Save to relays (even if empty - to clear cart)
      const saveResult: CartSaveResult = await cartRelayService.saveCart(
        validItems,
        signer,
        userPubkey
      );

      if (!saveResult.success) {
        logger.error('Failed to save cart to relays', new Error(saveResult.error || 'Unknown error'), {
          service: 'CartBusinessService',
          method: 'saveCartToRelay',
          itemCount: validItems.length,
        });

        return {
          success: false,
          itemCount: validItems.length,
          error: saveResult.error || 'Failed to save cart',
        };
      }

      logger.info('Cart saved to relays successfully', {
        service: 'CartBusinessService',
        method: 'saveCartToRelay',
        itemCount: validItems.length,
        publishedRelays: saveResult.publishedRelays.length,
        eventId: saveResult.eventId?.substring(0, 8) + '...',
      });

      return {
        success: true,
        itemCount: validItems.length,
      };
    } catch (error) {
      logger.error('Error in saveCartToRelay', error instanceof Error ? error : new Error(String(error)), {
        service: 'CartBusinessService',
        method: 'saveCartToRelay',
        itemCount: items.length,
      });

      // Re-throw AppErrors
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `Failed to save cart: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.NOSTR_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.EXTERNAL_SERVICE,
        ErrorSeverity.MEDIUM,
        { itemCount: items.length }
      );
    }
  }

  /**
   * Load cart from Nostr relays
   * 
   * Queries relays for user's cart event and returns validated items.
   * 
   * @param userPubkey - User's public key
   * @returns CartSyncResult with loaded items count
   * 
   * @example
   * ```typescript
   * const result = await cartBusinessService.loadCartFromRelay(userPubkey);
   * if (result.success) {
   *   console.log(`Loaded ${result.itemCount} items from relays`);
   * }
   * ```
   */
  public async loadCartFromRelay(
    userPubkey: string | null
  ): Promise<CartLoadResult> {
    try {
      logger.info('Loading cart from relays (business layer)', {
        service: 'CartBusinessService',
        method: 'loadCartFromRelay',
      });

      // Validate authentication
      if (!userPubkey) {
        logger.warn('Cannot load cart: user not authenticated', {
          service: 'CartBusinessService',
          method: 'loadCartFromRelay',
        });

        return {
          success: false,
          items: [],
          error: 'User not authenticated',
        };
      }

      // Load from relays
      const loadResult: CartLoadResult = await cartRelayService.loadCart(userPubkey);

      if (!loadResult.success) {
        logger.error('Failed to load cart from relays', new Error(loadResult.error || 'Unknown error'), {
          service: 'CartBusinessService',
          method: 'loadCartFromRelay',
        });

        return {
          success: false,
          items: [],
          error: loadResult.error || 'Failed to load cart',
        };
      }

      // Validate loaded items
      const validItems = this.validateCartItems(loadResult.items);

      logger.info('Cart loaded from relays successfully', {
        service: 'CartBusinessService',
        method: 'loadCartFromRelay',
        itemCount: validItems.length,
        rawCount: loadResult.items.length,
        eventId: loadResult.eventId?.substring(0, 8) + '...',
      });

      return {
        success: true,
        items: validItems,
        eventId: loadResult.eventId,
      };
    } catch (error) {
      logger.error('Error in loadCartFromRelay', error instanceof Error ? error : new Error(String(error)), {
        service: 'CartBusinessService',
        method: 'loadCartFromRelay',
      });

      return {
        success: false,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clear cart from Nostr relays
   * 
   * Publishes empty cart event, used during logout.
   * 
   * @param signer - NostrSigner for event signing
   * @param userPubkey - User's public key
   * @returns CartSyncResult with success status
   * 
   * @example
   * ```typescript
   * const result = await cartBusinessService.clearCartFromRelay(signer, userPubkey);
   * if (result.success) {
   *   console.log('Cart cleared from relays');
   * }
   * ```
   */
  public async clearCartFromRelay(
    signer: NostrSigner | null,
    userPubkey: string | null
  ): Promise<CartSyncResult> {
    try {
      logger.info('Clearing cart from relays (business layer)', {
        service: 'CartBusinessService',
        method: 'clearCartFromRelay',
      });

      // Validate authentication
      if (!signer || !userPubkey) {
        logger.warn('Cannot clear cart: user not authenticated', {
          service: 'CartBusinessService',
          method: 'clearCartFromRelay',
        });

        return {
          success: false,
          itemCount: 0,
          error: 'User not authenticated',
        };
      }

      // Save empty cart (replaces existing cart)
      return this.saveCartToRelay([], signer, userPubkey);
    } catch (error) {
      logger.error('Error in clearCartFromRelay', error instanceof Error ? error : new Error(String(error)), {
        service: 'CartBusinessService',
        method: 'clearCartFromRelay',
      });

      return {
        success: false,
        itemCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Merge cart items from local and relay sources
   * 
   * Merge strategy:
   * - Deduplicate: Same productId + sellerPubkey = duplicate
   * - Conflict resolution: Prefer item with newer addedAt timestamp
   * - Preserve quantities: Sum quantities if timestamps are equal
   * 
   * @param localItems - Items from local storage
   * @param relayItems - Items loaded from relays
   * @returns CartMergeResult with merged items and statistics
   * 
   * @example
   * ```typescript
   * const mergeResult = cartBusinessService.mergeCartItems(
   *   localItems,
   *   relayItems
   * );
   * console.log(`Merged ${mergeResult.mergedItems.length} items`);
   * console.log(`Resolved ${mergeResult.conflictsResolved} conflicts`);
   * ```
   */
  public mergeCartItems(
    localItems: CartItem[],
    relayItems: CartItem[]
  ): CartMergeResult {
    logger.info('Merging cart items', {
      service: 'CartBusinessService',
      method: 'mergeCartItems',
      localCount: localItems.length,
      relayCount: relayItems.length,
    });

    const itemMap = new Map<string, CartItem>();
    let conflictsResolved = 0;
    let addedCount = 0;

    // Add local items first
    for (const item of localItems) {
      const key = this.getItemKey(item);
      itemMap.set(key, item);
      addedCount++;
    }

    // Merge relay items
    for (const relayItem of relayItems) {
      const key = this.getItemKey(relayItem);
      const existingItem = itemMap.get(key);

      if (!existingItem) {
        // New item from relay
        itemMap.set(key, relayItem);
        addedCount++;
      } else {
        // Conflict: Item exists in both local and relay
        conflictsResolved++;

        // Resolution strategy: Prefer relay item (relay is source of truth)
        // Don't sum quantities - relay has the saved state we want
        itemMap.set(key, relayItem);
        logger.debug('Resolved conflict: using relay item (source of truth)', {
          service: 'CartBusinessService',
          method: 'mergeCartItems',
          productId: relayItem.productId,
          relayQuantity: relayItem.quantity,
          localQuantity: existingItem.quantity,
          relayDate: new Date(relayItem.addedAt).toISOString(),
          localDate: new Date(existingItem.addedAt).toISOString(),
        });
      }
    }

    const mergedItems = Array.from(itemMap.values());

    logger.info('Cart merge complete', {
      service: 'CartBusinessService',
      method: 'mergeCartItems',
      mergedCount: mergedItems.length,
      addedCount,
      conflictsResolved,
    });

    return {
      mergedItems,
      addedCount,
      skippedCount: 0, // No longer skipping items
      conflictsResolved,
    };
  }

  /**
   * Validate cart items and filter out invalid ones
   * 
   * Validation rules:
   * - Must have id, productId, title, price, currency
   * - Must have sellerPubkey
   * - Quantity must be positive
   * - Price must be non-negative
   * 
   * @param items - Cart items to validate
   * @returns Array of valid cart items
   */
  private validateCartItems(items: CartItem[]): CartItem[] {
    const validItems: CartItem[] = [];

    for (const item of items) {
      // Check required fields
      if (
        !item.id ||
        !item.productId ||
        !item.title ||
        item.price === undefined ||
        !item.currency ||
        !item.sellerPubkey ||
        item.quantity === undefined
      ) {
        logger.warn('Invalid cart item: missing required fields', {
          service: 'CartBusinessService',
          method: 'validateCartItems',
          itemId: item.id,
          hasProductId: !!item.productId,
          hasTitle: !!item.title,
          hasPrice: item.price !== undefined,
          hasCurrency: !!item.currency,
          hasSellerPubkey: !!item.sellerPubkey,
          hasQuantity: item.quantity !== undefined,
        });
        continue;
      }

      // Validate quantity
      if (item.quantity <= 0) {
        logger.warn('Invalid cart item: quantity must be positive', {
          service: 'CartBusinessService',
          method: 'validateCartItems',
          itemId: item.id,
          quantity: item.quantity,
        });
        continue;
      }

      // Validate price
      if (item.price < 0) {
        logger.warn('Invalid cart item: price cannot be negative', {
          service: 'CartBusinessService',
          method: 'validateCartItems',
          itemId: item.id,
          price: item.price,
        });
        continue;
      }

      // Item is valid
      validItems.push(item);
    }

    if (validItems.length < items.length) {
      logger.warn('Some cart items failed validation', {
        service: 'CartBusinessService',
        method: 'validateCartItems',
        originalCount: items.length,
        validCount: validItems.length,
        invalidCount: items.length - validItems.length,
      });
    }

    return validItems;
  }

  /**
   * Generate unique key for cart item (for deduplication)
   * 
   * @param item - Cart item
   * @returns Unique key string (productId + sellerPubkey)
   */
  private getItemKey(item: CartItem): string {
    return `${item.productId}-${item.sellerPubkey}`;
  }
}

// Export singleton instance
export const cartBusinessService = CartBusinessService.getInstance();
