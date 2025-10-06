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

### Profile Metadata Publishing Flow

**Status**: ✅ Production-ready (as of 2025-10-06)  
**Use As Reference For**: User profile editing, Kind 0 metadata events, image upload with cropping

**Key Components**:

- Page: `/src/app/profile/page.tsx`
- Service: `/src/services/business/ProfileBusinessService.ts`
- Hook: `/src/hooks/useUserProfile.ts`
- Components: `/src/components/profile/ImageUpload.tsx`, `/src/components/profile/ImageCropper.tsx`
- Validation: `/src/utils/profileValidation.ts`
- NIP-05: `/src/utils/nip05.ts`

**Critical Patterns to Replicate**:

1. **Kind 0 Metadata Events**: Profile data as JSON-stringified content
   - No tags required (Kind 0 is simple metadata)
   - All fields in content object (display_name, about, picture, banner, etc.)
   - Event creation through ProfileBusinessService → GenericEventService

2. **Image Upload + Cropping Workflow**:
   - Select image → Show cropper → Crop → Upload to Blossom → Publish profile
   - Uses `react-easy-crop` for mobile-friendly cropping
   - Aspect ratios: 1:1 (square) for profile, 3:1 (wide) for banner
   - Canvas-based image processing to blob before upload
   - Reuses `useMediaUpload` hook for Blossom uploads

3. **Field-Level Validation**:
   - Validation utilities return `{ isValid: boolean; error?: string }`
   - Pre-publish validation blocks save if errors exist
   - Inline error messages with red borders
   - Character limits enforced (display_name: 100, about: 1000)
   - URL validation, email format validation, date validation

4. **NIP-05 Verification**:
   - DNS-based identity verification
   - Real-time verification on profile load
   - Shows verified/unverified status with appropriate badges
   - "Verify" button for manual re-checking
   - Uses `verifyNIP05(identifier, pubkey)` utility

5. **State Management Integration**:
   - Updates auth store after successful publish
   - Zustand persist middleware saves to localStorage
   - Profile updates propagate to Header and all components
   - Reactive state management via Zustand

6. **Multi-Relay Publishing**:
   - Publishes to all configured relays
   - Tracks succeeded/failed relays separately
   - Shows relay count in success message
   - Allows partial success (some relays succeed, some fail)

7. **Immediate Image Publishing**:
   - Profile picture/banner upload triggers immediate publish
   - No need to click "Save" after image upload
   - Updates visible immediately across app

**Service Layer Architecture**:

```text
Profile Page (UI)
  ↓
useUserProfile (Hook Layer)
  ↓
ProfileBusinessService.updateUserProfile() (Business Layer)
  ↓
ProfileBusinessService.publishProfile() (Publishing)
  ↓
GenericEventService.signEvent() + GenericRelayService.publishEvent() (Generic Layer)
  ↓
Nostr Relays
```

**Validation Pattern**:

```typescript
// Pre-publish validation
const errors = validateProfileFields(editForm);
if (Object.keys(errors).length > 0) {
  setFieldErrors(errors);
  setSaveError('Please fix the errors before publishing');
  return;
}
```

**NIP-05 Verification Pattern**:

```typescript
// Real-time verification
useEffect(() => {
  const verifyNip05Status = async () => {
    if (!profile?.nip05 || !user?.pubkey) {
      setIsNip05Verified(false);
      return;
    }
    const result = await verifyNIP05(profile.nip05, user.pubkey);
    setIsNip05Verified(result !== null);
  };
  verifyNip05Status();
}, [profile?.nip05, user?.pubkey]);
```

**Image Cropping Pattern**:

```typescript
// Cropping workflow
Select image → Show ImageCropper modal
  ↓
User adjusts crop + zoom
  ↓
Canvas processing to blob
  ↓
Upload blob via useMediaUpload
  ↓
Publish profile with new image URL
```

**Profile Alignment Checklist**:

- [x] Kind 0 metadata event structure
- [x] Image upload + cropping integration
- [x] Field-level validation with inline errors
- [x] NIP-05 DNS verification
- [x] Auth store integration
- [x] Multi-relay publishing with tracking
- [x] Immediate image publishing
- [x] State propagation across app
- [x] SOA compliance (strict layer separation)
- [x] Code reuse (GenericEventService, GenericRelayService, GenericBlossomService)

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
