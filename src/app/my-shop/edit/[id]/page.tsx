'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMyShopStore } from '@/stores/useMyShopStore';
import { useProductEditing } from '@/hooks/useProductEditing';
import { ProductEditForm } from '@/components/shop/ProductEditForm';
import { EditProgressIndicator } from '@/components/shop/EditProgressIndicator';
import { ShopProduct } from '@/services/business/ShopBusinessService';
import { ProductEventData } from '@/services/nostr/NostrEventService';
import { logger } from '@/services/core/LoggingService';

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const { isAuthenticated, user } = useAuthStore();
  const { myProducts } = useMyShopStore();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [isClient, setIsClient] = useState(false);

  const { 
    isUpdating, 
    updateProgress, 
    updateProductData 
  } = useProductEditing();

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Find the product to edit
  useEffect(() => {
    if (productId && myProducts.length > 0) {
      const foundProduct = myProducts.find(p => p.id === productId);
      if (foundProduct) {
        setProduct(foundProduct);
        logger.info('Product found for editing', {
          service: 'ProductEditPage',
          method: 'useEffect',
          productId,
          title: foundProduct.title,
        });
      } else {
        logger.warn('Product not found for editing', {
          service: 'ProductEditPage',
          method: 'useEffect',
          productId,
          availableProducts: myProducts.length,
        });
      }
    }
  }, [productId, myProducts]);

  // Redirect if not authenticated
  if (isClient && (!isAuthenticated || !user)) {
    logger.warn('User not authenticated, redirecting to signin', {
      service: 'ProductEditPage',
      method: 'render',
      isAuthenticated,
      hasUser: !!user,
    });
    router.push('/signin');
    return null;
  }

  // Show loading during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-800 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load the product.</p>
        </div>
      </div>
    );
  }

  // Show error if product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Product Not Found</h3>
                <p className="text-red-600 mt-1">The product you&apos;re trying to edit could not be found.</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/my-shop')}
                className="btn-primary-sm"
              >
                Back to My Shop
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProduct = async (productId: string, updatedData: Partial<ProductEventData>, imageFile: File | null) => {
    logger.info('Saving product updates from edit page', {
      service: 'ProductEditPage',
      method: 'handleSaveProduct',
      productId,
      hasImage: !!imageFile,
    });

    const result = await updateProductData(productId, updatedData, imageFile);
    
    if (result.success) {
      logger.info('Product updated successfully, redirecting to my-shop', {
        service: 'ProductEditPage',
        method: 'handleSaveProduct',
        productId,
      });

      // Redirect back to my-shop after successful save
      router.push('/my-shop');
    }
    
    return result;
  };

  const handleCancel = () => {
    logger.info('Cancelling product edit, returning to my-shop', {
      service: 'ProductEditPage',
      method: 'handleCancel',
      productId,
    });

    router.push('/my-shop');
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-800">Edit Product</h1>
              <p className="text-gray-600 mt-1">{product.title}</p>
            </div>
            <button
              onClick={handleCancel}
              className="btn-outline-sm flex items-center space-x-2"
              disabled={isUpdating}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to My Shop</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        <ProductEditForm
            product={product}
            onSave={handleSaveProduct}
            onCancel={handleCancel}
            isUpdating={isUpdating}
            updateProgress={updateProgress}
            isPage={true} // New prop to indicate this is a page, not modal
          />
      </div>

      {/* Progress Indicator */}
      {updateProgress && (
        <EditProgressIndicator
          progress={updateProgress}
          isVisible={isUpdating}
          onClose={() => {}}
        />
      )}
    </div>
  );
}
