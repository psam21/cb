# Shop Product Fetching Requirements

## Overview

This document defines the requirements for how the Nostr shop should fetch and display products, ensuring it follows the decentralized, relay-based architecture.

## Core Requirements

### 1. Primary Data Source: Nostr Relays
- **Products MUST be loaded from Nostr relays on page load**
- **No central database** - all product data comes from Kind 23 events
- **Real-time data** - products are fetched fresh from relays each time
- **Decentralized** - no single point of failure

### 2. Product Discovery
- **Query Kind 23 events** with `["t", "culture-bridge-shop"]` tag
- **Search across all configured relays** (6 production relays)
- **Parse events into product objects** using standard NIP-23 structure
- **Show latest revisions only** - ignore older revisions of the same product

### 3. Fallback Strategy
- **Primary**: Query from Nostr relays
- **Fallback**: Local store (for products created in current session)
- **Error handling**: Clear error messages if both fail

### 4. User Experience
- **Loading states** during relay queries
- **Progress indicators** showing query progress
- **Error messages** if relay queries fail
- **Empty states** when no products found

## Implementation Details

### Query Process
1. **On page load**: Call `queryProductsFromRelays()`
2. **Create filters**: `{ kinds: [23], '#t': ['culture-bridge-shop'] }`
3. **Query all relays**: Use `GenericRelayService.queryEvents()`
4. **Parse events**: Convert Kind 23 events to `ShopProduct` objects
5. **Update store**: Add products to local store for caching
6. **Display products**: Show in product grid

### Event Structure
Products are stored as **Kind 23 events** with this structure:
```json
{
  "kind": 23,
  "content": "{\"title\":\"Product Title\",\"content\":\"Description\",\"summary\":\"Summary\",\"published_at\":1234567890,\"tags\":[\"culture-bridge-shop\"],\"language\":\"en\",\"region\":\"global\",\"permissions\":\"public\",\"file_id\":\"blossom-hash\",\"file_type\":\"image/jpeg\",\"file_size\":1024000}",
  "tags": [
    ["t", "culture-bridge-shop"],
    ["price", "199.99"],
    ["currency", "USD"],
    ["category", "Electronics"],
    ["condition", "new"],
    ["contact", "seller@example.com"],
    ["f", "blossom-file-hash"],
    ["type", "image/jpeg"],
    ["size", "1024000"]
  ]
}
```

### Required Tags
- **`["t", "culture-bridge-shop"]`** - Identifies as shop product
- **`["price", "amount"]`** - Product price
- **`["currency", "code"]`** - Currency code (USD, EUR, etc.)
- **`["category", "name"]`** - Product category
- **`["condition", "state"]`** - Product condition (new, used, refurbished)
- **`["contact", "info"]`** - Seller contact information
- **`["f", "hash"]`** - Blossom file hash for image
- **`["type", "mime"]`** - File MIME type
- **`["size", "bytes"]`** - File size in bytes

### Error Handling
- **Relay failures**: Show warning but continue with available relays
- **No products found**: Show empty state with call-to-action
- **Network errors**: Show retry button
- **Parse errors**: Log error but don't break the UI

## Testing Requirements

### Manual Testing
1. **Create a product** using the shop form
2. **Verify it appears** in the shop immediately
3. **Refresh the page** - product should still appear (loaded from relays)
4. **Check different browsers** - product should be visible to all users
5. **Test with different signers** - products should be discoverable

### Verification Steps
1. **Event ID verification**: Check that event ID is shown
2. **Relay verification**: Verify product is published to relays
3. **Image verification**: Confirm image loads from Blossom
4. **Data verification**: Check all product fields are correct

## Current Status

### ✅ Implemented
- Product creation and publishing to relays
- Local product storage for session
- Product display components
- Error handling and loading states

### ❌ Missing (Fixed in this update)
- **Relay querying on page load** - was only checking local store
- **Product discovery from relays** - now implemented
- **Fallback strategy** - now implemented

## Future Enhancements

### Caching Strategy
- **Local caching** of recently viewed products
- **Background refresh** of product data
- **Optimistic updates** for better UX

### Performance Optimizations
- **Pagination** for large product catalogs
- **Image lazy loading** for better performance
- **Search indexing** for faster queries

### Advanced Features
- **Product filtering** by category, price, condition
- **Search functionality** across product titles and descriptions
- **Sorting options** by date, price, popularity
- **Product revisions** showing update history

## Notes

- **No database required** - everything is stored on Nostr relays
- **Fully decentralized** - no single point of failure
- **User-controlled** - users own their product data
- **Protocol-native** - uses standard Nostr features
- **Future-proof** - can be extended with more features
