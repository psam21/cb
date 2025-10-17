'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMyShopProducts } from '@/hooks/useMyShopProducts';
// useProductEditing removed - edit functionality handled by dedicated page
import { useProductDeletion } from '@/hooks/useProductDeletion';
import { ProductDeleteDialog } from '@/components/shop/ProductDeleteDialog';
import { EditProgressIndicator } from '@/components/shop/EditProgressIndicator';
import { BaseGrid } from '@/components/ui/BaseGrid';
import { BaseCard } from '@/components/ui/BaseCard';
import { ShopProduct } from '@/services/business/ShopBusinessService';
import { logger } from '@/services/core/LoggingService';

export default function MyShopPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const { products, isLoading, error } = useMyShopProducts();
  // Edit functionality now handled by dedicated edit page
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


  const handleEditProduct = (product: ShopProduct) => {
    logger.info('Navigating to product edit page', {
      service: 'MyShopPage',
      method: 'handleEditProduct',
      productId: product.id,
      dTag: product.dTag,
      title: product.title,
    });
    // Use dTag for stable edit URLs (NIP-33 pattern)
    router.push(`/my-shop/edit/${product.dTag}`);
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



  // handleSaveProduct removed - now handled by dedicated edit page

  const handleConfirmDelete = async () => {
    logger.info('Confirming product deletion', {
      service: 'MyShopPage',
      method: 'handleConfirmDelete',
      productId: deletingProduct?.id,
    });

    const result = await confirmDelete();
    
    // Note: Products will be automatically filtered out by NIP-09 compliant relays
    // No manual refresh needed as the deletion event propagates
    
    return result;
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-gray-600 text-lg">
                Manage your product listings
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <button
                onClick={() => router.push('/shop')}
                className="btn-primary-sm"
              >
                Create Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading products...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Products</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && (
          <BaseGrid
            data={products.map(product => ({
              id: product.id,
              title: product.title,
              description: product.description,
              imageUrl: product.imageUrl,
              tags: product.tags,
              publishedAt: product.publishedAt,
              author: product.author,
              price: product.price,
              currency: product.currency,
              category: product.category,
              condition: product.condition,
              location: product.location,
              contact: product.contact,
              eventId: product.eventId,
              publishedRelays: product.publishedRelays,
            }))}
            renderItem={(item) => (
              <BaseCard
                data={item}
                variant="my-shop"
                onSelect={(data) => {
                  // Use dTag for stable URLs across edits (NIP-33 pattern)
                  const targetId = data.dTag || data.id;
                  if (!targetId) return;
                  router.push(`/shop/${targetId}`);
                }}
                onEdit={(data) => {
                  // Convert BaseCardData back to ShopProduct for the handler
                  const product = products.find(p => p.id === data.id);
                  if (product) handleEditProduct(product);
                }}
                onDelete={(data) => {
                  // Convert BaseCardData back to ShopProduct for the handler
                  const product = products.find(p => p.id === data.id);
                  if (product) handleDeleteProduct(product);
                }}
              />
            )}
            searchFields={[
              { key: 'title', label: 'Title', weight: 3 },
              { key: 'description', label: 'Description', weight: 2 },
              { key: 'tags', label: 'Tags', weight: 1 },
              { key: 'category', label: 'Category', weight: 1 },
            ]}
            filterFields={[
              { key: 'category', label: 'Category', type: 'select' },
            ]}
            sortOptions={[
              { key: 'publishedAt', label: 'Newest First', direction: 'desc' },
              { key: 'publishedAt', label: 'Oldest First', direction: 'asc' },
              { key: 'price', label: 'Price: Low to High', direction: 'asc' },
              { key: 'price', label: 'Price: High to Low', direction: 'desc' },
            ]}
            searchPlaceholder="Search your products..."
            gridClassName="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
          />
        )}
      </div>

      {/* Edit Form is now handled by dedicated page at /my-shop/edit/[id] */}

      {/* Delete Confirmation Dialog */}
      <ProductDeleteDialog
        product={deletingProduct}
        isOpen={showDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={cancelDelete}
        isDeleting={isDeleting}
      />

      {/* Delete Progress Indicator */}
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
