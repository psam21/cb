'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { shopBusinessService, ShopProduct } from '@/services/business/ShopBusinessService';

export const useShopProducts = () => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      logger.info('Loading shop products', {
        service: 'useShopProducts',
        method: 'loadProducts',
      });

      setIsLoading(true);
      setError(null);

      const productList = await shopBusinessService.listProducts();
      
      logger.info('Products loaded successfully', {
        service: 'useShopProducts',
        method: 'loadProducts',
        productCount: productList.length,
      });

      setProducts(productList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to load products', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useShopProducts',
        method: 'loadProducts',
        error: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

    setProducts(prev => {
      // Check if product already exists
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        logger.info('Product already exists, updating', {
          service: 'useShopProducts',
          method: 'addProduct',
          productId: product.id,
        });
        return prev.map(p => p.id === product.id ? product : p);
      }
      
      // Add new product to the beginning of the list
      return [product, ...prev];
    });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    logger.info('Removing product from local state', {
      service: 'useShopProducts',
      method: 'removeProduct',
      productId,
    });

    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const getProduct = useCallback((productId: string): ShopProduct | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  const getProductsByCategory = useCallback((category: string): ShopProduct[] => {
    return products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }, [products]);

  const getProductsByTag = useCallback((tag: string): ShopProduct[] => {
    return products.filter(p => p.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
  }, [products]);

  const searchProducts = useCallback((query: string): ShopProduct[] => {
    const lowercaseQuery = query.toLowerCase();
    return products.filter(p => 
      p.title.toLowerCase().includes(lowercaseQuery) ||
      p.description.toLowerCase().includes(lowercaseQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      p.category.toLowerCase().includes(lowercaseQuery)
    );
  }, [products]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    isLoading,
    error,
    loadProducts,
    refreshProducts,
    addProduct,
    removeProduct,
    getProduct,
    getProductsByCategory,
    getProductsByTag,
    searchProducts,
  };
};
