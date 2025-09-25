'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMyShopProducts } from '@/hooks/useMyShopProducts';
import { useProductEditing } from '@/hooks/useProductEditing';
import { useProductDeletion } from '@/hooks/useProductDeletion';
import { MyShopHeader } from '@/components/shop/MyShopHeader';
import { MyShopProductCard } from '@/components/shop/MyShopProductCard';
import { ProductEditForm } from '@/components/shop/ProductEditForm';
import { ProductDeleteDialog } from '@/components/shop/ProductDeleteDialog';
import { EditProgressIndicator } from '@/components/shop/EditProgressIndicator';
import { ShopProduct } from '@/services/business/ShopBusinessService';
import { ProductEventData } from '@/services/nostr/NostrEventService';
import { logger } from '@/services/core/LoggingService';

export default function MyShopPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const { products, isLoading, error, refreshProducts } = useMyShopProducts();
  const { 
    editingProduct, 
    isEditing, 
    isUpdating, 
    updateProgress, 
    startEditing, 
    updateProductData, 
    cancelEdit 
  } = useProductEditing();
  const { 
    deletingProduct, 
    showDeleteDialog, 
    isDeleting, 
    deleteProgress, 
    showDeleteConfirmation, 
    confirmDelete, 
    cancelDelete 
  } = useProductDeletion();

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if not authenticated (only on client)
  if (isClient && (!isAuthenticated || !user)) {
    logger.warn('User not authenticated, redirecting to signin', {
      service: 'MyShopPage',
      method: 'render',
      isAuthenticated,
      hasUser: !!user,
    });
    router.push('/signin');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-800 mb-4">Redirecting to Sign In...</h1>
          <p className="text-gray-600">Please sign in to manage your shop listings.</p>
        </div>
      </div>
    );
  }

  // Show loading during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-800 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your shop.</p>
        </div>
      </div>
    );
  }

  const handleCreateNew = () => {
    logger.info('Navigating to create new product', {
      service: 'MyShopPage',
      method: 'handleCreateNew',
    });
    router.push('/shop?create=true');
  };

  const handleEditProduct = (product: ShopProduct) => {
    logger.info('Starting product edit', {
      service: 'MyShopPage',
      method: 'handleEditProduct',
      productId: product.id,
      title: product.title,
    });
    startEditing(product);
  };

  const handleDeleteProduct = (product: ShopProduct) => {
    logger.info('Showing delete confirmation', {
      service: 'MyShopPage',
      method: 'handleDeleteProduct',
      productId: product.id,
      title: product.title,
    });
    showDeleteConfirmation(product);
  };


  const handleToggleDeleted = () => {
    logger.info('Toggling deleted items display', {
      service: 'MyShopPage',
      method: 'handleToggleDeleted',
      showDeleted: !showDeleted,
    });
    setShowDeleted(!showDeleted);
  };

  const handleSaveProduct = async (productId: string, updatedData: Partial<ProductEventData>, imageFile: File | null) => {
    logger.info('Saving product updates', {
      service: 'MyShopPage',
      method: 'handleSaveProduct',
      productId,
      hasImage: !!imageFile,
    });

    const result = await updateProductData(productId, updatedData, imageFile);
    
    if (result.success) {
      // Refresh the products list
      await refreshProducts();
    }
    
    return result;
  };

  const handleConfirmDelete = async () => {
    logger.info('Confirming product deletion', {
      service: 'MyShopPage',
      method: 'handleConfirmDelete',
      productId: deletingProduct?.id,
    });

    const result = await confirmDelete();
    
    if (result.success) {
      // Refresh the products list
      await refreshProducts();
    }
    
    return result;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <MyShopHeader
        productCount={products.length}
        onCreateNew={handleCreateNew}
        onRefresh={refreshProducts}
        isLoading={isLoading}
        showDeleted={showDeleted}
        onToggleDeleted={handleToggleDeleted}
      />

      {/* Main Content */}
      <div className="container-width section-padding">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-primary-600 text-lg">Loading your products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-2">Error Loading Products</h2>
            <p className="text-primary-600 mb-6">{error}</p>
            <button
              onClick={refreshProducts}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && (
          <>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-primary-800 mb-2">No Products Yet</h2>
                <p className="text-primary-600 mb-6">Start building your shop by creating your first product.</p>
                <button
                  onClick={handleCreateNew}
                  className="btn-primary"
                >
                  Create Your First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <MyShopProductCard
                    key={product.id}
                    product={product}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Form Modal */}
      {isEditing && editingProduct && (
        <ProductEditForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={cancelEdit}
          isUpdating={isUpdating}
          updateProgress={updateProgress}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ProductDeleteDialog
        product={deletingProduct}
        isOpen={showDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={cancelDelete}
        isDeleting={isDeleting}
      />

      {/* Progress Indicators */}
      {updateProgress && (
        <EditProgressIndicator
          progress={updateProgress}
          isVisible={isUpdating}
          onClose={() => {}}
        />
      )}

      {deleteProgress && (
        <EditProgressIndicator
          progress={deleteProgress}
          isVisible={isDeleting}
          onClose={() => {}}
        />
      )}
    </div>
  );
}
