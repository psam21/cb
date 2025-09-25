import { useCallback } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useMyShopStore } from '../stores/useMyShopStore';
import { shopBusinessService, ShopProduct, ShopPublishingProgress } from '../services/business/ShopBusinessService';
import { ProductEventData } from '../services/nostr/NostrEventService';
import { logger } from '../services/core/LoggingService';

export const useProductEditing = () => {
  const { signer, isAvailable } = useNostrSigner();
  const {
    editingProduct,
    isEditing,
    isUpdating,
    updateProgress,
    updateError,
    setUpdating,
    setUpdateProgress,
    setUpdateError,
    updateProduct,
    cancelEditing,
  } = useMyShopStore();

  const startEditing = useCallback((product: ShopProduct) => {
    logger.info('Starting product edit', {
      service: 'useProductEditing',
      method: 'startEditing',
      productId: product.id,
      title: product.title,
    });
    
    useMyShopStore.getState().startEditing(product);
  }, []);

  const updateProductData = useCallback(async (
    productId: string,
    updatedData: Partial<ProductEventData>,
    imageFile: File | null
  ): Promise<{ success: boolean; error?: string }> => {
    if (!signer || !isAvailable) {
      const error = 'Nostr signer not available';
      logger.error('Cannot update product: No signer', new Error(error), {
        service: 'useProductEditing',
        method: 'updateProductData',
        productId,
      });
      return { success: false, error };
    }

    logger.info('Starting product update', {
      service: 'useProductEditing',
      method: 'updateProductData',
      productId,
      title: updatedData.title,
      hasImage: !!imageFile,
    });

    setUpdating(true);
    setUpdateError(null);

    try {
      const result = await shopBusinessService.updateProduct(
        productId,
        updatedData,
        imageFile,
        signer,
        (progress: ShopPublishingProgress) => {
          logger.info('Update progress', {
            service: 'useProductEditing',
            method: 'updateProductData',
            step: progress.step,
            progress: progress.progress,
            message: progress.message,
          });
          
          setUpdateProgress(progress);
        }
      );

      if (result.success && result.product) {
        // Update the product in the store
        updateProduct(productId, result.product);
        
        logger.info('Product updated successfully', {
          service: 'useProductEditing',
          method: 'updateProductData',
          productId,
          newEventId: result.eventId,
          publishedRelays: result.publishedRelays?.length || 0,
        });

        return { success: true };
      } else {
        const error = result.error || 'Update failed';
        setUpdateError(error);
        
        logger.error('Product update failed', new Error(error), {
          service: 'useProductEditing',
          method: 'updateProductData',
          productId,
          error,
        });

        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUpdateError(errorMessage);
      
      logger.error('Product update error', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useProductEditing',
        method: 'updateProductData',
        productId,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    } finally {
      setUpdating(false);
      setUpdateProgress(null);
    }
  }, [signer, isAvailable, setUpdating, setUpdateError, setUpdateProgress, updateProduct]);

  const cancelEdit = useCallback(() => {
    logger.info('Cancelling product edit', {
      service: 'useProductEditing',
      method: 'cancelEdit',
      productId: editingProduct?.id,
    });
    
    cancelEditing();
  }, [editingProduct?.id, cancelEditing]);

  return {
    editingProduct,
    isEditing,
    isUpdating,
    updateProgress,
    updateError,
    startEditing,
    updateProductData,
    cancelEdit,
  };
};
