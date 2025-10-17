'use client';

import { useCallback, useEffect } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useShopStore } from '@/stores/useShopStore';
import { shopBusinessService, ShopProduct } from '@/services/business/ShopBusinessService';

export const useShopProducts = () => {
  const {
    isLoadingProducts,
    productsError,
    searchQuery,
    selectedCategory,
    sortBy,
    setProducts,
    setLoadingProducts,
    setProductsError,
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    getFilteredProducts,
    getProductById,
    getProductsByCategory,
    getProductsByTag,
    searchProducts,
    clearFilters,
  } = useShopStore();

  const loadProducts = useCallback(async () => {
    try {
      logger.info('Loading shop products from relays', {
        service: 'useShopProducts',
        method: 'loadProducts',
      });

      setLoadingProducts(true);
      setProductsError(null);

      // Helper function to sort products by newest first
      const sortByNewest = (products: ShopProduct[]) => 
        products.sort((a, b) => b.publishedAt - a.publishedAt);

      // Use enriched query method from service (proper SOA)
      const relayResult = await shopBusinessService.queryEnrichedProductsFromRelays(
        (relay, status, count) => {
          logger.info('Relay query progress', {
            service: 'useShopProducts',
            method: 'loadProducts',
            relay,
            status,
            count,
          });
        },
        false // showDeleted = false for public shop page
      );

      if (relayResult.success) {
        logger.info('Products loaded from relays successfully', {
          service: 'useShopProducts',
          method: 'loadProducts',
          productCount: relayResult.products.length,
          queriedRelays: relayResult.queriedRelays.length,
        });
        setProducts(sortByNewest(relayResult.products));
      } else {
        // Fallback to local store if relay query fails
        logger.warn('Relay query failed, falling back to local store', {
          service: 'useShopProducts',
          method: 'loadProducts',
          error: relayResult.error,
        });
        
        const localProducts = await shopBusinessService.listProducts();
        logger.info('Products loaded from local store', {
          service: 'useShopProducts',
          method: 'loadProducts',
          productCount: localProducts.length,
        });
        
        // Enrich local products with author names (same as relay path)
        const enrichedLocalProducts = await shopBusinessService.enrichProducts(localProducts);
        logger.info('Local products enriched with author names', {
          service: 'useShopProducts',
          method: 'loadProducts',
          enrichedCount: enrichedLocalProducts.filter(p => p.authorDisplayName).length,
        });
        
        setProducts(sortByNewest(enrichedLocalProducts));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to load products', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useShopProducts',
        method: 'loadProducts',
        error: errorMessage,
      });
      setProductsError(errorMessage);
    } finally {
      setLoadingProducts(false);
    }
  }, [setProducts, setLoadingProducts, setProductsError]);

  const refreshProducts = useCallback(() => {
    logger.info('Refreshing products list', {
      service: 'useShopProducts',
      method: 'refreshProducts',
    });
    loadProducts();
  }, [loadProducts]);

  const addProduct = useCallback((product: ShopProduct) => {
    logger.info('Adding product to local state', {
      service: 'useShopProducts',
      method: 'addProduct',
      productId: product.id,
      title: product.title,
    });

    // Get current products from store
    const currentProducts = useShopStore.getState().products;
    
    // Check if product already exists
    const exists = currentProducts.some(p => p.id === product.id);
    if (exists) {
      logger.info('Product already exists, updating', {
        service: 'useShopProducts',
        method: 'addProduct',
        productId: product.id,
      });
      const updatedProducts = currentProducts.map(p => p.id === product.id ? product : p);
      setProducts(updatedProducts);
    } else {
      // Add new product to the beginning of the list
      setProducts([product, ...currentProducts]);
    }
  }, [setProducts]);

  const removeProduct = useCallback((productId: string) => {
    logger.info('Removing product from local state', {
      service: 'useShopProducts',
      method: 'removeProduct',
      productId,
    });

    // Get current products from store
    const currentProducts = useShopStore.getState().products;
    const filteredProducts = currentProducts.filter(p => p.id !== productId);
    setProducts(filteredProducts);
  }, [setProducts]);

  const handleSearchChange = useCallback((query: string) => {
    logger.debug('Search query changed', {
      service: 'useShopProducts',
      method: 'handleSearchChange',
      query: query.substring(0, 50),
    });
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleCategoryChange = useCallback((category: string) => {
    logger.debug('Category filter changed', {
      service: 'useShopProducts',
      method: 'handleCategoryChange',
      category,
    });
    setSelectedCategory(category);
  }, [setSelectedCategory]);

  const handleSortChange = useCallback((sortOption: 'newest' | 'oldest' | 'price-low' | 'price-high') => {
    logger.debug('Sort option changed', {
      service: 'useShopProducts',
      method: 'handleSortChange',
      sortOption,
    });
    setSortBy(sortOption);
  }, [setSortBy]);

  const handleClearFilters = useCallback(() => {
    logger.info('Clearing all filters', { 
      service: 'useShopProducts', 
      method: 'handleClearFilters' 
    });
    clearFilters();
  }, [clearFilters]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products: getFilteredProducts(),
    isLoading: isLoadingProducts,
    error: productsError,
    searchQuery,
    selectedCategory,
    sortBy,
    loadProducts,
    refreshProducts,
    addProduct,
    removeProduct,
    getProduct: getProductById,
    getProductsByCategory,
    getProductsByTag,
    searchProducts,
    handleSearchChange,
    handleCategoryChange,
    handleSortChange,
    clearFilters: handleClearFilters,
  };
};