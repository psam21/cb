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
1. **Tag Filtering**: Always use `filterVisibleTags()` when loading for edit
2. **System Tag Handling**: Check existence before adding system tags
3. **RichTextEditor Props**: Use `value={formData.field || ''}` (explicit fallback)
4. **Attachment Operations**: Track `{removedAttachments, keptAttachments}` selectively
5. **Progress Callbacks**: Wire `onProgress` throughout upload → publish flow
6. **Form Initialization**: Use callback function in `useState` for complex defaults
7. **Validation**: Check `hasContentChanges || hasAttachmentChanges` before save

---

### Heritage Contribution Flow
**Status**: ✅ Aligned with Shop (as of 2025-10-02)  
**Based On**: Shop Product Flow

**Alignment Checklist** (completed):
- [x] Tag filtering with `filterVisibleTags()`
- [x] System tag duplication prevention
- [x] RichTextEditor explicit fallback `|| ''`
- [x] Selective attachment operations
- [x] Progress callback wiring
- [x] Service layer architecture
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
