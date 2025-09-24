# My Shop Listings & Product Management Capabilities

## Overview

This document outlines the comprehensive capabilities needed to create a dedicated "My Shop Listings" page for product management and editing functionality in the Culture Bridge Nostr Shop. This approach separates public shop viewing from personal product management, providing a cleaner UX and better performance for product owners.

**New Page Structure:**
- `/shop` - Public shop (view only, no edit buttons)
- `/my-shop` - User's own listings (full CRUD operations)

## Current State Analysis

### ✅ What's Already Built
- **Product Creation**: Full workflow with image upload, event creation, and relay publishing
- **Authentication**: NIP-07 signer detection and authentication via `useNostrSigner`
- **Product Display**: Product cards with all product information
- **Revision Infrastructure**: `updateProduct` method in `ShopBusinessService` (partially implemented)
- **Event Signing**: Complete signing workflow via `GenericEventService`

### ❌ What's Missing
- **My Shop Page**: Dedicated page for user's own product management
- **Product Query by Author**: Fetch all products by specific user
- **Edit UI Components**: Edit buttons, edit forms, confirmation dialogs
- **State Management**: My shop state, edit mode states, form pre-population
- **User Experience**: Seamless product management workflow with progress feedback
- **Error Handling**: Edit-specific error states and recovery

## Required Capabilities

### 1. **My Shop Page Infrastructure**

#### 1.1 New Page Route
```typescript
// New page: src/app/my-shop/page.tsx
export default function MyShopPage() {
  const { products, isLoading, error } = useMyShopProducts();
  const { isAuthenticated, npub } = useNostrSigner();
  
  if (!isAuthenticated) {
    return <AuthenticationRequired />;
  }
  
  return (
    <div className="min-h-screen bg-primary-50">
      <MyShopHeader />
      <MyShopProducts products={products} />
    </div>
  );
}
```

#### 1.2 Product Query by Author
```typescript
// New method in ShopBusinessService
public async queryProductsByAuthor(
  authorPubkey: string
): Promise<{ success: boolean; products: ShopProduct[]; error?: string }> {
  const filters = [
    {
      kinds: [23],
      authors: [authorPubkey], // Filter by specific author
      '#t': ['culture-bridge-shop'],
    }
  ];
  
  const result = await queryEvents(filters);
  if (!result.success) {
    return { success: false, products: [], error: result.error };
  }
  
  const products = result.events.map(event => this.parseProductFromEvent(event));
  return { success: true, products };
}
```

#### 1.3 My Shop Hook
```typescript
// New hook: src/hooks/useMyShopProducts.ts
export const useMyShopProducts = () => {
  const { pubkey } = useNostrSigner();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadMyProducts = useCallback(async () => {
    if (!pubkey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await shopBusinessService.queryProductsByAuthor(pubkey);
      if (result.success) {
        setProducts(result.products);
      } else {
        setError(result.error || 'Failed to load products');
      }
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [pubkey]);
  
  useEffect(() => {
    loadMyProducts();
  }, [loadMyProducts]);
  
  return { products, isLoading, error, refreshProducts: loadMyProducts };
};
```

### 2. **My Shop UI Components**

#### 2.1 My Shop Header
```typescript
// New component: src/components/shop/MyShopHeader.tsx
interface MyShopHeaderProps {
  productCount: number;
  onCreateNew: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const MyShopHeader = ({ productCount, onCreateNew, onRefresh, isLoading }: MyShopHeaderProps) => (
  <div className="bg-white shadow-sm border-b">
    <div className="container-width py-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary-800">My Shop Listings</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Manage your {productCount} product{productCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex gap-3">
          <button onClick={onRefresh} disabled={isLoading} className="btn-outline">
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={onCreateNew} className="btn-primary">
            Create New Product
          </button>
        </div>
      </div>
    </div>
  </div>
);
```

#### 2.2 My Shop Product Card
```typescript
// New component: src/components/shop/MyShopProductCard.tsx
interface MyShopProductCardProps {
  product: ShopProduct;
  onEdit: (product: ShopProduct) => void;
  onDelete: (product: ShopProduct) => void;
  onView: (product: ShopProduct) => void;
}

export const MyShopProductCard = ({ product, onEdit, onDelete, onView }: MyShopProductCardProps) => (
  <div className="card overflow-hidden hover:shadow-xl transition-all duration-300 group">
    {/* Product Image */}
    <div className="relative aspect-[4/3] bg-primary-50">
      {/* Image content */}
    </div>
    
    {/* Product Info */}
    <div className="p-6">
      <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">{product.title}</h3>
      <p className="text-2xl font-bold text-accent-600 mb-4">{formatPrice(product.price, product.currency)}</p>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={() => onView(product)} className="btn-outline-sm flex-1">
          View
        </button>
        <button onClick={() => onEdit(product)} className="btn-primary-sm flex-1">
          Edit
        </button>
        <button onClick={() => onDelete(product)} className="btn-danger-sm">
          Delete
        </button>
      </div>
    </div>
  </div>
);
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

#### 3.1 My Shop State
```typescript
// New state in useMyShopStore
interface MyShopStoreState {
  // Products
  myProducts: ShopProduct[];
  isLoadingMyProducts: boolean;
  myProductsError: string | null;
  
  // Editing
  editingProduct: ShopProduct | null;
  isEditing: boolean;
  isUpdating: boolean;
  updateProgress: ShopPublishingProgress | null;
  updateError: string | null;
  
  // UI State
  showCreateForm: boolean;
  showDeleteDialog: boolean;
  deletingProduct: ShopProduct | null;
}
```

#### 3.2 My Shop Actions
```typescript
// New store: src/stores/useMyShopStore.ts
const useMyShopStore = create<MyShopStoreState>((set, get) => ({
  // Initial state
  myProducts: [],
  isLoadingMyProducts: false,
  myProductsError: null,
  editingProduct: null,
  isEditing: false,
  isUpdating: false,
  updateProgress: null,
  updateError: null,
  showCreateForm: false,
  showDeleteDialog: false,
  deletingProduct: null,
  
  // Product management actions
  setMyProducts: (products: ShopProduct[]) => set({ myProducts: products }),
  setLoadingMyProducts: (loading: boolean) => set({ isLoadingMyProducts: loading }),
  setMyProductsError: (error: string | null) => set({ myProductsError: error }),
  
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
  
  setUpdating: (updating: boolean) => set({ isUpdating: updating }),
  setUpdateProgress: (progress: ShopPublishingProgress) => set({ updateProgress: progress }),
  setUpdateError: (error: string) => set({ updateError: error }),
  
  // Create form actions
  showCreateForm: () => set({ showCreateForm: true }),
  hideCreateForm: () => set({ showCreateForm: false }),
  
  // Delete dialog actions
  showDeleteDialog: (product: ShopProduct) => set({ 
    showDeleteDialog: true, 
    deletingProduct: product 
  }),
  hideDeleteDialog: () => set({ 
    showDeleteDialog: false, 
    deletingProduct: null 
  }),
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
  // 1. Get user's pubkey for ownership verification
  const userPubkey = await signer.getPublicKey();
  
  // 2. Validate updated data
  const validation = this.validateProductData(updatedData as ProductEventData);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // 3. Handle image updates if new image provided
  let imageMetadata: BlossomFileMetadata | null = null;
  if (imageFile) {
    onProgress?.({ step: 'uploading', progress: 10, message: 'Uploading new image...' });
    const uploadResult = await blossomService.uploadFile(imageFile, signer);
    if (!uploadResult.success) {
      return { success: false, error: `Image upload failed: ${uploadResult.error}` };
    }
    imageMetadata = uploadResult.metadata!;
  }
  
  // 4. Create revision event (Kind 23 with proper tags)
  onProgress?.({ step: 'creating_event', progress: 50, message: 'Creating revision event...' });
  const revisionEvent = await this.createRevisionEvent(originalEventId, updatedData, imageMetadata);
  
  // 5. Sign and publish revision
  onProgress?.({ step: 'publishing', progress: 70, message: 'Publishing to relays...' });
  const publishResult = await this.publishRevisionEvent(revisionEvent, signer, onProgress);
  
  // 6. Update local store
  if (publishResult.success) {
    this.updateProductInStore(originalEventId, updatedData, publishResult.eventId);
  }
  
  return publishResult;
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
  // 1. Get user's pubkey for ownership verification
  const userPubkey = await signer.getPublicKey();
  
  // 2. Verify ownership (product must be in user's products)
  const product = productStore.getProduct(productId);
  if (!product || product.author !== userPubkey) {
    return { success: false, error: 'Product not found or not owned by user' };
  }
  
  // 3. Create deletion event (Kind 23 with deletion tags)
  onProgress?.({ step: 'creating_event', progress: 30, message: 'Creating deletion event...' });
  const deletionEvent = await this.createDeletionEvent(productId, signer);
  
  // 4. Sign and publish deletion event
  onProgress?.({ step: 'publishing', progress: 60, message: 'Publishing deletion to relays...' });
  const publishResult = await this.publishDeletionEvent(deletionEvent, signer, onProgress);
  
  // 5. Mark as deleted in local store
  if (publishResult.success) {
    this.markProductAsDeleted(productId);
  }
  
  return publishResult;
}
```

### 5. **User Experience Enhancements**

#### 5.1 My Shop Workflow
1. **Navigation**: User navigates to `/my-shop` to manage products
2. **Product List**: Shows all user's products with edit/delete buttons
3. **Edit Form**: Pre-populated with current product data
4. **Image Handling**: Option to keep existing or upload new image
5. **Progress Feedback**: Real-time update progress with "X of Y published" status
6. **Success/Error States**: Clear feedback on update completion

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

export const ProductDeleteDialog = ({ product, isOpen, onConfirm, onCancel, isDeleting }: ProductDeleteDialogProps) => (
  <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Product</h3>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete "{product.title}"? This action cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} disabled={isDeleting} className="btn-outline">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={isDeleting} className="btn-danger">
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);
```

#### 5.3 Edit Progress Indicator
```typescript
// Enhanced progress component
interface EditProgressProps {
  progress: ShopPublishingProgress;
  isVisible: boolean;
  onClose: () => void;
}

export const EditProgressIndicator = ({ progress, isVisible, onClose }: EditProgressProps) => (
  <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isVisible ? 'block' : 'hidden'}`}>
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Updating Product</h3>
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">{progress.message}</p>
      </div>
      <button onClick={onClose} className="btn-outline w-full">
        Close
      </button>
    </div>
  </div>
);
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

### 7. **Error Handling & Transparency**

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
  RELAY_CONNECTION_FAILED = 'RELAY_CONNECTION_FAILED',
  PARTIAL_PUBLISH_FAILED = 'PARTIAL_PUBLISH_FAILED',
}
```

#### 7.2 Transparency & Retry Logic
- **Show all failures transparently** - User sees exactly what failed
- **Detailed relay status** - Which relays succeeded/failed and why
- **Manual retry options** - User controls when to retry
- **No rollbacks** - User owns their data, they decide what to do
- **Partial success handling** - Show which relays worked, which didn't

### 8. **Implementation Phases**

#### Phase 1: My Shop Page Infrastructure
1. **My Shop Page**: Create `/my-shop` route and basic layout
2. **Product Query by Author**: Implement `queryProductsByAuthor` method
3. **My Shop Hook**: Create `useMyShopProducts` hook
4. **My Shop Store**: Create `useMyShopStore` for state management

#### Phase 2: Product Management UI
1. **My Shop Header**: Product count, refresh, create new buttons
2. **My Shop Product Card**: Edit, delete, view buttons
3. **Product Edit Form**: Pre-populated form with current data
4. **Delete Confirmation Dialog**: Safe product deletion

#### Phase 3: Edit & Update Functionality
1. **Update Business Logic**: Enhance `updateProduct` method
2. **Progress Feedback**: Real-time update progress with relay status
3. **Error Transparency**: Detailed failure reporting and relay status
4. **Success Feedback**: Detailed relay publishing results

#### Phase 4: Advanced Features
1. **Product Deletion**: Soft delete with confirmation
2. **Revision History**: Track and display product changes
3. **Bulk Operations**: Edit multiple products
4. **Advanced Validation**: Enhanced data validation

#### Phase 5: Polish & Optimization
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
├── app/
│   └── my-shop/
│       └── page.tsx               # NEW - My Shop page
├── components/shop/
│   ├── MyShopHeader.tsx           # NEW - My Shop header
│   ├── MyShopProductCard.tsx      # NEW - Product card with edit/delete
│   ├── ProductEditForm.tsx        # NEW - Edit form
│   ├── ProductDeleteDialog.tsx    # NEW - Delete confirmation
│   └── EditProgressIndicator.tsx  # NEW - Progress indicator
├── hooks/
│   └── useMyShopProducts.ts       # NEW - My Shop hook
├── services/business/
│   └── ShopBusinessService.ts     # ENHANCED - queryProductsByAuthor, updateProduct, deleteProduct
└── stores/
    └── useMyShopStore.ts          # NEW - My Shop state management
```

#### 9.3 API Integration
- **Nostr Events**: Kind 23 revision events
- **Blossom**: Image upload for updates
- **Relays**: Publishing revision events
- **Local Store**: Update product cache

### 10. **Success Criteria**

#### 10.1 Functional Requirements
- ✅ **My Shop Page**: Users can navigate to `/my-shop` to manage products
- ✅ **Product Query by Author**: Fetches all user's products without pagination
- ✅ **Edit Functionality**: Users can edit their own products
- ✅ **Delete Functionality**: Users can delete their own products
- ✅ **Edit Form**: Pre-populated with current product data
- ✅ **Image Updates**: Handle image changes correctly
- ✅ **Revision Events**: Kind 23 revision events published to relays
- ✅ **Progress Feedback**: Real-time update progress with relay status

#### 10.2 User Experience Requirements
- ✅ **Intuitive My Shop Workflow**: Clear navigation and product management
- ✅ **Clear Ownership Indicators**: Only user's products show edit/delete buttons
- ✅ **Responsive Edit Forms**: Mobile-friendly edit interface
- ✅ **Transparent Error Reporting**: Show exactly what failed and why
- ✅ **Detailed Success Feedback**: Show which relays published successfully
- ✅ **Manual Retry Controls**: User decides when and how to retry

#### 10.3 Technical Requirements
- ✅ **No Breaking Changes**: Existing `/shop` page remains unchanged
- ✅ **Proper Error Handling**: Comprehensive error handling and logging
- ✅ **Performance Optimized**: Efficient product querying and state management
- ✅ **Accessible UI Components**: WCAG compliant interface
- ✅ **Mobile Responsive**: Works on all device sizes

## Implementation Priority

### **High Priority** (Phase 1)
1. **My Shop Page**: Create `/my-shop` route and basic layout
2. **Product Query by Author**: Implement `queryProductsByAuthor` method
3. **My Shop Hook**: Create `useMyShopProducts` hook
4. **My Shop Store**: Create `useMyShopStore` for state management

### **Medium Priority** (Phase 2)
1. **My Shop UI Components**: Header, product cards, edit forms
2. **Edit Functionality**: Update product business logic
3. **Delete Functionality**: Soft delete with confirmation
4. **Progress Feedback**: Real-time update progress with relay status

### **Low Priority** (Phase 3)
1. **Error Transparency**: Detailed failure reporting and relay status
2. **Success Feedback**: Detailed relay publishing results
3. **Revision History**: Track and display product changes
4. **Bulk Operations**: Multiple product editing

## Nostr Architecture Principles

### **🎯 Key Nostr Principles for Product Editing**

1. **User Owns Their Data**
   - No optimistic updates or rollbacks
   - User sees all failures transparently
   - User controls retry decisions

2. **Transparency Over Smooth UX**
   - Show exactly which relays succeeded/failed
   - Display detailed error messages
   - Let user decide how to handle failures

3. **Client IS the Backend**
   - All validation happens client-side
   - All event creation happens client-side
   - Relays are just storage/communication layer

4. **Event-Driven Updates**
   - Create revision events (Kind 23)
   - Publish to multiple relays
   - Show publishing progress and results

### **🔄 Recommended My Shop Flow**

```
1. User navigates to /my-shop
2. Page loads all user's products (no pagination)
3. User sees product cards with Edit/Delete buttons
4. User clicks "Edit Product"
5. Show edit form with current data
6. User makes changes and clicks "Save"
7. Show "Creating revision event..." status
8. Show "Publishing to relays..." with progress
9. Show detailed results:
   - ✅ Published to 4/6 relays
   - ❌ Failed: relay.damus.io (connection timeout)
   - ❌ Failed: nos.lol (rate limited)
10. Provide retry options for failed relays
11. User can retry failed relays or accept partial success
```

## Conclusion

The My Shop Listings page provides a dedicated space for product management, separating public shop viewing from personal product management. This approach leverages the existing Nostr infrastructure while providing a cleaner UX and better performance for product owners. The implementation should follow Nostr principles: **transparency, user control, and event-driven updates**.

**Key Benefits:**
- **Clean Separation**: Public shop vs. personal management
- **Better Performance**: Load all user's products without pagination
- **Nostr-Friendly**: User manages their own data in dedicated space
- **No Breaking Changes**: Existing `/shop` page remains unchanged

**Estimated Development Time**: 2-3 weeks for full implementation
**Complexity**: Medium (primarily UI/UX work)
**Risk Level**: Low (no breaking changes to existing functionality)
**Architecture**: Follows Nostr principles of transparency and user ownership
