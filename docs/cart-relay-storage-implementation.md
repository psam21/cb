# Cart Storage: Nostr Relay Implementation Plan

## Overview
Migrate cart from localStorage-only to Nostr relay storage for cross-device sync and persistence.

## Architecture

### Event Structure (NIP-78)
```json
{
  "kind": 30078,
  "tags": [
    ["d", "shopping-cart"],
    ["encrypted", "true"]
  ],
  "content": "{encrypted JSON of cart items}",
  "created_at": 1729267890,
  "pubkey": "user's pubkey",
  "sig": "..."
}
```

### Data Flow
```
1. User adds item to cart
   ↓
2. Update local state (instant feedback)
   ↓
3. Debounce writes to relay (batch updates)
   ↓
4. Write encrypted event to user's relays
   ↓
5. On login/device sync: Fetch cart from relays
   ↓
6. Merge with local cart if any
```

## Implementation Steps

### Phase 1: Dual Storage (Backwards Compatible)
- Keep localStorage as primary
- Add relay writes as secondary
- Read from relays on login
- Merge relay + local carts

### Phase 2: Relay Primary
- Relay becomes source of truth
- localStorage becomes cache
- Sync on every cart change

### Phase 3: Advanced Features
- Saved items vs active cart
- Cart history
- Cross-user shared carts (gift registries)

## Code Changes

### 1. Create CartRelayService

```typescript
// src/services/business/CartRelayService.ts

import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { CartItem } from '@/types/cart';
import { relayService } from '@/services/generic/GenericRelayService';
import { encryptionService } from '@/services/core/EncryptionService';

const CART_EVENT_KIND = 30078;
const CART_IDENTIFIER = 'shopping-cart';

export class CartRelayService {
  /**
   * Save cart to relays
   */
  async saveCart(items: CartItem[], signer: NostrSigner): Promise<void> {
    const cartData = JSON.stringify(items);
    const encryptedContent = await encryptionService.encrypt(cartData);
    
    const event: NDKEvent = {
      kind: CART_EVENT_KIND,
      tags: [
        ['d', CART_IDENTIFIER],
        ['encrypted', 'true'],
      ],
      content: encryptedContent,
      created_at: Math.floor(Date.now() / 1000),
    };
    
    await relayService.publishEvent(event, signer, {
      displayName: 'Shopping Cart',
    });
  }
  
  /**
   * Load cart from relays
   */
  async loadCart(pubkey: string): Promise<CartItem[]> {
    const filters = {
      kinds: [CART_EVENT_KIND],
      authors: [pubkey],
      '#d': [CART_IDENTIFIER],
      limit: 1,
    };
    
    const events = await relayService.queryEvents(filters, {
      displayName: 'Shopping Cart',
    });
    
    if (events.length === 0) {
      return [];
    }
    
    const cartEvent = events[0];
    const decryptedContent = await encryptionService.decrypt(
      cartEvent.content,
      pubkey
    );
    
    return JSON.parse(decryptedContent);
  }
  
  /**
   * Clear cart from relays
   */
  async clearCart(signer: NostrSigner): Promise<void> {
    // Publish empty cart event
    await this.saveCart([], signer);
  }
}

export const cartRelayService = new CartRelayService();
```

### 2. Update useCartStore

```typescript
// src/stores/useCartStore.ts

import { useAuthStore } from './useAuthStore';
import { cartRelayService } from '@/services/business/CartRelayService';

// Add debounced sync
let syncTimeout: NodeJS.Timeout | null = null;

const syncToRelay = async (items: CartItem[]) => {
  const { signer, user } = useAuthStore.getState();
  
  if (!signer || !user) {
    // Not authenticated, skip relay sync
    return;
  }
  
  // Debounce writes (wait 2 seconds after last change)
  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    try {
      await cartRelayService.saveCart(items, signer);
      logger.info('Cart synced to relays', {
        service: 'useCartStore',
        itemCount: items.length,
      });
    } catch (error) {
      logger.error('Failed to sync cart to relays', {
        service: 'useCartStore',
        error,
      });
    }
  }, 2000);
};

// Modify actions to sync after changes
addItem: (params) => {
  // ... existing logic
  
  // Sync to relay
  const newItems = get().items;
  syncToRelay(newItems);
  
  return true;
},

removeItem: (itemId) => {
  // ... existing logic
  
  // Sync to relay
  const newItems = get().items;
  syncToRelay(newItems);
},

// Add new action to load from relay
loadFromRelay: async () => {
  const { user } = useAuthStore.getState();
  
  if (!user?.pubkey) {
    return;
  }
  
  try {
    const remoteItems = await cartRelayService.loadCart(user.pubkey);
    const localItems = get().items;
    
    // Merge: prefer newer items based on addedAt timestamp
    const mergedItems = mergeCartItems(localItems, remoteItems);
    
    set({ items: mergedItems });
    get()._updateComputedValues();
    
    logger.info('Cart loaded from relays', {
      service: 'useCartStore',
      itemCount: mergedItems.length,
    });
  } catch (error) {
    logger.error('Failed to load cart from relays', {
      service: 'useCartStore',
      error,
    });
  }
},
```

### 3. Call on Login

```typescript
// src/hooks/useNostrSigner.ts or equivalent

useEffect(() => {
  // After successful authentication
  if (signer && user) {
    // Load cart from relay
    useCartStore.getState().loadFromRelay();
  }
}, [signer, user]);
```

## Testing Plan

1. **Single Device Testing**
   - Add items → Verify saved to relay
   - Logout → Login → Verify cart restored

2. **Multi-Device Testing**
   - Add items on Device A
   - Login on Device B → Verify cart synced
   - Modify cart on Device B
   - Return to Device A → Verify changes synced

3. **Conflict Resolution**
   - Add Item X on Device A (offline)
   - Add Item Y on Device B (offline)
   - Both go online → Verify merge works

4. **Privacy Testing**
   - Verify cart content is encrypted
   - Verify only user can decrypt their cart
   - Verify no PII leaks in relay events

## Migration Strategy

1. **Week 1:** Deploy dual storage (localStorage + relay)
2. **Week 2:** Monitor, fix issues
3. **Week 3:** Make relay primary source
4. **Week 4:** Add advanced features (saved items, etc.)

## Rollback Plan

If issues arise:
1. Feature flag to disable relay sync
2. Fall back to localStorage-only
3. Keep both implementations for safety

## Privacy Considerations

- ✅ Cart encrypted before storing in relay
- ✅ Only user's pubkey can decrypt
- ✅ Event kind 30078 is replaceable (no history leak)
- ⚠️ Relay knows user has a cart (metadata)
- ⚠️ Frequent updates may reveal shopping patterns

## Performance Considerations

- Debounce writes (2-second delay)
- Batch multiple changes
- Use replaceable events (no accumulation)
- Cache locally for instant UI updates
- Load from relay only on login/sync

## Alternative: Privacy-Focused Approach

If relay storage is too revealing:

**Hybrid Model:**
- Store cart locally (current behavior)
- Use relay for "wishlist" or "saved items" only
- Keep active cart ephemeral and local
- User explicitly chooses what to save to relay

This gives users control over what data is decentralized vs local.
