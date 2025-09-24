# Shop Product Editing & Revision Capabilities

## Overview

This document outlines the comprehensive capabilities needed to enable product editing and revision functionality for signed-in users in the Culture Bridge Nostr Shop. Based on the current implementation at [https://culturebridge.vercel.app/shop](https://culturebridge.vercel.app/shop), users can create products but cannot edit them.

## Current State Analysis

### ✅ What's Already Built
- **Product Creation**: Full workflow with image upload, event creation, and relay publishing
- **Authentication**: NIP-07 signer detection and authentication via `useNostrSigner`
- **Product Display**: Product cards with all product information
- **Revision Infrastructure**: `updateProduct` method in `ShopBusinessService` (partially implemented)
- **Event Signing**: Complete signing workflow via `GenericEventService`

### ❌ What's Missing
- **UI Components**: Edit buttons, edit forms, confirmation dialogs
- **Authorization Logic**: Verify user owns the product before allowing edits
- **State Management**: Edit mode states, form pre-population
- **User Experience**: Seamless edit workflow with progress feedback
- **Error Handling**: Edit-specific error states and recovery

## Required Capabilities

### 1. **Authorization & Ownership Verification**

#### 1.1 Product Ownership Check
```typescript
// New method in ShopBusinessService
public async verifyProductOwnership(
  productId: string, 
  userPubkey: string
): Promise<{ isOwner: boolean; error?: string }> {
  // Check if user's pubkey matches product author
  // Handle revision chains (originalEventId tracking)
  // Return ownership status
}
```

#### 1.2 UI Authorization Logic
- Show edit buttons only for user's own products
- Disable edit functionality for other users' products
- Clear ownership indicators in UI

### 2. **Edit UI Components**

#### 2.1 Product Card Enhancements
```typescript
// Enhanced ProductCard props
interface ProductCardProps {
  product: ShopProduct;
  onContact?: (product: ShopProduct) => void;
  onEdit?: (product: ShopProduct) => void;        // NEW
  onDelete?: (product: ShopProduct) => void;      // NEW
  canEdit?: boolean;                              // NEW
  isOwner?: boolean;                              // NEW
}
```

#### 2.2 Edit Button Component
```typescript
// New component: src/components/shop/ProductEditButton.tsx
interface ProductEditButtonProps {
  product: ShopProduct;
  onEdit: (product: ShopProduct) => void;
  isOwner: boolean;
  isAuthenticated: boolean;
}
```

#### 2.3 Product Edit Form
```typescript
// New component: src/components/shop/ProductEditForm.tsx
interface ProductEditFormProps {
  product: ShopProduct;
  onSave: (productId: string, updatedData: ProductEventData, imageFile?: File) => Promise<void>;
  onCancel: () => void;
  isUpdating: boolean;
  updateProgress?: ShopPublishingProgress;
}
```

### 3. **State Management Enhancements**

#### 3.1 Edit Mode State
```typescript
// New state in useShopStore
interface ShopStoreState {
  // ... existing state
  editingProduct: ShopProduct | null;
  isEditing: boolean;
  isUpdating: boolean;
  updateProgress: ShopPublishingProgress | null;
  updateError: string | null;
}
```

#### 3.2 Edit Actions
```typescript
// New actions in useShopStore
const useShopStore = create<ShopStoreState>((set, get) => ({
  // ... existing state and actions
  
  // Edit actions
  startEditing: (product: ShopProduct) => set({ 
    editingProduct: product, 
    isEditing: true,
    updateError: null 
  }),
  
  cancelEditing: () => set({ 
    editingProduct: null, 
    isEditing: false,
    updateError: null 
  }),
  
  setUpdateProgress: (progress: ShopPublishingProgress) => set({ updateProgress: progress }),
  
  setUpdateError: (error: string) => set({ updateError: error }),
  
  setUpdating: (updating: boolean) => set({ isUpdating: updating }),
}));
```

### 4. **Business Logic Enhancements**

#### 4.1 Enhanced Update Method
```typescript
// Enhanced updateProduct in ShopBusinessService
public async updateProduct(
  originalEventId: string,
  updatedData: Partial<ProductEventData>,
  imageFile: File | null,
  signer: NostrSigner,
  onProgress?: (progress: ShopPublishingProgress) => void
): Promise<CreateProductResult> {
  // 1. Verify ownership
  // 2. Validate updated data
  // 3. Handle image updates
  // 4. Create revision event (Kind 23 with proper tags)
  // 5. Sign and publish revision
  // 6. Update local store
  // 7. Return success/error
}
```

#### 4.2 Product Deletion (Soft Delete)
```typescript
// New method in ShopBusinessService
public async deleteProduct(
  productId: string,
  signer: NostrSigner,
  onProgress?: (progress: ShopPublishingProgress) => void
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  // 1. Verify ownership
  // 2. Create deletion event (Kind 23 with deletion tags)
  // 3. Sign and publish deletion event
  // 4. Remove from local store
  // 5. Return success/error
}
```

### 5. **User Experience Enhancements**

#### 5.1 Edit Workflow
1. **Edit Button**: Appears only on user's own products
2. **Edit Form**: Pre-populated with current product data
3. **Image Handling**: Option to keep existing or upload new image
4. **Progress Feedback**: Real-time update progress with "X of Y published" status
5. **Success/Error States**: Clear feedback on update completion

#### 5.2 Confirmation Dialogs
```typescript
// New component: src/components/shop/ProductDeleteDialog.tsx
interface ProductDeleteDialogProps {
  product: ShopProduct;
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}
```

#### 5.3 Edit Progress Indicator
```typescript
// Enhanced progress component
interface EditProgressProps {
  progress: ShopPublishingProgress;
  isVisible: boolean;
  onClose: () => void;
}
```

### 6. **Data Model Enhancements**

#### 6.1 Product Revision Tracking
```typescript
// Enhanced ShopProduct interface
export interface ShopProduct {
  // ... existing fields
  originalEventId?: string;        // Track original product
  revisionNumber?: number;         // Track revision count
  isDeleted?: boolean;            // Soft delete flag
  deletedAt?: number;             // Deletion timestamp
  lastModified?: number;          // Last modification timestamp
}
```

#### 6.2 Revision Event Structure
```typescript
// Kind 23 revision event tags
const revisionTags = [
  ['t', 'culture-bridge-shop'],
  ['t', 'product-revision'],
  ['e', originalEventId, 'reply'],  // Reference to original
  ['r', 'product-update'],          // Revision type
  ['title', updatedTitle],
  ['price', updatedPrice.toString()],
  ['currency', updatedCurrency],
  // ... other updated fields
];
```

### 7. **Error Handling & Recovery**

#### 7.1 Edit-Specific Errors
```typescript
// New error types
export enum EditErrorCode {
  NOT_OWNER = 'NOT_OWNER',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  UPDATE_FAILED = 'UPDATE_FAILED',
  IMAGE_UPLOAD_FAILED = 'IMAGE_UPLOAD_FAILED',
  REVISION_CREATION_FAILED = 'REVISION_CREATION_FAILED',
  PUBLISHING_FAILED = 'PUBLISHING_FAILED',
}
```

#### 7.2 Retry Logic
- Automatic retry for failed relay publishing
- Manual retry option for failed updates
- Graceful degradation for partial failures

### 8. **Implementation Phases**

#### Phase 1: Core Edit Infrastructure
1. **Authorization Logic**: Verify product ownership
2. **Edit State Management**: Add edit mode to Zustand store
3. **Basic Edit UI**: Edit button and form components
4. **Update Business Logic**: Enhance `updateProduct` method

#### Phase 2: User Experience
1. **Edit Form**: Pre-populated form with current data
2. **Progress Feedback**: Real-time update progress
3. **Error Handling**: Edit-specific error states
4. **Success States**: Clear feedback on completion

#### Phase 3: Advanced Features
1. **Product Deletion**: Soft delete with confirmation
2. **Revision History**: Track and display product changes
3. **Bulk Operations**: Edit multiple products
4. **Advanced Validation**: Enhanced data validation

#### Phase 4: Polish & Optimization
1. **Performance**: Optimize edit operations
2. **Accessibility**: Ensure edit UI is accessible
3. **Mobile**: Responsive edit forms
4. **Testing**: Comprehensive edit workflow testing

### 9. **Technical Requirements**

#### 9.1 Dependencies
- **Existing**: All current dependencies are sufficient
- **New**: No additional dependencies required

#### 9.2 File Structure
```
src/
├── components/shop/
│   ├── ProductEditButton.tsx      # NEW
│   ├── ProductEditForm.tsx        # NEW
│   ├── ProductDeleteDialog.tsx    # NEW
│   └── EditProgressIndicator.tsx  # NEW
├── hooks/
│   └── useShopEditing.ts          # NEW
├── services/business/
│   └── ShopBusinessService.ts     # ENHANCED
└── stores/
    └── useShopStore.ts            # ENHANCED
```

#### 9.3 API Integration
- **Nostr Events**: Kind 23 revision events
- **Blossom**: Image upload for updates
- **Relays**: Publishing revision events
- **Local Store**: Update product cache

### 10. **Success Criteria**

#### 10.1 Functional Requirements
- ✅ Users can edit their own products
- ✅ Users cannot edit others' products
- ✅ Edit form pre-populated with current data
- ✅ Image updates work correctly
- ✅ Revision events published to relays
- ✅ Local store updated with changes
- ✅ Progress feedback during updates

#### 10.2 User Experience Requirements
- ✅ Intuitive edit workflow
- ✅ Clear ownership indicators
- ✅ Responsive edit forms
- ✅ Error recovery options
- ✅ Success confirmation

#### 10.3 Technical Requirements
- ✅ No breaking changes to existing functionality
- ✅ Proper error handling and logging
- ✅ Performance optimized
- ✅ Accessible UI components
- ✅ Mobile responsive

## Implementation Priority

### **High Priority** (Phase 1)
1. **Authorization Logic**: Verify product ownership
2. **Edit State Management**: Add edit mode to store
3. **Edit Button**: Show only on user's products
4. **Edit Form**: Basic edit functionality

### **Medium Priority** (Phase 2)
1. **Progress Feedback**: Real-time update progress
2. **Error Handling**: Edit-specific error states
3. **Image Updates**: Handle image changes
4. **Success States**: Clear completion feedback

### **Low Priority** (Phase 3)
1. **Product Deletion**: Soft delete functionality
2. **Revision History**: Track changes
3. **Bulk Operations**: Multiple product editing
4. **Advanced Validation**: Enhanced data validation

## Conclusion

The product editing capabilities require significant UI/UX work but leverage the existing Nostr infrastructure. The core business logic (`updateProduct`) is already partially implemented, making this primarily a frontend enhancement project. The implementation should follow the existing patterns for consistency and maintainability.

**Estimated Development Time**: 2-3 weeks for full implementation
**Complexity**: Medium (primarily UI/UX work)
**Risk Level**: Low (no breaking changes to existing functionality)
