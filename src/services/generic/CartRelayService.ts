/**
 * CartRelayService.ts
 * Generic Layer - Cart Relay Storage and Retrieval
 * 
 * Handles cart persistence to Nostr relays using NIP-78 (Application-Specific Data).
 * Implements cross-device cart synchronization with unified settings architecture.
 * 
 * Event Kind: 30078 (Parameterized Replaceable Application-Specific Data)
 * Event Structure:
 * - kind: 30078
 * - tags: [
 *     ['d', 'culture-bridge-settings'],        // Single d tag for ALL app data
 *     ['t', 'culture-bridge'],                 // Discovery tag
 *     ['culture-bridge-cart-details', 'v1']    // Cart-specific metadata tag
 *   ]
 * - content: JSON.stringify({
 *     cart: [...cartItems],                    // Cart data
 *     bookmarks: [...],                        // Future: bookmarks
 *     preferences: {...}                       // Future: user preferences
 *   })
 * 
 * Architecture Benefits:
 * - Single event per user (less relay storage)
 * - Multiple features share one event (organized by content keys)
 * - Tags provide queryable metadata (cart version, timestamps, etc.)
 * - Backwards compatible (can add features without breaking existing)
 * 
 * Privacy Model:
 * - Cart data stored in plaintext in event.content (NOT encrypted)
 * - Reasoning: Cart needs to be queryable and accessible across devices
 * - Security: Events are signed by user's pubkey, only they can update
 * - Data: Product IDs, prices, quantities (no personal payment info)
 * 
 * NIP-33 Behavior:
 * - Replaceable event (d tag = 'culture-bridge-settings')
 * - Publishing new settings overwrites previous one
 * - Only most recent settings event exists on relay
 * - Multiple features co-exist in content, organized by keys
 * 
 * @architecture Generic Layer - Application Data Persistence
 * @singleton Stateless
 * @layer Generic (reusable relay operations)
 * @pattern Repository (data access abstraction)
 * 
 * @see https://github.com/nostr-protocol/nips/blob/master/78.md (NIP-78)
 * @see https://github.com/nostr-protocol/nips/blob/master/33.md (NIP-33)
 */

import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent } from '../../types/nostr';
import { CartItem } from '../../types/cart';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
import { publishEvent, queryEvents, RelayQueryResult } from './GenericRelayService';
import { nostrEventService } from '../nostr/NostrEventService';

const SETTINGS_EVENT_KIND = 30078; // NIP-78 Application-Specific Data
const SETTINGS_D_TAG = 'culture-bridge-settings'; // Single identifier for ALL app settings
const CART_CONTENT_KEY = 'cart'; // Key in content object for cart data
const CART_TAG_NAME = 'culture-bridge-cart-details'; // Tag for cart metadata

export interface CartSaveResult {
  success: boolean;
  eventId?: string;
  publishedRelays: string[];
  failedRelays: string[];
  error?: string;
}

export interface CartLoadResult {
  success: boolean;
  items: CartItem[];
  error?: string;
  eventId?: string;
}

/**
 * Generic Cart Relay Service - Cart persistence to Nostr relays
 * 
 * @architecture Generic Layer - Repository Pattern
 * @singleton Stateless
 * @responsibilities
 * - Save cart to relays (Kind 30078)
 * - Load cart from relays
 * - Clear cart from relays
 * 
 * @pattern Repository (abstracts relay storage operations)
 */
export class CartRelayService {
  private static instance: CartRelayService;

  private constructor() {}

  /**
   * Get singleton instance of CartRelayService
   */
  public static getInstance(): CartRelayService {
    if (!CartRelayService.instance) {
      CartRelayService.instance = new CartRelayService();
    }
    return CartRelayService.instance;
  }

  /**
   * Save cart items to Nostr relays
   * 
   * Creates Kind 30078 parameterized replaceable event with cart data.
   * Replaces any existing cart event on relays.
   * 
   * @param items - Array of cart items to save
   * @param signer - NostrSigner for event signing
   * @param userPubkey - User's public key
   * @returns CartSaveResult with success status and relay results
   * 
   * @throws AppError if signer is invalid or signing fails
   * 
   * @example
   * ```typescript
   * const result = await cartRelayService.saveCart(cartItems, signer, userPubkey);
   * if (result.success) {
   *   console.log(`Cart saved to ${result.publishedRelays.length} relays`);
   * }
   * ```
   */
  public async saveCart(
    items: CartItem[],
    signer: NostrSigner,
    userPubkey: string
  ): Promise<CartSaveResult> {
    try {
      logger.info('Saving cart to relays', {
        service: 'CartRelayService',
        method: 'saveCart',
        itemCount: items.length,
        userPubkey: userPubkey.substring(0, 8) + '...',
      });

      // Validate signer
      if (!signer || !signer.signEvent) {
        throw new AppError(
          'Invalid signer provided',
          ErrorCode.SIGNER_ERROR,
          HttpStatus.BAD_REQUEST,
          ErrorCategory.AUTHENTICATION,
          ErrorSeverity.HIGH,
          { userPubkey: userPubkey.substring(0, 8) + '...' }
        );
      }

      // Create unsigned event via NostrEventService (SOA compliance)
      logger.info('Creating cart event via NostrEventService', {
        service: 'CartRelayService',
        method: 'saveCart',
        itemCount: items.length,
      });

      const unsignedEvent = nostrEventService.createCartEvent(items, userPubkey);

      // Sign event
      logger.info('Signing cart event', {
        service: 'CartRelayService',
        method: 'saveCart',
        kind: SETTINGS_EVENT_KIND,
        dTag: SETTINGS_D_TAG,
      });

      const signedEvent = await signer.signEvent(unsignedEvent);

      if (!signedEvent || !signedEvent.id) {
        throw new AppError(
          'Failed to sign cart event',
          ErrorCode.SIGNER_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCategory.EXTERNAL_SERVICE,
          ErrorSeverity.HIGH,
          { userPubkey: userPubkey.substring(0, 8) + '...' }
        );
      }

      // Publish to relays
      logger.info('Publishing cart event to relays', {
        service: 'CartRelayService',
        method: 'saveCart',
        eventId: signedEvent.id.substring(0, 8) + '...',
      });

      const publishResult = await publishEvent(signedEvent, signer);

      logger.info('Cart save result', {
        service: 'CartRelayService',
        method: 'saveCart',
        success: publishResult.success,
        publishedRelays: publishResult.publishedRelays.length,
        failedRelays: publishResult.failedRelays.length,
        eventId: signedEvent.id.substring(0, 8) + '...',
      });

      return {
        success: publishResult.success,
        eventId: signedEvent.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
        error: publishResult.success ? undefined : 'Some relays failed to publish cart',
      };
    } catch (error) {
      logger.error('Failed to save cart to relays', error instanceof Error ? error : new Error(String(error)), {
        service: 'CartRelayService',
        method: 'saveCart',
        userPubkey: userPubkey.substring(0, 8) + '...',
        itemCount: items.length,
      });

      // Re-throw AppErrors as-is
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `Failed to save cart to relays: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.NOSTR_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.EXTERNAL_SERVICE,
        ErrorSeverity.MEDIUM,
        { userPubkey: userPubkey.substring(0, 8) + '...' }
      );
    }
  }

  /**
   * Load cart items from Nostr relays
   * 
   * Queries relays for user's Kind 30078 cart event.
   * Returns empty array if no cart found.
   * 
   * @param userPubkey - User's public key
   * @returns CartLoadResult with cart items or empty array
   * 
   * @example
   * ```typescript
   * const result = await cartRelayService.loadCart(userPubkey);
   * if (result.success && result.items.length > 0) {
   *   console.log(`Loaded ${result.items.length} items from cart`);
   * }
   * ```
   */
  public async loadCart(userPubkey: string): Promise<CartLoadResult> {
    try {
      logger.info('Loading cart from relays', {
        service: 'CartRelayService',
        method: 'loadCart',
        userPubkey: userPubkey.substring(0, 8) + '...',
      });

      // Query relays for unified settings event (NEW format)
      const newFormatFilters = [{
        kinds: [SETTINGS_EVENT_KIND],
        authors: [userPubkey],
        '#d': [SETTINGS_D_TAG],
        limit: 1, // NIP-33 ensures only one event with this d tag exists
      }];

      const newFormatResult: RelayQueryResult = await queryEvents(newFormatFilters);

      // Check if new format exists
      if (newFormatResult.success && newFormatResult.events && newFormatResult.events.length > 0) {
        const settingsEvent = newFormatResult.events[0];
        let items: CartItem[] = [];

        try {
          const settingsData = JSON.parse(settingsEvent.content);
          // Extract cart from unified settings object
          items = settingsData[CART_CONTENT_KEY] || [];
          
          logger.info('Cart loaded successfully (new format)', {
            service: 'CartRelayService',
            method: 'loadCart',
            itemCount: items.length,
            eventId: settingsEvent.id.substring(0, 8) + '...',
          });

          return {
            success: true,
            items,
            eventId: settingsEvent.id,
          };
        } catch (parseError) {
          logger.error('Failed to parse new format settings content', parseError instanceof Error ? parseError : new Error(String(parseError)), {
            service: 'CartRelayService',
            method: 'loadCart',
            eventId: settingsEvent.id.substring(0, 8) + '...',
          });
          // Don't return error yet, try old format as fallback
        }
      }

      // Fallback: Try OLD format for backwards compatibility
      logger.info('New format not found, checking old format', {
        service: 'CartRelayService',
        method: 'loadCart',
        userPubkey: userPubkey.substring(0, 8) + '...',
      });

      const oldFormatFilters = [{
        kinds: [SETTINGS_EVENT_KIND],
        authors: [userPubkey],
        '#d': ['shopping-cart'], // OLD d tag
        limit: 1,
      }];

      const oldFormatResult: RelayQueryResult = await queryEvents(oldFormatFilters);

      // No cart found in either format
      if (!oldFormatResult.success || !oldFormatResult.events || oldFormatResult.events.length === 0) {
        logger.info('No cart found on relays (checked both formats)', {
          service: 'CartRelayService',
          method: 'loadCart',
          userPubkey: userPubkey.substring(0, 8) + '...',
        });

        return {
          success: true,
          items: [],
        };
      }

      // Parse OLD format (flat array in content)
      const oldCartEvent = oldFormatResult.events[0];
      let items: CartItem[] = [];

      try {
        items = JSON.parse(oldCartEvent.content); // OLD format: direct array
        
        logger.info('Cart loaded successfully (old format) - MIGRATION NEEDED', {
          service: 'CartRelayService',
          method: 'loadCart',
          itemCount: items.length,
          eventId: oldCartEvent.id.substring(0, 8) + '...',
          migrationPending: true,
        });

        // Note: Migration to new format will happen automatically on next save
        return {
          success: true,
          items,
          eventId: oldCartEvent.id,
        };
      } catch (parseError) {
        logger.error('Failed to parse old format cart content', parseError instanceof Error ? parseError : new Error(String(parseError)), {
          service: 'CartRelayService',
          method: 'loadCart',
          eventId: oldCartEvent.id.substring(0, 8) + '...',
        });

        return {
          success: false,
          items: [],
          error: 'Failed to parse cart data from both formats',
        };
      }
    } catch (error) {
      logger.error('Failed to load cart from relays', error instanceof Error ? error : new Error(String(error)), {
        service: 'CartRelayService',
        method: 'loadCart',
        userPubkey: userPubkey.substring(0, 8) + '...',
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
   * Publishes empty cart event to replace existing cart.
   * Used during logout to clear user's cart from relays.
   * 
   * @param signer - NostrSigner for event signing
   * @param userPubkey - User's public key
   * @returns CartSaveResult with success status
   * 
   * @example
   * ```typescript
   * const result = await cartRelayService.clearCart(signer, userPubkey);
   * if (result.success) {
   *   console.log('Cart cleared from relays');
   * }
   * ```
   */
  public async clearCart(
    signer: NostrSigner,
    userPubkey: string
  ): Promise<CartSaveResult> {
    logger.info('Clearing cart from relays', {
      service: 'CartRelayService',
      method: 'clearCart',
      userPubkey: userPubkey.substring(0, 8) + '...',
    });

    // Save empty cart (replaces existing cart event)
    return this.saveCart([], signer, userPubkey);
  }
}

// Export singleton instance
export const cartRelayService = CartRelayService.getInstance();
