# 🧪 **Test Scenarios for Multiple Attachments System**

## **Test Environment Setup**
- **Pages to Test**: `/my-shop` → Edit product → `/my-shop/edit/[id]`
- **Test Product**: "Legends of India - Bowlers" (2 existing attachments)
- **Logs Location**: Browser Console (F12 → Console)

---

## **Scenario 1: No Changes Made** ❌
**Action**: Open edit form, don't change anything, click "Save Changes"

**Expected Behavior**:
- ❌ **Save button does nothing**
- 🔴 **Red error message appears**: "No changes detected. Please make some changes before saving."
- 🚫 **No network requests**
- 🚫 **No signer prompts**

**Expected Logs**:
```javascript
// Form initialization
"Product edit form initialized with comprehensive initial state"
{
  initialFormData: { title: "Legends of India - Bowlers", description: "Kapil and Jasprit", ... },
  initialAttachments: [{ id: "imeta-05b9fc1a...", name: "05b9fc1a...", type: "image" }, ...],
  attachmentCount: 2
}

// On save attempt
"No changes detected in edit form, showing user message"
{
  reason: "User clicked save but made no changes",
  hasContentChanges: false,
  hasAttachmentChanges: false,
  hasAnyChanges: false
}
```

---

## **Scenario 2: Content Changes Only** ✅
**Action**: Change title from "Legends of India - Bowlers" to "Cricket Legends - Bowlers", click save

**Expected Behavior**:
- ✅ **Save button works**
- 🔄 **Progress indicator shows**: "Creating product revision..."
- 🔐 **Single signer prompt** (for revision event)
- ✅ **Redirects to /my-shop**
- ✅ **Updated product visible in my-shop**

**Expected Logs**:
```javascript
// Form submit
"Product edit form comprehensive change tracking"
{
  contentChanges: {
    title: { before: "Legends of India - Bowlers", after: "Cricket Legends - Bowlers", changed: true },
    description: { before: "Kapil and Jasprit", after: "Kapil and Jasprit", changed: false },
    // ... other fields unchanged
  },
  hasContentChanges: true,
  hasAttachmentChanges: false,
  hasAnyChanges: true
}

// Business service
"Original product state before update"
{
  originalState: { title: "Legends of India - Bowlers", attachmentCount: 2, ... }
}

"Final merged state after attachment processing"
{
  finalState: { title: "Cricket Legends - Bowlers", attachmentCount: 2, ... },
  changes: {
    contentChanges: { title: { before: "Legends of India - Bowlers", after: "Cricket Legends - Bowlers", changed: true } },
    attachmentChanges: { originalCount: 2, finalCount: 2, newCount: 0, removedCount: 0, keptCount: 2 }
  }
}
```

---

## **Scenario 3: Add New Attachments** ✅
**Action**: Drag & drop 2 new images, click save

**Expected Behavior**:
- ✅ **AttachmentManager shows 4 total files** (2 existing + 2 new)
- 🔄 **Progress indicator shows**: "Starting attachment uploads..." → "Uploading 2 files with Enhanced Sequential Upload"
- 🔐 **Multiple signer prompts** (1 per new file + 1 for revision event)
- ✅ **Final product has 4 attachments**

**Expected Logs**:
```javascript
// Form submit
"Product edit form comprehensive change tracking"
{
  attachmentTracking: {
    originalAttachments: [{ id: "imeta-05b9fc1a...", name: "05b9fc1a...", type: "image" }, ...],
    currentAttachments: [
      { id: "imeta-05b9fc1a...", name: "05b9fc1a...", type: "image", isNew: false },
      { id: "imeta-cc4342d5...", name: "cc4342d5...", type: "image", isNew: false },
      { id: "new-file-1", name: "new-image-1.jpg", type: "image", isNew: true },
      { id: "new-file-2", name: "new-image-2.jpg", type: "image", isNew: true }
    ],
    newFiles: [{ name: "new-image-1.jpg", type: "image/jpeg", size: 12345 }, ...],
    removedAttachments: [],
    keptAttachments: [{ id: "imeta-05b9fc1a...", ... }, { id: "imeta-cc4342d5...", ... }]
  },
  hasAttachmentChanges: true
}

// Business service
"Starting product update with multiple attachments"
{
  attachmentCount: 2,
  totalSize: 24690,
  hasSelectiveOps: true,
  selectiveOps: { removedCount: 0, keptCount: 2, keptIds: ["imeta-05b9fc1a...", "imeta-cc4342d5..."] }
}

"Selective attachment merge"
{
  originalCount: 2,
  keptCount: 2,
  removedCount: 0,
  newCount: 2,
  finalCount: 4
}
```

---

## **Scenario 4: Remove Existing Attachments** ✅
**Action**: Remove 1 existing attachment (click X), click save

**Expected Behavior**:
- ✅ **AttachmentManager shows 1 file** (down from 2)
- 🔄 **Progress indicator shows**: "Creating product revision..."
- 🔐 **Single signer prompt** (for revision event only)
- ✅ **Final product has 1 attachment**

**Expected Logs**:
```javascript
// Form submit
"Product edit form comprehensive change tracking"
{
  attachmentTracking: {
    originalAttachments: [{ id: "imeta-05b9fc1a...", name: "05b9fc1a...", type: "image" }, { id: "imeta-cc4342d5...", name: "cc4342d5...", type: "image" }],
    currentAttachments: [{ id: "imeta-05b9fc1a...", name: "05b9fc1a...", type: "image", isNew: false }],
    newFiles: [],
    removedAttachments: [{ id: "imeta-cc4342d5...", name: "cc4342d5...", type: "image" }],
    keptAttachments: [{ id: "imeta-05b9fc1a...", name: "05b9fc1a...", type: "image" }]
  },
  hasAttachmentChanges: true
}

// Business service
"Selective attachment merge"
{
  originalCount: 2,
  keptCount: 1,
  removedCount: 1,
  newCount: 0,
  finalCount: 1
}
```

---

## **Scenario 5: Replace All Attachments** ✅
**Action**: Remove both existing attachments, add 3 new ones, click save

**Expected Behavior**:
- ✅ **AttachmentManager shows 3 new files**
- 🔄 **Progress indicator shows**: "Starting attachment uploads..." → "Uploading 3 files with Enhanced Sequential Upload"
- 🔐 **Multiple signer prompts** (3 for new files + 1 for revision event)
- ✅ **Final product has 3 new attachments**

**Expected Logs**:
```javascript
// Form submit
"Product edit form comprehensive change tracking"
{
  attachmentTracking: {
    originalAttachments: [{ id: "imeta-05b9fc1a...", ... }, { id: "imeta-cc4342d5...", ... }],
    currentAttachments: [
      { id: "new-file-1", name: "new-1.jpg", type: "image", isNew: true },
      { id: "new-file-2", name: "new-2.jpg", type: "image", isNew: true },
      { id: "new-file-3", name: "new-3.jpg", type: "image", isNew: true }
    ],
    newFiles: [{ name: "new-1.jpg", type: "image/jpeg", size: 12345 }, ...],
    removedAttachments: [{ id: "imeta-05b9fc1a...", ... }, { id: "imeta-cc4342d5...", ... }],
    keptAttachments: []
  }
}

// Business service
"Selective attachment merge"
{
  originalCount: 2,
  keptCount: 0,
  removedCount: 2,
  newCount: 3,
  finalCount: 3
}
```

---

## **Scenario 6: Mixed Media Types** ✅
**Action**: Add 1 image + 1 video + 1 audio file, click save

**Expected Behavior**:
- ✅ **AttachmentManager shows 5 total files** (2 existing images + 3 new mixed media)
- 🔄 **Progress indicator shows**: "Starting attachment uploads..." → "Uploading 3 files with Enhanced Sequential Upload"
- 🔐 **Multiple signer prompts** (3 for new files + 1 for revision event)
- ✅ **Final product has 5 attachments with mixed types**

**Expected Logs**:
```javascript
// Form submit
"Product edit form comprehensive change tracking"
{
  attachmentTracking: {
    newFiles: [
      { name: "video.mp4", type: "video/mp4", size: 5000000 },
      { name: "audio.mp3", type: "audio/mpeg", size: 2000000 },
      { name: "image.jpg", type: "image/jpeg", size: 1000000 }
    ]
  }
}

// Business service
"Starting batch file validation"
{
  fileCount: 3,
  totalSize: 8000000,
  fileTypes: ["video/mp4", "audio/mpeg", "image/jpeg"]
}
```

---

## **Scenario 7: Validation Errors** ❌
**Action**: Try to add 6 files (exceeds 5 limit), click save

**Expected Behavior**:
- ❌ **Save button shows error**
- 🔴 **Error message**: "Too many attachments: 6. Maximum allowed: 5"
- 🚫 **No network requests**
- 🚫 **No signer prompts**

**Expected Logs**:
```javascript
// Form submit
"Product edit form comprehensive change tracking"
{
  summary: { totalAttachments: 6, hasAttachmentChanges: true }
}

// Business service
"Attachment validation completed"
{
  valid: false,
  errorCount: 1,
  validFileCount: 0
}

"Product with attachments publication failed"
{
  error: "Attachment validation failed: Too many attachments: 6. Maximum allowed: 5"
}
```

---

## **Scenario 8: File Size Validation** ❌
**Action**: Try to add a 600MB video file, click save

**Expected Behavior**:
- ❌ **Save button shows error**
- 🔴 **Error message**: "Total size too large: 600.00MB. Maximum allowed: 500.00MB"
- 🚫 **No network requests**

**Expected Logs**:
```javascript
// Business service
"Attachment validation completed"
{
  valid: false,
  errorCount: 1,
  validFileCount: 0
}

"Product with attachments publication failed"
{
  error: "Attachment validation failed: Total size too large: 600.00MB. Maximum allowed: 500.00MB"
}
```

---

## **Scenario 9: No Image Requirement** ❌
**Action**: Remove all images, add only video files, click save

**Expected Behavior**:
- ❌ **Save button shows error**
- 🔴 **Error message**: "At least one image attachment is required for products"
- 🚫 **No network requests**

**Expected Logs**:
```javascript
// Business service
"Attachment validation completed"
{
  valid: false,
  errorCount: 1,
  validFileCount: 0
}

"Product with attachments publication failed"
{
  error: "Attachment validation failed: At least one image attachment is required for products"
}
```

---

## **Key Log Patterns to Look For**

### **✅ Success Patterns**:
- `"Product edit form comprehensive change tracking"` with `hasAnyChanges: true`
- `"Starting product update with multiple attachments"`
- `"Selective attachment merge"` with correct counts
- `"Final merged state after attachment processing"`
- `"Product updated successfully"`

### **❌ Error Patterns**:
- `"No changes detected in edit form, showing user message"`
- `"Attachment validation failed"`
- `"Product with attachments publication failed"`

### **🔄 Progress Patterns**:
- `"Starting attachment uploads..."`
- `"Uploading X files with Enhanced Sequential Upload"`
- `"Creating product revision..."`
- `"Publishing to relays..."`

This comprehensive test suite covers all the major scenarios and edge cases for the multiple attachments system!