/**
 * Purchase Intent Type Definitions
 * 
 * Handles private purchase intent communication between buyer and seller via NIP-17.
 * This is the first step in the purchase flow before payment.
 */

/**
 * Individual product item in a purchase intent
 */
export interface PurchaseIntentItem {
  /** Product event ID (dTag from Kind 30023 event) */
  productId: string;
  
  /** Product title */
  title: string;
  
  /** Quantity being purchased */
  quantity: number;
  
  /** Price per unit */
  price: number;
  
  /** Currency (BTC, sats, USD, etc.) */
  currency: string;
  
  /** Product image URL (optional) */
  imageUrl?: string;
}

/**
 * Purchase intent message sent to seller via NIP-17
 * 
 * This is the JSON structure sent in the encrypted message content.
 * The buyer's pubkey is in the NIP-17 envelope (sender), not in the message content.
 */
export interface PurchaseIntent {
  /** Message type identifier */
  type: 'purchase-intent';
  
  /** Unique intent ID for tracking (format: pi_<pubkey8>_<timestamp>) */
  intentId: string;
  
  /** Array of products being purchased from this seller */
  products: PurchaseIntentItem[];
  
  /** Total amount in sats (normalized across all currencies) */
  totalSats: number;
  
  /** Timestamp when intent was created */
  timestamp: number;
  
  /** Optional: Cart ID for tracking */
  cartId?: string;
}

/**
 * Purchase intent grouped by seller
 * Used to organize cart items before sending to multiple sellers
 */
export interface PurchaseIntentBySeller {
  /** Seller's nostr pubkey */
  sellerPubkey: string;
  
  /** Products from this seller */
  products: PurchaseIntentItem[];
  
  /** Total for this seller's products (in sats) */
  totalSats: number;
}

/**
 * Response from seller (future - not implemented in Feature #3)
 * This will be used in Feature #4 when seller confirms stock
 */
export interface PurchaseResponse {
  /** Message type identifier */
  type: 'purchase-response';
  
  /** Reference to original purchase intent timestamp */
  intentTimestamp: number;
  
  /** Stock confirmation status */
  stockConfirmed: boolean;
  
  /** Products that are available */
  availableProducts: {
    productId: string;
    availableQuantity: number;
  }[];
  
  /** Products that are unavailable or out of stock */
  unavailableProducts?: {
    productId: string;
    reason: string;
  }[];
  
  /** Timestamp of response */
  timestamp: number;
}

/**
 * Purchase intent send result
 */
export interface PurchaseIntentResult {
  /** Whether all intents were sent successfully */
  success: boolean;
  
  /** Number of sellers the intent was sent to */
  sellerCount: number;
  
  /** Number of successful sends */
  successCount: number;
  
  /** Number of failed sends */
  failureCount: number;
  
  /** Error message if any */
  error?: string;
  
  /** Details of each send attempt */
  details: {
    sellerPubkey: string;
    success: boolean;
    error?: string;
  }[];
}
