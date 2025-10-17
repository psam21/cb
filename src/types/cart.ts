/**
 * Cart Type Definitions
 * 
 * Client-side shopping cart for multi-item purchasing.
 * Cart persists across sessions using Zustand persist middleware.
 */

export interface CartItem {
  /** Unique identifier for cart item (productId + timestamp for uniqueness) */
  id: string;
  
  /** Product event ID (dTag from Kind 30023 event) */
  productId: string;
  
  /** Product title */
  title: string;
  
  /** Product price per unit */
  price: number;
  
  /** Currency (BTC, sats, USD, etc.) */
  currency: string;
  
  /** Quantity in cart */
  quantity: number;
  
  /** Product image URL (first image from product) */
  imageUrl?: string;
  
  /** Seller's nostr pubkey */
  sellerPubkey: string;
  
  /** Maximum available quantity (for validation) */
  maxQuantity?: number;
  
  /** When item was added to cart */
  addedAt: number;
}

export interface Cart {
  /** Array of cart items */
  items: CartItem[];
  
  /** Total number of items in cart (sum of quantities) */
  itemCount: number;
  
  /** Cart total in sats (normalized from all currencies) */
  totalSats: number;
  
  /** Last updated timestamp */
  updatedAt: number;
}

export interface AddToCartParams {
  productId: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  sellerPubkey: string;
  maxQuantity?: number;
  quantity?: number; // Default: 1
}
