# Profile Editing - Implementation Plan

**Version**: 1.0  
**Status**: Pre-Implementation Planning  
**Created**: October 6, 2025  
**Last Updated**: October 6, 2025

---

## Implementation Philosophy

**Bottom-Up Approach**: Build foundation first (services), then layers up (hooks, UI)  
**Iterative**: Each phase should be functional and testable before moving to next  
**SOA-First**: Strictly follow service-oriented architecture patterns  
**Pattern Reuse**: Heavily reference existing implementations (messaging, shop)

---

## Phase Breakdown

### PHASE 0: Foundation & Preparation ✓
**Goal**: Deep pattern analysis and planning  
**Duration**: Preparation complete

- [x] Study existing service patterns
- [x] Study existing hook patterns  
- [x] Identify all files to modify/create
- [x] Document requirements
- [x] Create implementation plan (this document)

---

### PHASE 1: Service Layer - Profile Publishing
**Goal**: ProfileBusinessService can create and publish Kind 0 events  
**Dependencies**: None (uses existing GenericEventService, GenericRelayService)

#### 1.1 ProfileBusinessService Enhancement

**File**: `/src/services/business/ProfileBusinessService.ts`

**New Methods to Add**:

```typescript
// Method 1: Create Kind 0 event from profile data
async createProfileEvent(
  profile: UserProfile, 
  signer: NostrSigner
): Promise<NostrEvent>

// Method 2: Publish profile to relays
async publishProfile(
  profile: UserProfile, 
  signer: NostrSigner
): Promise<PublishingResult>

// Method 3: Update profile (fetch + publish)
async updateUserProfile(
  updates: Partial<UserProfile>,
  signer: NostrSigner,
  userPubkey: string
): Promise<{ success: boolean; error?: string }>
```

**Pattern to Follow**: 
- Reference: `ShopBusinessService.createProduct()` for event creation
- Reference: `HeritageContentService.publishContent()` for relay publishing
- Use: `GenericEventService.signEvent()` for signing
- Use: `GenericRelayService.publishEvent()` for publishing

**Implementation Notes**:
- Kind 0 content is JSON stringified UserProfile
- Must include all fields (even if empty string)
- Event timestamp = current unix time
- No tags needed for Kind 0 (simple metadata event)
- Validate profile before creating event
- Return relay publishing results (success/failed relays)

**Testing Checkpoint**:
- [ ] Can create valid Kind 0 event
- [ ] Event signature validates
- [ ] Can publish to relays successfully
- [ ] Handles relay failures gracefully
- [ ] Returns meaningful error messages

---

### PHASE 2: Image Upload Infrastructure
**Goal**: Upload profile picture and banner to Blossom CDN  
**Dependencies**: PHASE 1 complete

#### 2.1 Profile Picture Upload (No Cropping Yet)

**Files**: 
- Update: `/src/hooks/useMediaUpload.ts` (already exists, reuse)
- Create: `/src/hooks/useProfileImageUpload.ts` (profile-specific wrapper)

**New Hook**: `useProfileImageUpload`

```typescript
// Wrapper around useMediaUpload specific for profile pictures
interface UseProfileImageUploadReturn {
  uploadProfilePicture: (file: File) => Promise<string | null>; // Returns URL
  uploadBanner: (file: File) => Promise<string | null>; // Returns URL
  isUploading: boolean;
  progress: SequentialUploadProgress | null;
  error: string | null;
}
```

**Pattern to Follow**:
- Reference: `useMediaUpload` hook (already exists)
- Use: `GenericBlossomService.uploadFile()` for upload
- Validate: Image file type and size before upload
- Return: Blossom URL for uploaded image

**Validation Rules**:
- Profile Picture: Max 5MB, square aspect ratio recommended
- Banner: Max 10MB, wide aspect ratio (3:1 or 16:9 recommended)
- Formats: JPG, PNG, WebP, GIF

**Testing Checkpoint**:
- [ ] Can upload profile picture successfully
- [ ] Can upload banner successfully
- [ ] Shows upload progress
- [ ] Validates file size and type
- [ ] Returns valid Blossom URL
- [ ] Handles upload failures

#### 2.2 Image Cropping Component (Later Phase)

**Decision Point**: Choose cropping library
- Option 1: `react-image-crop` (simple, lightweight)
- Option 2: `react-easy-crop` (better mobile support)
- Option 3: `react-advanced-cropper` (most features)

**Recommendation**: Start without cropping (Phase 2.1), add cropping in Phase 4

---

### PHASE 3: Hook Layer Enhancement
**Goal**: useUserProfile hook supports profile publishing  
**Dependencies**: PHASE 1 complete

#### 3.1 Update useUserProfile Hook

**File**: `/src/hooks/useUserProfile.ts`

**Modifications**:

```typescript
// Add to existing hook
export interface UseUserProfileReturn {
  // ... existing fields ...
  
  // NEW: Publishing methods
  publishProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  isPublishing: boolean;
  publishError: string | null;
  lastPublished: number | null;
}
```

**Implementation**:
- Call `ProfileBusinessService.updateUserProfile()` 
- Track publishing state (loading, error, success)
- Update local profile state on success
- Update auth store on success
- Return boolean for success/failure

**Pattern to Follow**:
- Reference: `useUserProfile.updateProfile()` (existing method, enhance it)
- Reference: `useHeritagePublishing` hook for publishing patterns

**Testing Checkpoint**:
- [ ] Can publish profile updates successfully
- [ ] Updates local state after publish
- [ ] Updates auth store after publish
- [ ] Shows publishing progress
- [ ] Handles publishing errors
- [ ] Validates profile before publishing

---

### PHASE 4: UI Components - Basic Fields
**Goal**: Edit and publish basic profile fields (no images yet)  
**Dependencies**: PHASE 3 complete

#### 4.1 Update Profile Page - Basic Editing

**File**: `/src/app/profile/page.tsx`

**Modifications**:
1. Connect to updated `useUserProfile` hook
2. Call `publishProfile()` instead of just `updateProfile()`
3. Show publishing progress and status
4. Handle publishing errors with clear messages

**Fields to Support** (MVP):
- display_name (text input)
- about (RichTextEditor - already working)
- website (URL input)
- birthday (date input)
- bot (checkbox)

**UI Enhancements**:
- Show "Publishing..." state during save
- Show success message after publish
- Show which relays succeeded/failed
- Clear error messages with retry option

**Testing Checkpoint**:
- [ ] Can edit all basic fields
- [ ] Validation works correctly
- [ ] Can publish changes to Nostr
- [ ] Shows publishing progress
- [ ] Shows success/error states
- [ ] Mobile responsive

---

### PHASE 5: UI Components - Image Upload
**Goal**: Upload and set profile picture and banner  
**Dependencies**: PHASE 2 complete, PHASE 4 complete

#### 5.1 Profile Picture Upload UI

**Files**:
- Update: `/src/app/profile/page.tsx`
- Create: `/src/components/profile/ProfilePictureUpload.tsx`

**Component**: `ProfilePictureUpload`

```typescript
interface ProfilePictureUploadProps {
  currentPicture?: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
}
```

**Features**:
- Drag and drop support
- File picker button
- Preview current picture
- Show upload progress
- Remove picture option
- Validation feedback

**Pattern to Follow**:
- Reference: Product image upload UI in shop
- Use: `useProfileImageUpload` hook

**Testing Checkpoint**:
- [ ] Can select image via file picker
- [ ] Can drag and drop image
- [ ] Shows preview before upload
- [ ] Shows upload progress
- [ ] Updates profile after upload
- [ ] Can remove profile picture

#### 5.2 Banner Upload UI

**Files**:
- Update: `/src/app/profile/page.tsx`
- Create: `/src/components/profile/BannerUpload.tsx`

**Component**: `BannerUpload`

Similar to ProfilePictureUpload but:
- Different aspect ratio guidance
- Different position in UI (top of page)
- Wider preview area

**Testing Checkpoint**:
- [ ] Can upload banner image
- [ ] Shows banner in correct position
- [ ] Responsive on mobile
- [ ] Can remove banner

---

### PHASE 6: Extended Metadata Fields
**Goal**: Support lud16, lud06, nip05 fields  
**Dependencies**: PHASE 4 complete

#### 6.1 Lightning Address Fields

**File**: `/src/app/profile/page.tsx`

**Add Fields**:
- `lud16` (Lightning Address - e.g., user@domain.com)
- `lud06` (LNURL - legacy format)

**UI Components**:
- Text input with validation
- Format explanation/help text
- Example placeholder text
- Optional test/verify button (future)

**Validation**:
- lud16: email-like format (user@domain.com)
- lud06: LNURL format (lnurl1...)
- Both optional fields

**Testing Checkpoint**:
- [ ] Can enter lud16 address
- [ ] Can enter lud06 address
- [ ] Validation works correctly
- [ ] Help text is clear
- [ ] Saves to profile correctly

#### 6.2 NIP-05 Verification Field

**File**: `/src/app/profile/page.tsx`

**Add Field**:
- `nip05` (DNS-based verification - e.g., user@domain.com)

**UI Components**:
- Text input
- Verification status indicator
- Link to setup instructions
- Re-verify button

**Features**:
- Show verified badge if already verified
- Link to external NIP-05 setup guides
- Explain what NIP-05 is

**Pattern to Follow**:
- Use existing `verifyNIP05()` utility from `/src/utils/nip05.ts`

**Testing Checkpoint**:
- [ ] Can enter nip05 identifier
- [ ] Shows verification status
- [ ] Links to setup instructions
- [ ] Saves to profile correctly

---

### PHASE 7: State Management & Integration
**Goal**: Profile updates propagate across entire app  
**Dependencies**: PHASE 4-6 complete

#### 7.1 Auth Store Integration

**File**: `/src/stores/useAuthStore.ts`

**Modifications**:

```typescript
// Add method to update profile in auth store
updateUserProfile: (updates: Partial<UserProfile>) => void;
```

**Implementation**:
- Update user.profile with new data
- Persist to localStorage (if applicable)
- Trigger re-render of dependent components

**Testing Checkpoint**:
- [ ] Profile updates saved to auth store
- [ ] Header shows updated display name
- [ ] Profile picture updates everywhere
- [ ] Changes persist across page reloads

#### 7.2 Profile Propagation

**Files to Check**:
- `/src/components/Header.tsx` - Display name, profile picture
- `/src/app/messages/page.tsx` - User's own profile in conversations
- `/src/app/my-shop/page.tsx` - Seller profile display
- `/src/app/my-contributions/page.tsx` - Contributor profile

**Implementation**:
- Ensure all components read from auth store
- Test that updates appear immediately
- No stale profile data anywhere

**Testing Checkpoint**:
- [ ] Updated profile shows in Header
- [ ] Updated profile shows in all pages
- [ ] No cached stale data
- [ ] Real-time updates work

---

### PHASE 8: Image Cropping Enhancement
**Goal**: Add image cropping before upload  
**Dependencies**: PHASE 5 complete

#### 8.1 Choose and Install Cropping Library

**Decision**: (To be decided during implementation)

**Candidates**:
1. `react-image-crop` - Simple, 2.5k stars
2. `react-easy-crop` - Mobile-friendly, 2.2k stars  
3. `react-advanced-cropper` - Most features, complex

**Recommendation**: Start with `react-easy-crop` (best mobile support)

#### 8.2 Implement Cropping UI

**Files**:
- Update: `/src/components/profile/ProfilePictureUpload.tsx`
- Update: `/src/components/profile/BannerUpload.tsx`
- Create: `/src/components/profile/ImageCropper.tsx`

**Features**:
- Crop to square for profile picture
- Crop to wide aspect for banner
- Zoom and pan controls
- Mobile touch support
- Preview before save

**Testing Checkpoint**:
- [ ] Can crop profile picture to square
- [ ] Can crop banner to wide aspect
- [ ] Zoom and pan work smoothly
- [ ] Works on mobile touch
- [ ] Preview shows cropped result
- [ ] Uploads cropped image correctly

---

### PHASE 9: Polish & Edge Cases
**Goal**: Handle all edge cases, perfect UX  
**Dependencies**: All previous phases complete

#### 9.1 Error Handling Refinement

**Scenarios to Handle**:
- Network failure during upload
- Network failure during publish
- Partial relay failures (some succeed, some fail)
- Image too large
- Invalid image format
- Concurrent profile edits
- User cancels during upload
- Signer rejection

**Implementation**:
- Clear error messages for each scenario
- Retry options where appropriate
- Graceful degradation
- Don't lose user's changes

**Testing Checkpoint**:
- [ ] All error scenarios handled
- [ ] Error messages are clear and actionable
- [ ] Retry mechanisms work
- [ ] No data loss on errors

#### 9.2 Mobile Optimization

**Focus Areas**:
- Touch-friendly controls
- Camera capture support
- Image compression on mobile
- Responsive layouts
- Mobile keyboard handling
- Slow network handling

**Testing Checkpoint**:
- [ ] All features work on mobile
- [ ] Camera upload works
- [ ] Touch gestures work smoothly
- [ ] Layouts responsive on all sizes
- [ ] Performance acceptable on mobile

#### 9.3 Accessibility

**Requirements**:
- Keyboard navigation
- Screen reader labels
- Focus management
- High contrast support
- Alternative text for images

**Testing Checkpoint**:
- [ ] Can navigate with keyboard only
- [ ] Screen reader announces all actions
- [ ] Focus indicators visible
- [ ] Works in high contrast mode
- [ ] Images have alt text

---

## File Inventory

### Files to Modify

**Services**:
- `/src/services/business/ProfileBusinessService.ts` - Add publishing methods

**Hooks**:
- `/src/hooks/useUserProfile.ts` - Add publishing support
- `/src/hooks/useMediaUpload.ts` - Reuse for images (no changes needed)

**Stores**:
- `/src/stores/useAuthStore.ts` - Add profile update method

**Pages**:
- `/src/app/profile/page.tsx` - Major updates for editing UI

**Components** (existing):
- `/src/components/Header.tsx` - Verify profile updates propagate

### Files to Create

**Hooks**:
- `/src/hooks/useProfileImageUpload.ts` - Profile-specific image upload wrapper

**Components**:
- `/src/components/profile/ProfilePictureUpload.tsx` - Picture upload UI
- `/src/components/profile/BannerUpload.tsx` - Banner upload UI
- `/src/components/profile/ImageCropper.tsx` - Cropping modal (Phase 8)

**Types** (if needed):
- `/src/types/profile-editing.ts` - Profile editing specific types

---

## Pattern References

### Service Layer Patterns

**Event Creation**:
```typescript
// Reference: ShopBusinessService.createProduct()
const event = await createNIP23Event({
  content: nip23Content,
  dTag,
  signer,
  kind: 30023
});
```

**Event Publishing**:
```typescript
// Reference: HeritageContentService.publishContent()
const result = await publishEvent(signedEvent, relays);
```

**Validation**:
```typescript
// Reference: ProfileBusinessService.validateProfile()
const validation = profileService.validateProfile(updates);
if (!validation.isValid) {
  return { success: false, errors: validation.errors };
}
```

### Hook Patterns

**Publishing State Management**:
```typescript
// Reference: useHeritagePublishing
const [isPublishing, setIsPublishing] = useState(false);
const [publishError, setPublishError] = useState<string | null>(null);

const publishProfile = async (updates: Partial<UserProfile>) => {
  setIsPublishing(true);
  setPublishError(null);
  
  try {
    const result = await profileService.publishProfile(updates, signer);
    if (result.success) {
      // Update local state
      return true;
    } else {
      setPublishError(result.error);
      return false;
    }
  } catch (error) {
    setPublishError(error.message);
    return false;
  } finally {
    setIsPublishing(false);
  }
};
```

### Image Upload Patterns

**Blossom Upload**:
```typescript
// Reference: ShopBusinessService.createProduct()
const uploadResult = await blossomService.uploadFile(imageFile, signer);
if (!uploadResult.success) {
  return { success: false, error: uploadResult.error };
}
const imageUrl = uploadResult.metadata.url;
```

**Sequential Upload with Progress**:
```typescript
// Reference: useMediaUpload
const { uploadFiles, uploadState } = useMediaUpload();

const result = await uploadFiles([imageFile], signer);
if (result.success) {
  const imageUrl = result.uploadedFiles[0].url;
}
```

---

## Open Questions & Decisions

### Q1: Image Cropping Library
**Options**: react-image-crop, react-easy-crop, react-advanced-cropper  
**Recommendation**: react-easy-crop (best mobile support)  
**Decision**: To be made in Phase 8

### Q2: Profile Cache Strategy
**Question**: Should we cache Kind 0 events separately from auth store?  
**Current**: Profile stored in auth store only  
**Recommendation**: Keep it simple, use auth store + relay fetch  
**Decision**: No separate cache (removed from requirements)

### Q3: NIP-05 Verification Testing
**Question**: Should we test NIP-05 verification before saving?  
**Options**: 
- A) Just save the field, verify on display
- B) Verify before allowing save
- C) Save but show warning if unverified

**Recommendation**: Option A (verify on display, not during save)  
**Decision**: To be made in Phase 6

### Q4: Lightning Address Testing
**Question**: Should we test lud16/lud06 reachability?  
**Recommendation**: No - too complex for MVP, just validate format  
**Decision**: Format validation only

### Q5: Concurrent Edit Handling
**Question**: What if user edits profile in two tabs?  
**Options**:
- A) Last write wins (simple)
- B) Show warning on conflict
- C) Lock editing to one tab

**Recommendation**: Option A (last write wins)  
**Decision**: To be made in Phase 9

---

## Success Metrics

### Phase Completion Criteria

Each phase is complete when:
1. All tasks in phase are checked off
2. All testing checkpoints pass
3. Code follows SOA patterns
4. No TypeScript errors
5. Builds successfully
6. Tested on mobile and desktop

### Overall Success Criteria (MVP)

- [ ] User can edit all basic profile fields
- [ ] User can upload and set profile picture
- [ ] User can upload and set banner image
- [ ] Profile publishes to Nostr as Kind 0 event
- [ ] Profile updates appear across all pages
- [ ] Mobile responsive and functional
- [ ] Clear error handling and validation
- [ ] Follows SOA architecture strictly

---

## Risk Mitigation

### Risk 1: Complex State Management
**Mitigation**: Build incrementally, test state updates at each phase

### Risk 2: Image Upload Failures
**Mitigation**: Reuse proven Blossom patterns, add retry logic

### Risk 3: Relay Publishing Failures
**Mitigation**: Show partial success, allow retry for failed relays

### Risk 4: Mobile Performance
**Mitigation**: Test early on mobile, optimize images, use progressive loading

### Risk 5: Cropping Library Integration
**Mitigation**: Start without cropping (Phase 2), add later (Phase 8)

---

## Next Steps

1. **Review this plan** - User approval/modifications
2. **Begin Phase 1** - ProfileBusinessService enhancement
3. **Test Phase 1** - Verify Kind 0 event creation and publishing
4. **Continue iteratively** - Each phase builds on previous
5. **Update this document** - Track progress, note learnings

---

**Ready to start?** Let's begin with Phase 1: ProfileBusinessService enhancement.
