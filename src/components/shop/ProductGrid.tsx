'use client';

import { useState, useMemo } from 'react';
import { logger } from '@/services/core/LoggingService';
import { BaseCard, BaseCardData } from '@/components/ui/BaseCard';
import { ShopProduct } from '@/services/business/ShopBusinessService';

interface ProductGridProps {
  products: ShopProduct[];
  onContact?: (product: ShopProduct) => void;
  onEdit?: (product: ShopProduct) => void;
  onDelete?: (product: ShopProduct) => void;
  variant?: 'shop' | 'my-shop';
}

export const ProductGrid = ({ products, onContact, onEdit, onDelete, variant = 'shop' }: ProductGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high'>('newest');

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    return uniqueCategories.sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.tags.some(tag => tag.toLowerCase().includes(query)) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.publishedAt - a.publishedAt;
        case 'oldest':
          return a.publishedAt - b.publishedAt;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleSearchChange = (query: string) => {
    logger.debug('Search query changed', {
      service: 'ProductGrid',
      method: 'handleSearchChange',
      query: query.substring(0, 50),
    });
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string) => {
    logger.debug('Category filter changed', {
      service: 'ProductGrid',
      method: 'handleCategoryChange',
      category,
    });
    setSelectedCategory(category);
  };

  const handleSortChange = (sort: typeof sortBy) => {
    logger.debug('Sort order changed', {
      service: 'ProductGrid',
      method: 'handleSortChange',
      sort,
    });
    setSortBy(sort);
  };

  const clearFilters = () => {
    logger.debug('Filters cleared', {
      service: 'ProductGrid',
      method: 'clearFilters',
    });
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="lg:w-48">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedCategory || sortBy !== 'newest') && (
            <button
              onClick={clearFilters}
              className="btn-outline-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory && ` in "${selectedCategory}"`}
        </p>
        
        {filteredProducts.length > 0 && (
          <div className="text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            // Convert ShopProduct to BaseCardData
            const cardData: BaseCardData = {
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
            };

            return (
              <BaseCard
                key={product.id}
                data={cardData}
                variant={variant}
                onContact={onContact ? (data) => onContact(product) : undefined}
                onEdit={onEdit ? (data) => onEdit(product) : undefined}
                onDelete={onDelete ? (data) => onDelete(product) : undefined}
              />
            );
          })}
        </div>
      ) : (
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || selectedCategory
              ? 'Try adjusting your search or filters'
              : 'No products have been created yet'
            }
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="btn-primary-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
