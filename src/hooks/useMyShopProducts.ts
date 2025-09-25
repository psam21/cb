import { useEffect, useCallback, useState } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useMyShopStore } from '../stores/useMyShopStore';
import { shopBusinessService } from '../services/business/ShopBusinessService';
import { logger } from '../services/core/LoggingService';

export const useMyShopProducts = () => {
  const { signer, isAvailable } = useNostrSigner();
  const [pubkey, setPubkey] = useState<string | null>(null);
  const {
    myProducts,
    isLoadingMyProducts,
    myProductsError,
    setMyProducts,
    setLoadingMyProducts,
    setMyProductsError,
  } = useMyShopStore();

  // Get pubkey from signer
  useEffect(() => {
    const getPubkey = async () => {
      if (signer && isAvailable) {
        try {
          const userPubkey = await signer.getPublicKey();
          setPubkey(userPubkey);
          logger.info('Got pubkey from signer', {
            service: 'useMyShopProducts',
            method: 'getPubkey',
            pubkey: userPubkey.substring(0, 8) + '...',
          });
        } catch (error) {
          logger.error('Failed to get pubkey from signer', error instanceof Error ? error : new Error('Unknown error'), {
            service: 'useMyShopProducts',
            method: 'getPubkey',
          });
        }
      }
    };

    getPubkey();
  }, [signer, isAvailable]);

  const loadMyProducts = useCallback(async () => {
    if (!pubkey || !isAvailable) {
      logger.warn('Cannot load products: No pubkey or signer not available', {
        service: 'useMyShopProducts',
        method: 'loadMyProducts',
        hasPubkey: !!pubkey,
        isAvailable,
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
        // Filter out deleted products for display
        const activeProducts = result.products.filter(product => !product.isDeleted);
        setMyProducts(activeProducts);
        
        logger.info('User products loaded successfully', {
          service: 'useMyShopProducts',
          method: 'loadMyProducts',
          totalProducts: result.products.length,
          activeProducts: activeProducts.length,
          deletedProducts: result.products.length - activeProducts.length,
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
  }, [pubkey, isAvailable, setMyProducts, setLoadingMyProducts, setMyProductsError]);

  // Load products when pubkey becomes available
  useEffect(() => {
    if (pubkey && isAvailable) {
      loadMyProducts();
    }
  }, [pubkey, isAvailable, loadMyProducts]);

  return {
    products: myProducts,
    isLoading: isLoadingMyProducts,
    error: myProductsError,
    refreshProducts: loadMyProducts,
  };
};
