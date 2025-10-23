# Progressive Loading Enhancement

**Status**: 📋 Planned - Deferred  
**Priority**: Medium  
**Effort**: Large (3-5 days)  
**Date Proposed**: October 5, 2025

---

## Problem Statement

Users experience perceived long wait times on `/shop` page while:
- Querying 8 relays in parallel
- Waiting for all relays to respond before showing any products
- Loading full-resolution images synchronously

**Current UX**: Blank screen → spinner → all products appear at once

---

## Proposed Solution

Implement progressive/incremental loading with three quick wins:

### Quick Win 1: Skeleton Screens
- Show 6-8 skeleton cards immediately
- Eliminates "blank state" anxiety
- **Effort**: 30 minutes

### Quick Win 2: Incremental Rendering  
- Display products as each relay responds (not wait for all 8)
- Users see products in 500ms instead of 2000ms+
- **Effort**: 1 hour

### Quick Win 3: Blurhash Placeholders
- Show decoded blurhash while images load
- Elegant progressive image loading
- **Effort**: 2 hours

---

## Architecture Changes Required

### ⚠️ **Breaking Changes**

#### 1. Generic Service Layer
**File**: `/src/services/generic/GenericRelayService.ts`

**Change**: Modify `queryEvents()` to support incremental progress callbacks

**Current**:
```typescript
queryEvents(
  filters: NostrFilter[],
  onProgress?: (progress: number, message: string) => void
): Promise<Event[]>
```

**Proposed**:
```typescript
interface RelayProgressUpdate {
  relay: string;
  events: Event[];
  completed: number;
  total: number;
}

queryEvents(
  filters: NostrFilter[],
  onProgress?: (update: RelayProgressUpdate) => void  // Changed signature
): Promise<Event[]>
```

**Impact**: All callers (Shop, Heritage) need migration  
**Mitigation**: Use function overloading for backwards compatibility

---

#### 2. New Generic Service
**File**: `/src/services/generic/BlurHashService.ts` (NEW)

**Purpose**: Decode blurhash from NIP-94 metadata into canvas data URLs

**Methods**:
- `decode(hash: string, width: number, height: number): Uint8ClampedArray`
- `decodeToDataURL(hash: string, width?: number, height?: number): string`

**Dependencies**: `blurhash` npm package (2.0.5)

**SOA Layer**: Generic/Utility service (no business logic)

---

### 📁 New Files Required

1. `/src/services/generic/BlurHashService.ts`
2. `/src/services/business/ShopBusinessService.ts` - Add `queryProductsProgressively()`
3. `/src/hooks/useProgressiveShopProducts.ts` (NEW)
4. `/src/components/shop/ShopProductSkeleton.tsx` (NEW)
5. `/src/components/shop/ShopProductCard.tsx` - Add blurhash support

---

### 🔄 SOA Flow

```
Page (shop/page.tsx)
  ↓ uses
Hook (useProgressiveShopProducts.ts) [NEW]
  ↓ calls
Business Service (ShopBusinessService.queryProductsProgressively) [NEW METHOD]
  ↓ calls
Generic Service (GenericRelayService.queryEvents) [MODIFIED]
  ↓ fires incremental callbacks
Business Service (parses events → products per relay)
  ↓ returns incremental updates
Hook (updates state incrementally)
  ↓ triggers re-renders
Page (displays products progressively)
```

**✅ SOA Compliance**: Maintained strict layer separation

---

## Implementation Phases

### Phase 1: Infrastructure (No UI Impact)
- Add `BlurHashService.ts`
- Modify `GenericRelayService` with backwards-compatible overload
- Test with existing shop page (should work unchanged)
- **Effort**: 2 hours

### Phase 2: Business Layer
- Add `ShopBusinessService.queryProductsProgressively()`
- Test via console logs
- **Effort**: 1 hour

### Phase 3: Hook + Components
- Create `useProgressiveShopProducts`
- Create `ShopProductSkeleton`
- Test in isolation
- **Effort**: 2 hours

### Phase 4: Page Integration
- Update `shop/page.tsx` to use new hook
- Enable progressive loading
- Full end-to-end testing
- **Effort**: 1 hour

### Phase 5: Optimization
- Add blurhash to `ShopProductCard`
- Add relay prioritization logic
- Add thumbnail support from Blossom
- **Effort**: 3 hours

**Total Effort**: ~9-12 hours over 3-5 days

---

## Additional Recommendations (Future)

### 4. Optimistic Relay Ordering
- Measure relay response times
- Cache rankings in localStorage
- Query fastest relays first
- **Effort**: 1 hour

### 5. Thumbnail Support
- Use Blossom `thumb` tag (already in responses)
- Load thumbnails first, swap to full image
- ~90% size reduction for grid view
- **Effort**: 1 hour

### 6. Virtual Scrolling
- Only render visible products + buffer
- Use react-window or react-virtuoso
- Matters when product count exceeds 20+
- **Effort**: 2 hours

### 7. Prefetch on Hover
- Preload product detail page on card hover
- Use Next.js `router.prefetch()`
- **Effort**: 30 minutes

---

## Dependencies

```json
{
  "blurhash": "^2.0.5",
  "react-window": "^1.8.10" // Optional for virtual scrolling
}
```

---

## Risks & Considerations

### 1. **Backwards Compatibility**
- Modifying `GenericRelayService` affects Heritage contributions
- **Mitigation**: Use TypeScript overloads for both signatures

### 2. **State Management Complexity**
- Incremental updates add complexity to hook state
- **Mitigation**: Keep old `useShopProducts` for rollback

### 3. **Testing Burden**
- Need to test all relay combinations (8 relays)
- Network conditions (slow relays, timeouts)
- **Mitigation**: Phase rollout with feature flag

### 4. **Bundle Size**
- `blurhash` package adds ~5KB gzipped
- **Mitigation**: Acceptable for UX improvement

---

## Success Metrics

### Before
- Time to first product: 1500-2500ms
- Perceived waiting: High (blank screen)
- User engagement: Drops during load

### After (Target)
- Time to skeleton: <100ms
- Time to first product: 500-800ms (fastest relay)
- Time to all products: 1500-2500ms (unchanged)
- Perceived waiting: Low (progressive reveal)
- User engagement: Maintained

---

## References

- NIP-94 (File Metadata): Includes blurhash in upload responses
- Blossom Protocol: Returns `thumb` and `blurhash` tags
- Shop is battle-tested: Use as reference for any modifications

---

## Decision Log

**2025-10-05**: Deferred due to scope  
- Requires significant rework of Generic Service layer
- Breaking changes need careful migration
- Better as dedicated sprint item

**Next Steps When Revisiting**:
1. Create feature branch
2. Implement Phase 1 with backwards compatibility
3. Test thoroughly with both Shop and Heritage
4. Gradual rollout with feature flag
5. Monitor performance metrics

---

_This enhancement will significantly improve perceived performance without changing actual load times. Worth doing when time permits._
