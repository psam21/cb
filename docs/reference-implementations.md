# Reference Implementations (Battle-Tested Code)

This document identifies proven, production-tested implementations that should be used as **exact references** for similar features.

## 🏆 Gold Standard Implementations

### Shop Product Flow
**Status**: ✅ Battle-tested in production  
**Use As Reference For**: Any e-commerce, product listing, or item management features

**Key Components**:
- Form: `/src/components/shop/ProductEditForm.tsx`
- Service: `/src/services/business/ShopBusinessService.ts`
- Hook: `/src/hooks/useProductEditing.ts`
- Event Creation: `/src/services/nostr/NostrEventService.ts` (createProductEvent)

**Critical Patterns to Replicate**:
1. **Stable Identifier Pattern**: Use `id = dTag` (not `id = eventId`)
   - Aligns with NIP-33: dTag persists across updates, eventId changes
   - Provides user-friendly, stable URLs
   - All create/update methods set `id = originalProduct.dTag`
2. **dTag Generation**: Use `dTagPrefix: 'product'` in GenericEventService
3. **Tag Filtering**: Always use `filterVisibleTags()` when loading for edit
4. **System Tag Handling**: Check existence before adding system tags
5. **RichTextEditor Props**: Use `value={formData.field || ''}` (explicit fallback)
6. **Attachment Operations**: Track `{removedAttachments, keptAttachments}` selectively
7. **Progress Callbacks**: Wire `onProgress` throughout upload → publish flow
8. **Form Initialization**: Use callback function in `useState` for complex defaults
9. **Validation**: Check `hasContentChanges || hasAttachmentChanges` before save

---

### Heritage Contribution Flow
**Status**: ✅ Fully aligned with Shop (as of 2025-10-03)  
**Based On**: Shop Product Flow

**Key Components**:
- Form: `/src/components/heritage/HeritageContributionForm.tsx`
- Service: `/src/services/business/HeritageContentService.ts`
- Hooks: `/src/hooks/useHeritagePublishing.ts`, `/src/hooks/useHeritageEditing.ts`
- Event Creation: `/src/services/nostr/NostrEventService.ts` (createHeritageEvent)

**Critical Patterns Implemented**:
1. **Stable Identifier Pattern**: Uses `id = dTag` (matches Shop)
   - NIP-33 alignment: dTag persists, eventId changes on updates
   - Provides stable URLs like `/heritage/contribution-xxx-yyy`
2. **dTag Generation**: Uses `dTagPrefix: 'contribution'` (distinct from Shop's 'product')
3. **Auto-Redirect**: Redirects to detail page 1 second after successful publication
   - Uses `useEffect` with `setTimeout` for non-blocking user feedback
   - Shows success message before redirect
4. **Tag Filtering**: Uses `filterVisibleTags()` when loading for edit
5. **System Tag Handling**: Prevents duplicate system tags
6. **RichTextEditor Props**: Explicit fallback `|| ''`
7. **Selective Attachment Operations**: Tracks `{removedAttachments, keptAttachments}`
8. **Progress Callbacks**: Wired throughout upload → publish flow
9. **Service Layer Architecture**: Business → Event → Generic service pattern
10. **Hook-Based State Management**: Separates publishing and editing concerns

**Alignment Checklist** (all completed):
- [x] Stable identifier pattern (`id = dTag`)
- [x] dTag prefix customization (`contribution-` vs `product-`)
- [x] Auto-redirect after successful publication
- [x] Tag filtering with `filterVisibleTags()`
- [x] System tag duplication prevention
- [x] RichTextEditor explicit fallback `|| ''`
- [x] Selective attachment operations
- [x] Progress callback wiring
- [x] Service layer architecture (SOA compliance)
- [x] Hook-based state management

---

## 📋 When to Use This Document

### Trigger Phrases:
- "Use X as reference"
- "Follow the same pattern as X"
- "X is battle-tested"
- "X is proven"
- "Make Y work like X"

### Required Actions:
1. ✅ Identify the reference implementation from this document
2. ✅ Create comparison checklist of ALL patterns (not just obvious ones)
3. ✅ Compare: Props, State Init, Tags, Validation, Error Handling, Edge Cases
4. ✅ Verify each pattern matches EXACTLY before declaring done
5. ✅ Document any intentional deviations with reasoning

---

## 🔄 Update Protocol

When a new feature is proven battle-tested:
1. Add to this document with date and status
2. List critical patterns to replicate
3. Link to key files
4. Document lessons learned

---

## ⚠️ Warning Signs

If you see differences between new implementation and reference:
- ❌ "This is just a small difference" → VERIFY it's intentional
- ❌ "The new way might be better" → PROVE it first, then update reference
- ❌ "I found one match, must be good" → Check EVERYTHING systematically

Remember: **Battle-tested means PROVEN. Deviations need PROOF.**
