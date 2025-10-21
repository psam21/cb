/**
 * PurchaseBusinessService.ts
 * Business Layer - Purchase Intent Operations
 * 
 * Handles purchase intent preparation and validation.
 * Orchestrates communication with sellers via encrypted messaging.
 * SOA-compliant: Business Layer → Message Service
 * 
 * @see docs/shop-purchase-flow.md - Feature #3: Purchase Intent
 */

import { logger } from '../core/LoggingService';
import { CartItem } from '@/types/cart';
import { 
  PurchaseIntent, 
  PurchaseIntentItem, 
  PurchaseIntentBySeller,
  PurchaseIntentResult 
} from '@/types/purchase';
import { NostrSigner } from '@/types/nostr';
import { MessagingBusinessService } from './MessagingBusinessService';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';
import { nip19 } from 'nostr-tools';

// Currency conversion rates (must match useCartStore)
const CURRENCY_TO_SATS: Record<string, number> = {
  'BTC': 100_000_000, // 1 BTC = 100M sats
  'SATS': 1,
  'SAT': 1,
  'SATOSHIS': 1,
  'USD': 3_000, // Approximate: $30k per BTC
  'EUR': 3_200,
  'GBP': 3_500,
};

export class PurchaseBusinessService {
  private static instance: PurchaseBusinessService;
  private messagingService: MessagingBusinessService;

  private constructor() {
    this.messagingService = MessagingBusinessService.getInstance();
  }

  public static getInstance(): PurchaseBusinessService {
    if (!PurchaseBusinessService.instance) {
      PurchaseBusinessService.instance = new PurchaseBusinessService();
    }
    return PurchaseBusinessService.instance;
  }

  /**
   * Validate cart before sending purchase intent
   * 
   * @param items - Cart items to validate
   * @returns Validation result with errors if any
   */
  public validateCart(items: CartItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!items || items.length === 0) {
      errors.push('Cart is empty');
    }

    // Check each item has required fields
    items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Missing product ID`);
      }
      if (!item.title) {
        errors.push(`Item ${index + 1}: Missing product title`);
      }
      if (!item.sellerPubkey) {
        errors.push(`Item ${index + 1}: Missing seller public key`);
      }
      if (item.quantity < 1) {
        errors.push(`Item ${index + 1} (${item.title}): Invalid quantity`);
      }
      if (item.price <= 0) {
        errors.push(`Item ${index + 1} (${item.title}): Invalid price`);
      }
      if (!item.currency) {
        errors.push(`Item ${index + 1} (${item.title}): Missing currency`);
      }
    });

    logger.info('Cart validation completed', {
      service: 'PurchaseBusinessService',
      method: 'validateCart',
      itemCount: items.length,
      valid: errors.length === 0,
      errorCount: errors.length,
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Group cart items by seller
   * 
   * @param items - Cart items to group
   * @returns Array of purchase intents grouped by seller
   */
  public groupBySeller(items: CartItem[]): PurchaseIntentBySeller[] {
    const sellerMap = new Map<string, PurchaseIntentBySeller>();

    items.forEach(item => {
      const sellerPubkey = item.sellerPubkey;
      
      if (!sellerMap.has(sellerPubkey)) {
        sellerMap.set(sellerPubkey, {
          sellerPubkey,
          products: [],
          totalSats: 0,
        });
      }

      const sellerIntent = sellerMap.get(sellerPubkey)!;
      
      // Convert item to purchase intent item
      const intentItem: PurchaseIntentItem = {
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        imageUrl: item.imageUrl,
      };

      sellerIntent.products.push(intentItem);

      // Calculate item total in sats
      const currencyUpper = item.currency.toUpperCase();
      const conversionRate = CURRENCY_TO_SATS[currencyUpper] || CURRENCY_TO_SATS['USD'];
      const itemTotalSats = item.price * item.quantity * conversionRate;
      sellerIntent.totalSats += itemTotalSats;
    });

    const grouped = Array.from(sellerMap.values());

    logger.info('Cart items grouped by seller', {
      service: 'PurchaseBusinessService',
      method: 'groupBySeller',
      totalItems: items.length,
      sellerCount: grouped.length,
      sellers: grouped.map(g => ({
        sellerPubkey: g.sellerPubkey,
        productCount: g.products.length,
        totalSats: g.totalSats,
      })),
    });

    return grouped;
  }

  /**
   * Format sats with thousand separators for readability
   */
  private formatSats(sats: number): string {
    return sats.toLocaleString('en-US');
  }

  /**
   * Format timestamp to readable date/time
   */
  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Prepare purchase intent message content as human-readable formatted text
   * 
   * @param sellerIntent - Purchase intent for a specific seller
   * @param buyerPubkey - Buyer's public key for generating intent ID
   * @returns Formatted message string for NIP-17 message content
   */
  public preparePurchaseIntent(sellerIntent: PurchaseIntentBySeller, buyerPubkey: string): string {
    const timestamp = Date.now();
    const buyerNpub = nip19.npubEncode(buyerPubkey);
    const intentId = `pi_${buyerNpub}_${timestamp}`;
    
    // Build the formatted message
    let message = '';
    
    // Header
    message += '╔══════════════════════════════════════════════════════════════╗\n';
    message += '║           🛒  NEW PURCHASE REQUEST                           ║\n';
    message += '╚══════════════════════════════════════════════════════════════╝\n\n';
    
    // Order Info
    message += '📋 ORDER DETAILS\n';
    message += '─────────────────────────────────────────────────────────────\n';
    message += `Order ID:     ${intentId}\n`;
    message += `Date:         ${this.formatDate(timestamp)}\n`;
    message += `From:         ${buyerNpub}\n\n`;
    
    // Products Table
    message += '📦 ITEMS REQUESTED\n';
    message += '─────────────────────────────────────────────────────────────\n\n';
    
    sellerIntent.products.forEach((product, index) => {
      const subtotal = product.price * product.quantity;
      
      message += `${index + 1}. ${product.title}\n`;
      message += '   ┌─────────────────────────────────────────────────────┐\n';
      message += `   │ Product ID:  ${product.productId.padEnd(38)} │\n`;
      message += `   │ Quantity:    ${String(product.quantity).padEnd(38)} │\n`;
      message += `   │ Unit Price:  ${this.formatSats(product.price)} ${product.currency}`.padEnd(52) + ' │\n';
      message += `   │ Subtotal:    ${this.formatSats(subtotal)} ${product.currency}`.padEnd(52) + ' │\n';
      
      if (product.imageUrl) {
        message += `   │ Image:       ${product.imageUrl.substring(0, 35)}... │\n`;
      }
      
      message += '   └─────────────────────────────────────────────────────┘\n';
      
      if (index < sellerIntent.products.length - 1) {
        message += '\n';
      }
    });
    
    // Total
    message += '\n─────────────────────────────────────────────────────────────\n';
    message += `💰 TOTAL:  ${this.formatSats(sellerIntent.totalSats)} sats\n`;
    message += '─────────────────────────────────────────────────────────────\n\n';
    
    // Next Steps
    message += '📝 NEXT STEPS\n';
    message += '─────────────────────────────────────────────────────────────\n';
    message += 'Please reply with:\n';
    message += '  ✓ Payment link (Lightning invoice or Bitcoin address)\n';
    message += '  ✓ Shipping quote (if applicable)\n';
    message += '  ✓ Estimated delivery time\n\n';
    
    // Footer
    message += '⚠️  IMPORTANT\n';
    message += '─────────────────────────────────────────────────────────────\n';
    message += 'This is a purchase intent, not a confirmed order.\n';
    message += 'No items have been reserved or charged.\n\n';
    
    message += '─────────────────────────────────────────────────────────────\n';
    message += 'Powered by CultureBridge • Nostr-Native Commerce\n';
    message += '─────────────────────────────────────────────────────────────\n';

    logger.info('Purchase intent prepared', {
      service: 'PurchaseBusinessService',
      method: 'preparePurchaseIntent',
      sellerPubkey: sellerIntent.sellerPubkey,
      productCount: sellerIntent.products.length,
      totalSats: sellerIntent.totalSats,
      intentId,
    });

    return message;
  }

  /**
   * Send purchase intent to all sellers via encrypted messaging (NIP-17)
   * 
   * @param items - Cart items to send
   * @param signer - Nostr signer for encryption and signing
   * @param onProgress - Optional callback for progress updates
   * @returns Result of purchase intent sends
   */
  public async sendPurchaseIntent(
    items: CartItem[],
    signer: NostrSigner,
    onProgress?: (current: number, total: number, sellerPubkey: string) => void
  ): Promise<PurchaseIntentResult> {
    logger.info('Sending purchase intent', {
      service: 'PurchaseBusinessService',
      method: 'sendPurchaseIntent',
      itemCount: items.length,
    });    // Validate cart
    const validation = this.validateCart(items);
    if (!validation.valid) {
      logger.error('Cart validation failed', new Error('Cart validation failed'), {
        service: 'PurchaseBusinessService',
        method: 'sendPurchaseIntent',
        errors: validation.errors,
      });

      throw new AppError(
        `Cart validation failed: ${validation.errors.join(', ')}`,
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM
      );
    }

    // Group by seller
    const sellerGroups = this.groupBySeller(items);

    // Get buyer pubkey for intent ID generation
    const buyerPubkey = await signer.getPublicKey();

    // Send to each seller
    const results: PurchaseIntentResult['details'] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < sellerGroups.length; i++) {
      const sellerGroup = sellerGroups[i];
      
      try {
        // Prepare message content with intent ID
        const messageContent = this.preparePurchaseIntent(sellerGroup, buyerPubkey);

        // Send encrypted message via NIP-17
        const sendResult = await this.messagingService.sendMessage(
          sellerGroup.sellerPubkey,
          messageContent,
          signer
        );

        if (sendResult.success) {
          successCount++;
          results.push({
            sellerPubkey: sellerGroup.sellerPubkey,
            success: true,
          });

          logger.info('Purchase intent sent to seller', {
            service: 'PurchaseBusinessService',
            method: 'sendPurchaseIntent',
            sellerPubkey: sellerGroup.sellerPubkey,
            messageId: sendResult.message?.id,
          });
          
          // Report progress
          if (onProgress) {
            onProgress(i + 1, sellerGroups.length, sellerGroup.sellerPubkey);
          }
        } else {
          failureCount++;
          results.push({
            sellerPubkey: sellerGroup.sellerPubkey,
            success: false,
            error: sendResult.error || 'Unknown error',
          });

          logger.error('Failed to send purchase intent to seller', new Error(sendResult.error || 'Unknown error'), {
            service: 'PurchaseBusinessService',
            method: 'sendPurchaseIntent',
            sellerPubkey: sellerGroup.sellerPubkey,
          });
          
          // Report progress even on failure
          if (onProgress) {
            onProgress(i + 1, sellerGroups.length, sellerGroup.sellerPubkey);
          }
        }
      } catch (error) {
        failureCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          sellerPubkey: sellerGroup.sellerPubkey,
          success: false,
          error: errorMessage,
        });

        logger.error('Exception sending purchase intent', error instanceof Error ? error : new Error('Unknown error'), {
          service: 'PurchaseBusinessService',
          method: 'sendPurchaseIntent',
          sellerPubkey: sellerGroup.sellerPubkey,
        });
        
        // Report progress even on exception
        if (onProgress) {
          onProgress(i + 1, sellerGroups.length, sellerGroup.sellerPubkey);
        }
      }
    }

    const result: PurchaseIntentResult = {
      success: failureCount === 0,
      sellerCount: sellerGroups.length,
      successCount,
      failureCount,
      error: failureCount > 0 ? `Failed to send to ${failureCount} seller(s)` : undefined,
      details: results,
    };

    logger.info('Purchase intent send completed', {
      service: 'PurchaseBusinessService',
      method: 'sendPurchaseIntent',
      success: result.success,
      sellerCount: result.sellerCount,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });

    return result;
  }
}

// Export singleton instance
export const purchaseBusinessService = PurchaseBusinessService.getInstance();
