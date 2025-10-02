# Heritage Standardization with Shop Pattern

## Executive Summary

**Answer: NO, I only identified the bug. I did NOT standardize Heritage to match Shop's pattern.**

The current fix proposal just patches the bug (preserve existing attachments) but **doesn't implement Shop's proven architecture**:
- ❌ No `HeritageContentService.updateHeritageWithAttachments()` method
- ❌ No `useHeritageEditing` hook
- ❌ No selective operations support `{removedAttachments, keptAttachments}`
- ❌ Still using inline logic in `useHeritagePublishing` instead of service layer

## Shop's Correct Pattern (What We Need to Copy)

### Architecture

```
Component (Edit Page)
    ↓
useProductEditing Hook
    ↓
ShopBusinessService.updateProductWithAttachments()
    ↓
NostrEventService.createShopEvent()
```

### Key Files

1. **`src/hooks/useProductEditing.ts`** (lines 40-110)
   - Dedicated editing hook
   - Handles state management for update process
   - Accepts `selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }`
   - Updates Zustand store after success

2. **`src/services/business/ShopBusinessService.ts`** (lines 449-729)
   - `updateProductWithAttachments()` method
   - Fetches original product
   - Uploads new files
   - **Merges attachments with selective operations** (lines 690-714)
   - Checks for changes before publishing
   - Returns structured result

### The Critical Merge Logic (Shop's Pattern)

```typescript
// Lines 690-714 in ShopBusinessService.ts
let allAttachments: ProductAttachment[] = [];

if (selectiveOps) {
  // Selective management: user explicitly chose what to keep/remove
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
  // Legacy behavior: keep all existing and add new ones
  allAttachments = newAttachments.length > 0 
    ? [...(originalProduct.attachments || []), ...newAttachments]
    : originalProduct.attachments || [];
}
```

**Key Insight**: Shop has TWO modes:
1. **Selective mode**: Explicitly filter kept attachments, add new ones
2. **Legacy mode**: Keep ALL existing + add new ones

## Heritage's Current Broken Pattern

### Architecture (Missing Layers!)

```
Component (Edit Page)
    ↓
useHeritagePublishing Hook (DOES EVERYTHING!)
    ↓
HeritageContentService.createHeritageContribution() (NO UPDATE METHOD!)
    ↓
NostrEventService.createHeritageEvent()
```

### The Bug (Line 169 in useHeritagePublishing.ts)

```typescript
// Lines 169-177
const filesToUpload: File[] = [];
for (const attachment of data.attachments) {
  if (attachment.originalFile) {  // ← BUG: Existing attachments have NO originalFile!
    filesToUpload.push(attachment.originalFile);
  }
}
```

**Problem**: 
- **New attachments** from file picker: `{ id, type, originalFile: File, url: blob:... }`
- **Existing attachments** from database: `{ id, url: "https://...", hash: "sha256:..." }` ← NO originalFile!

**Result**: Existing attachments are filtered out → Lost on edit!

### What's Missing (Compared to Shop)

1. **No dedicated editing hook**
   - Heritage uses same `publishHeritage()` for create AND edit
   - Shop has separate `useProductEditing.updateProductData()`

2. **No service method for updates**
   - Heritage has `HeritageContentService.createHeritageContribution()` only
   - Shop has `ShopBusinessService.updateProductWithAttachments()` 

3. **No selective operations**
   - Heritage has no way to specify which attachments to keep/remove
   - Shop supports `selectiveOps: { removedAttachments: [], keptAttachments: [] }`

4. **No merge logic**
   - Heritage filters by `originalFile` (loses existing)
   - Shop explicitly merges: `[...keptAttachments, ...newAttachments]`

5. **No change detection**
   - Heritage always publishes, even if nothing changed
   - Shop checks `hasContentChanges` and `hasAttachmentChanges` before publishing

## How Shop Actually Works (Execution Trace)

### Edit Flow

1. **User clicks Edit** → Load product
2. **Component fetches** → Product has `attachments: [{ id, url, hash, type, name }]`
3. **Form displays** → Shows existing attachments (from database)
4. **User adds new file** → File picker adds `{ originalFile: File }`
5. **User removes attachment** → Tracked in `removedAttachments: ['att-123']`
6. **User submits** → Calls `updateProductData(productId, data, [newFile], { removedAttachments: ['att-123'], keptAttachments: ['att-456'] })`

7. **useProductEditing.updateProductData()** (lines 40-110):
   ```typescript
   const result = await shopBusinessService.updateProductWithAttachments(
     productId,
     updatedData,
     attachmentFiles,        // ← Only new File objects
     signer,
     user.pubkey,
     progressCallback,
     selectiveOps           // ← { removedAttachments, keptAttachments }
   );
   ```

8. **ShopBusinessService.updateProductWithAttachments()** (lines 449-729):
   ```typescript
   // Fetch original product from Nostr
   const originalProduct = await this.fetchSingleProduct(productId, ...);
   
   // Upload new files ONLY
   const newAttachments = await this.createProductAttachments(uploadedFiles, signer);
   
   // Merge with selective operations
   const keptAttachments = originalProduct.attachments.filter(att => 
     selectiveOps.keptAttachments.includes(att.id)
   );
   const allAttachments = [...keptAttachments, ...newAttachments];
   
   // Publish NIP-33 replacement event
   await nostrEventService.createShopEvent(...);
   ```

## What Heritage Needs to Match Shop

### Required Changes

#### 1. Create `HeritageContentService.updateHeritageWithAttachments()`

**Location**: `src/services/business/HeritageContentService.ts`

**Method signature**:
```typescript
async updateHeritageWithAttachments(
  contributionId: string,
  updatedData: Partial<HeritageContentData>,
  newAttachmentFiles: File[],
  signer: NDKSigner,
  userPubkey: string,
  onProgress?: (progress: HeritagePublishingProgress) => void,
  selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
): Promise<UpdateHeritageResult>
```

**Implementation pattern** (copy from Shop):
```typescript
// 1. Fetch original contribution from Nostr
const originalContribution = await this.fetchSingleContribution(contributionId, ...);

// 2. Upload new files
const uploadResult = await blossomService.uploadSequentialWithConsent(newAttachmentFiles, ...);
const newAttachments = await this.createHeritageAttachments(uploadedFiles, signer);

// 3. Merge attachments with selective operations
let allAttachments: HeritageAttachment[] = [];

if (selectiveOps) {
  // Selective: Keep only specified attachments + new ones
  const keptAttachments = (originalContribution.attachments || []).filter(att => 
    selectiveOps.keptAttachments.includes(att.id)
  );
  allAttachments = [...keptAttachments, ...newAttachments];
} else {
  // Legacy: Keep all existing + new ones
  allAttachments = newAttachments.length > 0 
    ? [...(originalContribution.attachments || []), ...newAttachments]
    : originalContribution.attachments || [];
}

// 4. Check for changes
const hasContentChanges = /* check if updatedData differs from original */;
const hasAttachmentChanges = newAttachments.length > 0 || (selectiveOps?.removedAttachments.length || 0) > 0;

if (!hasContentChanges && !hasAttachmentChanges) {
  return { success: true, contribution: originalContribution };
}

// 5. Publish NIP-33 replacement event
const result = await nostrEventService.createHeritageEvent({
  ...updatedData,
  attachments: allAttachments
}, signer, userPubkey, originalContribution.dTag); // ← Same dTag for replacement
```

#### 2. Create `useHeritageEditing` Hook

**Location**: `src/hooks/useHeritageEditing.ts`

**Pattern** (copy from `useProductEditing.ts`):
```typescript
export function useHeritageEditing() {
  const { signer, isAvailable } = useNostrSigner();
  const { user } = useAuthStore();
  const [isUpdating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<HeritagePublishingProgress | null>(null);

  const updateContributionData = useCallback(async (
    contributionId: string,
    updatedData: Partial<HeritageContentData>,
    attachmentFiles: File[],
    selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
  ): Promise<{ success: boolean; error?: string }> => {
    // Validate signer and user
    // Call heritageContentService.updateHeritageWithAttachments()
    // Update store if needed
    // Return result
  }, [signer, user]);

  return {
    isUpdating,
    updateError,
    updateProgress,
    updateContributionData,
    clearUpdateError: () => setUpdateError(null),
  };
}
```

#### 3. Update `useHeritagePublishing` Hook

**Change**: Remove inline update logic, delegate to service

**Current** (lines 60-250):
```typescript
async function publishHeritage(data: HeritagePublishingData, dTag?: string) {
  // Inline upload logic
  // Inline merge logic (BROKEN!)
  // Inline publish logic
}
```

**Should be**:
```typescript
async function publishHeritage(data: HeritagePublishingData, dTag?: string) {
  if (dTag) {
    // This is an UPDATE - delegate to service
    return await heritageContentService.updateHeritageWithAttachments(
      dTag,
      data,
      data.attachments.map(a => a.originalFile).filter(Boolean),
      signer,
      user.pubkey,
      setProgress
    );
  } else {
    // This is a CREATE - use existing creation logic
    return await heritageContentService.createHeritageContribution(data, signer, user.pubkey, setProgress);
  }
}
```

#### 4. Update Edit Page to Use New Hook

**Location**: `src/app/my-contributions/edit/[id]/page.tsx`

**Change**:
```typescript
// OLD (uses publishing hook)
import { useHeritagePublishing } from '@/hooks/useHeritagePublishing';

// NEW (uses editing hook)
import { useHeritageEditing } from '@/hooks/useHeritageEditing';

const { updateContributionData, isUpdating, updateError, updateProgress } = useHeritageEditing();

// On submit:
await updateContributionData(
  contributionId,
  formData,
  newAttachmentFiles,
  { removedAttachments, keptAttachments } // ← Add selective operations
);
```

#### 5. Add Selective Operations to Form Component

**Location**: `src/components/heritage/HeritageContributionForm.tsx`

**Add state tracking**:
```typescript
const [removedAttachments, setRemovedAttachments] = useState<string[]>([]);
const [keptAttachments, setKeptAttachments] = useState<string[]>([]);

// When user removes attachment:
function handleRemoveAttachment(attachmentId: string) {
  setRemovedAttachments(prev => [...prev, attachmentId]);
  setAttachments(prev => prev.filter(a => a.id !== attachmentId));
}

// On submit:
onSubmit(formData, newFiles, { removedAttachments, keptAttachments });
```

## Implementation Checklist

### Phase 1: Create Service Method (Critical)
- [ ] Create `HeritageContentService.updateHeritageWithAttachments()` method
  - [ ] Copy structure from `ShopBusinessService.updateProductWithAttachments()` (lines 449-729)
  - [ ] Fetch original contribution from Nostr
  - [ ] Upload new files using Blossom
  - [ ] Implement selective merge logic (lines 690-714 pattern)
  - [ ] Add change detection
  - [ ] Publish NIP-33 replacement event with same dTag

### Phase 2: Create Editing Hook
- [ ] Create `src/hooks/useHeritageEditing.ts`
  - [ ] Copy structure from `useProductEditing.ts`
  - [ ] Add state management (isUpdating, updateError, updateProgress)
  - [ ] Add `updateContributionData()` method
  - [ ] Call service method `updateHeritageWithAttachments()`

### Phase 3: Update Publishing Hook
- [ ] Refactor `useHeritagePublishing.ts`
  - [ ] Remove inline update logic (lines 165-250)
  - [ ] Delegate updates to service: `heritageContentService.updateHeritageWithAttachments()`
  - [ ] Keep creation logic as-is

### Phase 4: Update UI Components
- [ ] Update `src/app/my-contributions/edit/[id]/page.tsx`
  - [ ] Import and use `useHeritageEditing` instead of `useHeritagePublishing`
  - [ ] Track `removedAttachments` and `keptAttachments`
  - [ ] Pass selective operations to `updateContributionData()`

- [ ] Update `src/components/heritage/HeritageContributionForm.tsx`
  - [ ] Add props for selective operations
  - [ ] Track removed/kept attachments
  - [ ] Pass to parent on submit

### Phase 5: Testing
- [ ] Test create flow (should still work)
- [ ] Test edit with no changes (should skip publish)
- [ ] Test edit with text changes only (should preserve attachments)
- [ ] Test edit with new attachments (should merge with existing)
- [ ] Test edit with removed attachments (should filter out removed)
- [ ] Test edit with mixed operations (remove some, keep some, add new)

## Key Differences Summary

| Aspect | Shop (Correct) | Heritage (Current) | Heritage (After Fix) |
|--------|---------------|-------------------|---------------------|
| **Architecture** | Dedicated editing hook + service method | Single publishing hook for all | Same as Shop |
| **Service Method** | `updateProductWithAttachments()` | ❌ None (uses `createHeritageContribution`) | ✅ `updateHeritageWithAttachments()` |
| **Editing Hook** | `useProductEditing` | ❌ None (reuses `useHeritagePublishing`) | ✅ `useHeritageEditing` |
| **Attachment Merge** | Explicit merge with selective ops | ❌ Filters by `originalFile` (loses existing) | ✅ Same as Shop |
| **Selective Ops** | `{ removedAttachments, keptAttachments }` | ❌ Not supported | ✅ Supported |
| **Change Detection** | Checks before publishing | ❌ Always publishes | ✅ Same as Shop |
| **State Management** | Zustand store | Component state | Component state (can add store later) |

## Conclusion

**The bug fix alone is NOT enough.** To truly standardize with Shop:

1. ✅ **Identify bug** (attachment loss) - DONE
2. ❌ **Create service method** - NOT DONE (critical!)
3. ❌ **Create editing hook** - NOT DONE  
4. ❌ **Add selective operations** - NOT DONE
5. ❌ **Implement merge logic** - NOT DONE
6. ❌ **Add change detection** - NOT DONE

**Next Step**: Implement Phase 1 (create `HeritageContentService.updateHeritageWithAttachments()`) following Shop's exact pattern.
