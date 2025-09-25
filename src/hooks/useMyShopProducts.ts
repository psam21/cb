import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useMyShopStore } from '../stores/useMyShopStore';
import { shopBusinessService } from '../services/business/ShopBusinessService';
import { logger } from '../services/core/LoggingService';

export const useMyShopProducts = (showDeleted: boolean = false) => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    myProducts,
    isLoadingMyProducts,
    myProductsError,
    setMyProducts,
    setLoadingMyProducts,
    setMyProductsError,
  } = useMyShopStore();

  // Get pubkey from authenticated user
  const pubkey = user?.pubkey || null;

  const loadMyProducts = useCallback(async () => {
    if (!pubkey || !isAuthenticated) {
      logger.warn('Cannot load products: No pubkey or user not authenticated', {
        service: 'useMyShopProducts',
        method: 'loadMyProducts',
        hasPubkey: !!pubkey,
        isAuthenticated,
      });
      return;
    }

    logger.info('Loading user products', {
      service: 'useMyShopProducts',
      method: 'loadMyProducts',
      pubkey: pubkey.substring(0, 8) + '...',
    });

    setLoadingMyProducts(true);
    setMyProductsError(null);

    try {
      const result = await shopBusinessService.queryProductsByAuthor(pubkey, (relay, status, count) => {
        logger.info('Relay query progress', {
          service: 'useMyShopProducts',
          method: 'loadMyProducts',
          relay,
          status,
          count,
        });
      });

      if (result.success) {
        // Filter products based on showDeleted parameter and sort by newest first
        const filteredProducts = showDeleted 
          ? result.products // Show all products including deleted
          : result.products.filter(product => !product.isDeleted); // Show only active products
        
        const sortedProducts = filteredProducts.sort((a, b) => b.publishedAt - a.publishedAt);
        setMyProducts(sortedProducts);
        
        logger.info('User products loaded successfully', {
          service: 'useMyShopProducts',
          method: 'loadMyProducts',
          totalProducts: result.products.length,
          activeProducts: result.products.filter(p => !p.isDeleted).length,
          deletedProducts: result.products.filter(p => p.isDeleted).length,
          showingDeleted: showDeleted,
          displayedProducts: sortedProducts.length,
        });
      } else {
        const errorMessage = result.error || 'Failed to load products';
        setMyProductsError(errorMessage);
        
        logger.error('Failed to load user products', new Error(errorMessage), {
          service: 'useMyShopProducts',
          method: 'loadMyProducts',
          error: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMyProductsError(errorMessage);
      
      logger.error('Error loading user products', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useMyShopProducts',
        method: 'loadMyProducts',
        error: errorMessage,
      });
    } finally {
      setLoadingMyProducts(false);
    }
  }, [pubkey, isAuthenticated, showDeleted, setMyProducts, setLoadingMyProducts, setMyProductsError]);

  // Load products when pubkey becomes available
  useEffect(() => {
    if (pubkey && isAuthenticated) {
      loadMyProducts();
    }
  }, [pubkey, isAuthenticated, loadMyProducts]);

  return {
    products: myProducts,
    isLoading: isLoadingMyProducts,
    error: myProductsError,
    refreshProducts: loadMyProducts,
  };
};
