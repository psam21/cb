'use client';

import { useState } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useShopProducts } from '@/hooks/useShopProducts';
import { ProductCreationForm } from '@/components/shop/ProductCreationForm';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopProduct } from '@/services/business/ShopBusinessService';

export default function ShopPage() {
  const { products, isLoading, error, refreshProducts } = useShopProducts();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleProductCreated = (productId: string) => {
    logger.info('Product created successfully', {
      service: 'ShopPage',
      method: 'handleProductCreated',
      productId,
    });
    
    setShowCreateForm(false);
    
    // Refresh the products list to show the new product
    refreshProducts();
  };

  const handleContact = (product: ShopProduct) => {
    logger.info('Contact seller clicked', {
      service: 'ShopPage',
      method: 'handleContact',
      productId: product.id,
      title: product.title,
    });
    
    // In a real implementation, this would open a contact modal or redirect
    // For now, we'll just show the contact information
    alert(`Contact information for "${product.title}":\n\n${product.contact}`);
  };

  const handleCreateProduct = () => {
    logger.info('Create product button clicked', {
      service: 'ShopPage',
      method: 'handleCreateProduct',
    });
    setShowCreateForm(true);
  };

  const handleCancelCreate = () => {
    logger.info('Create product cancelled', {
      service: 'ShopPage',
      method: 'handleCancelCreate',
    });
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <ProductCreationForm
            onProductCreated={handleProductCreated}
            onCancel={handleCancelCreate}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nostr Shop</h1>
              <p className="text-gray-600 mt-2">
                Buy and sell products using decentralized Nostr technology
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <button
                onClick={handleCreateProduct}
                className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Create Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
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
          <ProductGrid
            products={products}
            onContact={handleContact}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">
              Be the first to create a product in the Nostr shop!
            </p>
            <button
              onClick={handleCreateProduct}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Create First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
