# 🧪 **Test Scenarios for Multiple Attachments System**

## **Test Environment Setup**
- **Pages to Test**: `/my-shop` → Edit product → `/my-shop/edit/[id]`
- **Test Product**: "90s Legends of India" (3 existing attachments)
- **Logs Location**: Browser Console (F12 → Console)
- **Recent Fix**: File removal now properly triggers form state updates

---

## **Scenario 1: No Changes Made** ❌
**Action**: Open edit form, don't change anything, click "Save Changes"

**Expected Behavior**:
- ❌ **Save button does nothing**
- 🔴 **Red error message appears**: "No changes detected. Please make some changes before saving."
- 🚫 **No network requests**
- 🚫 **No signer prompts**

---

## **Scenario 2: Content Changes Only** ✅
**Action**: Change title from "90s Legends of India" to "Cricket Legends - 90s", click save

**Expected Behavior**:
- ✅ **Save button works**
- 🔄 **Progress indicator shows**: "Creating product revision..."
- 🔐 **Single signer prompt** (for revision event)
- ✅ **Redirects to /my-shop**
- ✅ **Updated product visible in my-shop**

---

## **Scenario 3: Add New Attachments** ✅
**Action**: Drag & drop 2 new images, click save

**Expected Behavior**:
- ✅ **AttachmentManager shows 5 total files** (3 existing + 2 new)
- 🔄 **Progress indicator shows**: "Starting attachment uploads..." → "Uploading 2 files with Enhanced Sequential Upload"
- 🔐 **Multiple signer prompts** (1 per new file + 1 for revision event)
- ✅ **Final product has 5 attachments**

---

## **Scenario 4: Remove Existing Attachments** ✅
**Action**: Remove 1 existing attachment (click X), click save

**Expected Behavior**:
- ✅ **AttachmentManager shows 2 files** (down from 3)
- 🔄 **Progress indicator shows**: "Creating product revision..."
- 🔐 **Single signer prompt** (for revision event only)
- ✅ **Final product has 2 attachments**

---

## **Scenario 5: Replace All Attachments** ✅
**Action**: Remove all 3 existing attachments, add 3 new ones, click save

**Expected Behavior**:
- ✅ **AttachmentManager shows 3 new files**
- 🔄 **Progress indicator shows**: "Starting attachment uploads..." → "Uploading 3 files with Enhanced Sequential Upload"
- 🔐 **Multiple signer prompts** (3 for new files + 1 for revision event)
- ✅ **Final product has 3 new attachments**

---

## **Scenario 6: Mixed Media Types** ✅
**Action**: Add 1 image + 1 video + 1 audio file, click save

**Expected Behavior**:
- ✅ **AttachmentManager shows 6 total files** (3 existing images + 3 new mixed media)
- 🔄 **Progress indicator shows**: "Starting attachment uploads..." → "Uploading 3 files with Enhanced Sequential Upload"
- 🔐 **Multiple signer prompts** (3 for new files + 1 for revision event)
- ✅ **Final product has 6 attachments with mixed types**

---

## **Scenario 7: Validation Errors** ❌
**Action**: Try to add 3 files (exceeds 5 limit), click save

**Expected Behavior**:
- ❌ **Save button shows error**
- 🔴 **Error message**: "Too many attachments: 6. Maximum allowed: 5"
- 🚫 **No network requests**
- 🚫 **No signer prompts**

---

## **Scenario 8: File Size Validation** ❌
**Action**: Try to add a 600MB video file, click save

**Expected Behavior**:
- ❌ **Save button shows error**
- 🔴 **Error message**: "Total size too large: 600.00MB. Maximum allowed: 500.00MB"
- 🚫 **No network requests**

---

## **Scenario 9: No Image Requirement** ❌
**Action**: Remove all images, add only video files, click save

**Expected Behavior**:
- ❌ **Save button shows error**
- 🔴 **Error message**: "At least one image attachment is required for products"
- 🚫 **No network requests**

---

## **Key Success Indicators**

### **✅ Success Patterns**:
- Form state updates when attachments are added/removed
- Progress indicators show correct steps
- Appropriate number of signer prompts
- Successful redirect to my-shop page
- Updated product visible in product list

### **❌ Error Patterns**:
- "No changes detected" message when no changes made
- Validation error messages for limits exceeded
- No network requests for invalid operations
- Form stays on edit page for errors

### **🔄 Progress Patterns**:
- "Starting attachment uploads..." for new files
- "Creating product revision..." for content changes
- "Publishing to relays..." for final step
- Progress percentages increment correctly

This comprehensive test suite covers all the major scenarios and edge cases for the multiple attachments system!