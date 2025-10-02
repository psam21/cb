# Heritage Critical Bug Fix - Attachment Loss on Edit

**Date:** October 2, 2025  
**Status:** Identified - Ready to Fix  
**Severity:** 🔴 CRITICAL

---

## 🔍 Deep Analysis Findings

After thorough code tracing, Heritage is **mostly functional** but has **ONE critical bug** that causes data loss.

---

## ✅ What Works (No Changes Needed)

### 1. Heritage Creation
- ✅ Creates new contributions perfectly
- ✅ Uploads attachments to Blossom
- ✅ Publishes Kind 30023 events to Nostr
- ✅ Uses NIP-33 parameterized replaceable events
- **Status: WORKING**

### 2. Heritage Editing (Text)
- ✅ Updates title, description, metadata
- ✅ Uses same dTag for NIP-33 replacement
- ✅ Properly replaces previous event
- **Status: WORKING**

### 3. Heritage Deletion
- ✅ Creates NIP-09 deletion events
- ✅ Publishes to relays correctly
- ✅ Removes from local state
- **Status: WORKING**

### 4. Heritage Fetching
- ✅ Fetches all contributions
- ✅ Fetches by author
- ✅ Fetches by ID/dTag
- **Status: WORKING**

---

## 🔴 Critical Bug: Attachment Loss on Edit

### The Problem

**When editing a contribution with existing media, ALL existing attachments are LOST.**

### Code Execution Trace

**Step 1: Load Contribution for Edit**
```typescript
// src/app/my-contributions/edit/[id]/page.tsx - Line 90-95
const attachments: GenericAttachment[] = contribution.media.map((media) => ({
  id: media.id,
  type: media.type,
  name: media.source.name,
  size: media.source.size || 0,
  mimeType: media.source.mimeType,
  url: media.source.url,      // ✅ Has URL
  hash: media.source.hash,     // ✅ Has hash
  // ❌ NO originalFile - because it's already uploaded!
}));
```

**Existing attachments have:** `{id, url, hash, type, name, size, mimeType}`  
**Missing:** `originalFile: File` (because already uploaded)

**Step 2: Form Submits with Existing Attachments**
```typescript
// src/components/heritage/HeritageContributionForm.tsx - Line 149
const heritageData: HeritageContributionData = {
  // ... other fields
  attachments: attachments, // Includes existing (no originalFile) + new (with originalFile)
};

await publishHeritage(heritageData, defaultValues?.dTag);
```

**Step 3: Publishing Hook Filters Attachments**
```typescript
// src/hooks/useHeritagePublishing.ts - Line 169-177
if (data.attachments.length > 0) {
  const filesToUpload: File[] = [];
  for (const attachment of data.attachments) {
    if (attachment.originalFile) {  // ❌ EXISTING attachments FAIL this check!
      filesToUpload.push(attachment.originalFile);
    }
  }
  
  // Only NEW attachments with originalFile get uploaded
  // EXISTING attachments are IGNORED!
}
```

**Step 4: Event Created Without Existing Media**
```typescript
// src/hooks/useHeritagePublishing.ts - Line 281-289
const attachments = uploadedMediaUrls.map(media => ({
  // Only contains NEWLY uploaded media
  // EXISTING media is NOT included
}));

const heritageData: HeritageContributionData = {
  ...data,
  attachments, // ❌ Only new attachments, existing ones LOST!
};
```

**Result:** Updated event has NO existing media → **Data Loss!**

---

## 🔧 The Fix

### Option 1: Preserve Existing Attachments (Minimal Fix)

**File:** `src/hooks/useHeritagePublishing.ts`  
**Location:** Around line 169

**CHANGE FROM:**
```typescript
if (data.attachments.length > 0) {
  const filesToUpload: File[] = [];
  for (const attachment of data.attachments) {
    if (attachment.originalFile) {
      filesToUpload.push(attachment.originalFile);
    }
  }
  
  // ... upload logic ...
  
  // Map uploaded files to attachments
  const attachments = uploadedMediaUrls.map(media => ({ ... }));
  
  const heritageData: HeritageContributionData = {
    ...data,
    attachments,  // ❌ ONLY new attachments!
  };
}
```

**CHANGE TO:**
```typescript
if (data.attachments.length > 0) {
  // Separate existing vs new attachments
  const existingAttachments = data.attachments.filter(att => att.url && !att.originalFile);
  const filesToUpload: File[] = [];
  
  for (const attachment of data.attachments) {
    if (attachment.originalFile) {
      filesToUpload.push(attachment.originalFile);
    }
  }
  
  // Upload NEW files
  if (filesToUpload.length > 0) {
    // ... existing upload logic ...
  }
  
  // ✅ MERGE: Keep existing + add new
  const allAttachments = [
    // Existing attachments (already uploaded)
    ...existingAttachments.map(att => ({
      type: att.type,
      url: att.url!,
      hash: att.hash!,
      name: att.name,
      id: att.id,
      size: att.size,
      mimeType: att.mimeType,
    })),
    // Newly uploaded attachments
    ...uploadedMediaUrls,
  ];
  
  const heritageData: HeritageContributionData = {
    ...data,
    attachments: allAttachments,  // ✅ ALL attachments!
  };
}
```

---

## 🎯 Implementation Steps

### Step 1: Apply Fix to useHeritagePublishing.ts

1. Open `src/hooks/useHeritagePublishing.ts`
2. Find the attachment processing section (around line 169)
3. Separate existing attachments (have `url`, no `originalFile`)
4. Keep existing attachments in final event
5. Merge existing + newly uploaded

### Step 2: Test Scenarios

**Test 1: Edit with No Changes to Attachments**
- Edit contribution
- Don't add/remove attachments
- Save
- ✅ Verify existing attachments are preserved

**Test 2: Edit and Add New Attachment**
- Edit contribution with 2 existing images
- Add 1 new image
- Save
- ✅ Verify all 3 images are in updated event

**Test 3: Edit and Remove Attachment**
- Currently: Just don't include it in form
- After fix: Will still be kept (need selective operations for removal)
- Document this limitation

---

## 🔄 Optional Enhancements (Not Critical)

### Enhancement 1: Selective Attachment Operations

**Purpose:** Allow users to explicitly choose which attachments to keep/remove.

**Implementation:**
1. Track which attachments user removed from form
2. Pass `selectiveOps: { removedAttachments: string[], keptAttachments: string[] }`
3. Filter based on user selection

**Example:**
```typescript
const keptAttachments = existingAttachments.filter(att => 
  !selectiveOps?.removedAttachments.includes(att.id)
);
```

### Enhancement 2: Dedicated Editing Hook

**Purpose:** Better code organization (not critical for functionality).

**Implementation:**
1. Create `src/hooks/useHeritageEditing.ts`
2. Wrap `publishHeritage` with editing-specific logic
3. Add state management for editing mode

**Note:** Current approach works fine, this is just cleaner code organization.

### Enhancement 3: Zustand Store

**Purpose:** Centralized UI state (not critical for functionality).

**Implementation:**
1. Create `src/stores/useMyContributionsStore.ts`
2. Move dialog states, loading states to store
3. Optional - current local state works fine

---

## 📋 Action Items

### Required (Critical Bug Fix)
- [ ] Apply attachment preservation fix to `useHeritagePublishing.ts`
- [ ] Test editing preserves existing attachments
- [ ] Test editing with new attachments added
- [ ] Verify no data loss occurs

### Optional (Enhancements)
- [ ] Add selective attachment operations (if needed)
- [ ] Create dedicated editing hook (for organization)
- [ ] Add Zustand store (for UI state centralization)

---

## ⚠️ Important Notes

1. **Heritage is NOT broken architecturally** - it works correctly for most operations
2. **The critical bug is attachment loss** - everything else is organizational preference
3. **Shop patterns are better organized** - but Heritage works with its current approach
4. **Minimal fix required** - just preserve existing attachments on edit

---

## 🔍 Comparison: Heritage vs Shop

### Attachment Handling on Edit

**Shop (Working):**
```typescript
// Fetches original product
const originalProduct = productStore.getProduct(productId);

// Keeps existing attachments
const keptAttachments = originalProduct.attachments.filter(att => 
  selectiveOps.keptAttachments.includes(att.id)
);

// Merges kept + new
allAttachments = [...keptAttachments, ...newAttachments];
```

**Heritage (Broken):**
```typescript
// ❌ Only uploads files with originalFile
// ❌ Doesn't preserve existing attachments
// ❌ No merge logic
```

**Heritage (After Fix):**
```typescript
// ✅ Separates existing vs new
const existingAttachments = data.attachments.filter(att => att.url && !att.originalFile);

// ✅ Merges existing + new
allAttachments = [...existingAttachments, ...uploadedMediaUrls];
```

---

## 📊 Impact Assessment

### Before Fix
- ❌ Editing loses all media (Critical data loss)
- ❌ Users can't update text without losing images
- ❌ Workaround: Re-upload all media every edit (painful)

### After Fix
- ✅ Editing preserves existing media
- ✅ Can add new media to existing
- ✅ No data loss
- 🟡 Can't selectively remove (need enhancement for that)

---

**END OF CRITICAL BUG ANALYSIS**

*Fix is simple: Just preserve existing attachments when merging for updates.*
