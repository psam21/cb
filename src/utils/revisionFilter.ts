import { ShopProduct } from '@/services/business/ShopBusinessService';

/**
 * Legacy filter function - kept for compatibility.
 * 
 * NOTE: This function is no longer needed because:
 * 1. NIP-33 parameterized replaceable events (Kind 30023) are automatically handled by Nostr relays
 * 2. Relays return only the latest event for each 'd' tag
 * 3. The 'r:' revision tags this function looked for were never implemented
 * 
 * TODO: Remove this function and update calling pages to use products directly
 * 
 * @param products - Array of products from relay
 * @returns Same array (no filtering needed)
 */
export function filterLatestRevisions(products: ShopProduct[]): ShopProduct[] {
  // NIP-33 replaceable events are handled by relays - no client-side filtering needed
  return products;
}

/**
 * Legacy grouping function - no longer used.
 * 
 * @deprecated Use relay-level filtering instead
 */
export function groupProductsByRevision(products: ShopProduct[]): Map<string, ShopProduct[]> {
  const groups = new Map<string, ShopProduct[]>();
  
  products.forEach(product => {
    if (!groups.has(product.eventId)) {
      groups.set(product.eventId, []);
    }
    groups.get(product.eventId)!.push(product);
  });
  
  return groups;
}
