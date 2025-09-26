import { ShopProduct } from '@/services/business/ShopBusinessService';

/**
 * Filters products to show only the latest revision of each product.
 * Groups products by their original event ID and returns only the most recent version.
 * 
 * @param products - Array of all fetched products
 * @returns Array of products with only the latest revision of each
 */
export function filterLatestRevisions(products: ShopProduct[]): ShopProduct[] {
  if (!products || products.length === 0) {
    return [];
  }

  // Group products by original event ID
  const revisionGroups = new Map<string, ShopProduct[]>();
  
  products.forEach(product => {
    // Check if this product has 'r' tags (is a revision)
    const revisionTags = product.tags?.filter(tag => tag.startsWith('r:')) || [];
    
    if (revisionTags.length > 0) {
      // This is a revision - group by the referenced event ID
      const originalEventId = revisionTags[0].substring(2); // Remove 'r:' prefix
      if (!revisionGroups.has(originalEventId)) {
        revisionGroups.set(originalEventId, []);
      }
      revisionGroups.get(originalEventId)!.push(product);
    } else {
      // This is an original product - group by its own event ID
      if (!revisionGroups.has(product.eventId)) {
        revisionGroups.set(product.eventId, []);
      }
      revisionGroups.get(product.eventId)!.push(product);
    }
  });
  
  // For each group, find the latest revision by timestamp
  const latestProducts: ShopProduct[] = [];
  
  revisionGroups.forEach((revisions, originalEventId) => {
    // Sort by timestamp (latest first)
    const sortedRevisions = revisions.sort((a, b) => b.publishedAt - a.publishedAt);
    latestProducts.push(sortedRevisions[0]); // Take the latest
  });
  
  return latestProducts;
}

/**
 * Groups products by their revision chains for debugging or advanced display.
 * 
 * @param products - Array of all fetched products
 * @returns Map of original event ID to array of all revisions (including original)
 */
export function groupProductsByRevision(products: ShopProduct[]): Map<string, ShopProduct[]> {
  const revisionGroups = new Map<string, ShopProduct[]>();
  
  products.forEach(product => {
    const revisionTags = product.tags?.filter(tag => tag.startsWith('r:')) || [];
    
    if (revisionTags.length > 0) {
      const originalEventId = revisionTags[0].substring(2);
      if (!revisionGroups.has(originalEventId)) {
        revisionGroups.set(originalEventId, []);
      }
      revisionGroups.get(originalEventId)!.push(product);
    } else {
      if (!revisionGroups.has(product.eventId)) {
        revisionGroups.set(product.eventId, []);
      }
      revisionGroups.get(product.eventId)!.push(product);
    }
  });
  
  return revisionGroups;
}
