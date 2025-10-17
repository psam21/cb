'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/services/core/LoggingService';
import { useShopProducts } from '@/hooks/useShopProducts';
import { ProductCreationForm } from '@/components/shop/ProductCreationForm';
import { BaseGrid } from '@/components/ui/BaseGrid';
import { BaseCard } from '@/components/ui/BaseCard';
import { ShopProduct } from '@/services/business/ShopBusinessService';

export default function ShopPage() {
  const { products, isLoading, error, refreshProducts } = useShopProducts();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();

  // No filtering needed - NIP-33 relays return only latest events per dTag
  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

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
    
    // Navigate to messages with context (same as detail page)
    const params = new URLSearchParams({
      recipient: product.author,
      context: `product:${product.id}`,
      contextTitle: product.title || 'Product',
      ...(product.imageUrl && { contextImage: product.imageUrl }),
    });

    router.push(`/messages?${params.toString()}`);
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
      <div className="min-h-screen bg-primary-50 py-8">
        <div className="container-width">
          <ProductCreationForm
            onProductCreated={handleProductCreated}
            onCancel={handleCancelCreate}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-gray-600 text-lg">
                Buy and sell Culture and Heritage products directly interacting with Customers
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <button
                onClick={handleCreateProduct}
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
            data={filteredProducts.map(product => {
              const authorData = {
                pubkey: product.author,
                displayName: product.authorDisplayName,
              };
              return {
                id: product.id,
                title: product.title,
                description: product.description,
                imageUrl: product.imageUrl,
                tags: product.tags,
                publishedAt: product.publishedAt,
                author: authorData,
                price: product.price,
                currency: product.currency,
                category: product.category,
                condition: product.condition,
                location: product.location,
                contact: product.contact,
                eventId: product.eventId,
                publishedRelays: product.publishedRelays,
              };
            })}
            renderItem={(item) => (
              <BaseCard
                data={item}
                variant="shop"
                onContact={(data) => {
                  // Convert BaseCardData back to ShopProduct for the handler
                  const product = filteredProducts.find(p => p.id === data.id);
                  if (product) handleContact(product);
                }}
                onSelect={(data) => {
                  // Use dTag for stable URLs across edits (NIP-33 pattern)
                  const targetId = data.dTag || data.id;
                  if (!targetId) return;
                  router.push(`/shop/${targetId}`);
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
            searchPlaceholder="Search products..."
            gridClassName="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-primary-300 mb-4">
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
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Be the first to create a product in the Nostr shop!
            </p>
            <button
              onClick={handleCreateProduct}
              className="btn-primary-sm"
            >
              Create First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
