# Shop vs Heritage: Side-by-Side Pattern Comparison

## Quick Answer

**Did I standardize with Shop's pattern?**

**NO.** I only identified the bug. I did NOT create the matching architecture that Shop has.

## Visual Comparison

### Shop's Pattern (What Works)

```
📁 Shop Architecture
│
├── 📄 useProductEditing.ts (Dedicated editing hook)
│   ├── updateProductData(productId, data, files, selectiveOps)
│   └── Manages: isUpdating, updateError, updateProgress
│
├── 📄 ShopBusinessService.ts
│   ├── updateProductWithAttachments() ← THE KEY METHOD
│   │   ├── 1. Fetch original product
│   │   ├── 2. Upload new files
│   │   ├── 3. Merge with selective ops ⭐
│   │   ├── 4. Check for changes
│   │   └── 5. Publish NIP-33 replacement
│   └── createProductAttachments()
│
├── 📄 useProductDeletion.ts (Dedicated deletion hook)
│   └── deleteProduct(productId)
│
└── 📄 useMyShopStore.ts (Zustand state)
    └── Centralized product management
```

### Heritage's Pattern (What's Broken)

```
📁 Heritage Architecture
│
├── 📄 useHeritagePublishing.ts (Does EVERYTHING!)
│   ├── publishHeritage(data, dTag?) ← Create AND Edit in one!
│   │   ├── ❌ Inline upload logic
│   │   ├── ❌ BROKEN: Filters by originalFile (loses existing)
│   │   └── ❌ No selective operations
│   └── Manages: isPublishing, error, progress
│
├── 📄 HeritageContentService.ts
│   ├── createHeritageContribution() ← Only for CREATE!
│   └── ❌ NO updateHeritageWithAttachments() method
│
├── ❌ NO useHeritageEditing.ts
│
├── ❌ NO useHeritageDeletion.ts
│
└── ❌ NO store (uses component state)
```

## The Critical Difference: Merge Logic

### Shop's Merge (Lines 690-714 in ShopBusinessService.ts)

```typescript
// Shop: Explicit merge with selective operations
let allAttachments: ProductAttachment[] = [];

if (selectiveOps) {
  // Mode 1: Selective - user chose what to keep/remove
  const keptAttachments = (originalProduct.attachments || []).filter(att => 
    selectiveOps.keptAttachments.includes(att.id)
  );
  allAttachments = [...keptAttachments, ...newAttachments];
  
  logger.info('Selective attachment merge', {
    originalCount: originalProduct.attachments?.length || 0,
    keptCount: keptAttachments.length,
    removedCount: selectiveOps.removedAttachments.length,
    newCount: newAttachments.length,
    finalCount: allAttachments.length
  });
} else {
  // Mode 2: Legacy - keep all existing + add new
  allAttachments = newAttachments.length > 0 
    ? [...(originalProduct.attachments || []), ...newAttachments]
    : originalProduct.attachments || [];
}

// Use merged attachments
const mergedData = {
  ...updatedData,
  attachments: allAttachments,  // ← Merged correctly!
};
```

**Result**: ✅ Existing attachments preserved, new ones added, removed ones filtered out

### Heritage's "Merge" (Lines 169-177 in useHeritagePublishing.ts)

```typescript
// Heritage: Filter by originalFile (WRONG!)
const filesToUpload: File[] = [];
for (const attachment of data.attachments) {
  if (attachment.originalFile) {  // ← BUG!
    filesToUpload.push(attachment.originalFile);
  }
}

// Only uploads files with originalFile
// Existing attachments (no originalFile) are LOST!
```

**Result**: ❌ Existing attachments discarded, only new uploads kept

## What Each Pattern Does on Edit

### Scenario: User edits a heritage contribution with 3 existing images, removes 1, adds 2 new ones

#### Shop's Flow

1. **Load product**: Fetch from Nostr
   - Existing attachments: `[{id: 'a1', url: '...', hash: '...'}, {id: 'a2', ...}, {id: 'a3', ...}]`

2. **Form displays**: Show 3 existing images

3. **User removes 'a2'**: Track in state
   - `removedAttachments: ['a2']`
   - `keptAttachments: ['a1', 'a3']`

4. **User adds 2 files**: New File objects
   - `newFiles: [File1, File2]`

5. **Submit**: Call `updateProductData(productId, data, [File1, File2], {removedAttachments: ['a2'], keptAttachments: ['a1', 'a3']})`

6. **Service method**: `updateProductWithAttachments()`
   - Upload new files → `newAttachments: [{id: 'a4', ...}, {id: 'a5', ...}]`
   - Filter kept: `keptAttachments = originalProduct.attachments.filter(att => ['a1', 'a3'].includes(att.id))`
   - Merge: `allAttachments = [{id: 'a1', ...}, {id: 'a3', ...}, {id: 'a4', ...}, {id: 'a5', ...}]`
   - Publish with 4 attachments

7. **Result**: ✅ 'a2' removed, 'a1' and 'a3' kept, 'a4' and 'a5' added

#### Heritage's Flow (Current - BROKEN)

1. **Load contribution**: Fetch from Nostr
   - Existing attachments: `[{id: 'h1', url: '...', hash: '...'}, {id: 'h2', ...}, {id: 'h3', ...}]`

2. **Edit page**: Convert to GenericAttachment
   - `attachments: [{id: 'h1', url: '...', hash: '...'}, {id: 'h2', ...}, {id: 'h3', ...}]`
   - ❌ **NO `originalFile` property!**

3. **Form displays**: Show 3 existing images

4. **User removes 'h2'**: ❌ Not tracked anywhere

5. **User adds 2 files**: New File objects
   - New attachments: `[{id: 'new1', originalFile: File1}, {id: 'new2', originalFile: File2}]`
   - Form state: `attachments: [{id: 'h1', url: '...'}, {id: 'h3', url: '...'}, {id: 'new1', originalFile: File1}, {id: 'new2', originalFile: File2}]`

6. **Submit**: Call `publishHeritage(data, dTag)`

7. **Publishing hook**: Filter by `originalFile`
   ```typescript
   const filesToUpload: File[] = [];
   for (const attachment of data.attachments) {
     if (attachment.originalFile) {  // ← Only new1 and new2 have this!
       filesToUpload.push(attachment.originalFile);
     }
   }
   // filesToUpload = [File1, File2]
   // h1 and h3 are LOST!
   ```

8. **Result**: ❌ Only 2 new attachments published, existing 'h1' and 'h3' LOST!

## Architecture Gap Analysis

| Component | Shop | Heritage | Status |
|-----------|------|----------|--------|
| **Edit Hook** | `useProductEditing` | ❌ None | Missing |
| **Delete Hook** | `useProductDeletion` | ❌ None | Missing |
| **Service Update** | `updateProductWithAttachments()` | ❌ None | Missing |
| **Service Create** | ✅ `createProductWithAttachments()` | ✅ `createHeritageContribution()` | Exists |
| **Selective Ops** | ✅ `{removedAttachments, keptAttachments}` | ❌ Not supported | Missing |
| **Merge Logic** | ✅ Explicit merge | ❌ Filter by `originalFile` | Broken |
| **Change Detection** | ✅ Checks before publish | ❌ Always publishes | Missing |
| **State Management** | ✅ Zustand store | ❌ Component state | Different |

## What Needs to Be Built

### 1. Service Method (CRITICAL)

**File**: `src/services/business/HeritageContentService.ts`

**Add method**:

```typescript
async updateHeritageWithAttachments(
  contributionId: string,
  updatedData: Partial<HeritageContentData>,
  newAttachmentFiles: File[],
  signer: NDKSigner,
  userPubkey: string,
  onProgress?: (progress: HeritagePublishingProgress) => void,
  selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
): Promise<UpdateHeritageResult> {
  // COPY from ShopBusinessService.updateProductWithAttachments (lines 449-729)
  // 1. Fetch original contribution
  // 2. Upload new files
  // 3. Merge with selective ops ⭐
  // 4. Check for changes
  // 5. Publish NIP-33 replacement
}
```

### 2. Editing Hook

**File**: `src/hooks/useHeritageEditing.ts`

**Create hook**:

```typescript
export function useHeritageEditing() {
  // COPY from useProductEditing.ts
  const [isUpdating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<HeritagePublishingProgress | null>(null);

  const updateContributionData = useCallback(async (
    contributionId: string,
    updatedData: Partial<HeritageContentData>,
    attachmentFiles: File[],
    selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
  ) => {
    // Call heritageContentService.updateHeritageWithAttachments()
  }, []);

  return { isUpdating, updateError, updateProgress, updateContributionData };
}
```

### 3. Update Publishing Hook

**File**: `src/hooks/useHeritagePublishing.ts`

**Change**:

```typescript
// OLD: Does everything inline
async function publishHeritage(data: HeritagePublishingData, dTag?: string) {
  // 100+ lines of inline upload/merge/publish logic
}

// NEW: Delegate to service
async function publishHeritage(data: HeritagePublishingData, dTag?: string) {
  if (dTag) {
    // UPDATE: Use service method
    return await heritageContentService.updateHeritageWithAttachments(...);
  } else {
    // CREATE: Keep existing logic
    return await heritageContentService.createHeritageContribution(...);
  }
}
```

### 4. Update Edit Page

**File**: `src/app/my-contributions/edit/[id]/page.tsx`

**Change**:

```typescript
// OLD
import { useHeritagePublishing } from '@/hooks/useHeritagePublishing';
const { publishHeritage } = useHeritagePublishing();

// NEW
import { useHeritageEditing } from '@/hooks/useHeritageEditing';
const { updateContributionData } = useHeritageEditing();

// Track selective operations
const [removedAttachments, setRemovedAttachments] = useState<string[]>([]);

// On submit
await updateContributionData(
  contributionId,
  formData,
  newFiles,
  { removedAttachments, keptAttachments }  // ← Add this!
);
```

### 5. Update Form Component

**File**: `src/components/heritage/HeritageContributionForm.tsx`

**Add selective ops tracking**:

```typescript
const [removedAttachments, setRemovedAttachments] = useState<string[]>([]);

function handleRemoveAttachment(attachmentId: string) {
  setRemovedAttachments(prev => [...prev, attachmentId]);
  setAttachments(prev => prev.filter(a => a.id !== attachmentId));
}

// On submit: Pass to parent
onSubmit(formData, newFiles, { removedAttachments, keptAttachments });
```

## Summary

### What I Did

✅ Identified the bug (attachment loss on edit)  
✅ Traced the exact code path causing the bug  
✅ Documented the issue  

### What I Did NOT Do

❌ Create `HeritageContentService.updateHeritageWithAttachments()` method  
❌ Create `useHeritageEditing` hook  
❌ Implement selective operations support  
❌ Implement merge logic matching Shop's pattern  
❌ Add change detection  
❌ Standardize architecture to match Shop  

### What's Needed

The fix requires **creating Shop's proven architecture for Heritage**:

1. **Service layer**: Move business logic to `HeritageContentService.updateHeritageWithAttachments()`
2. **Hook layer**: Create `useHeritageEditing` for edit operations
3. **Merge logic**: Copy Shop's selective operations pattern (lines 690-714)
4. **UI layer**: Track removed/kept attachments, pass to service

**This is NOT just a bug fix - it's architectural standardization.**

## Next Step

Implement Phase 1: Create `HeritageContentService.updateHeritageWithAttachments()` by copying Shop's pattern from `ShopBusinessService.updateProductWithAttachments()` (lines 449-729).
