import { useCallback } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useMyShopStore } from '../stores/useMyShopStore';
import { shopBusinessService, ShopProduct, ShopPublishingProgress } from '../services/business/ShopBusinessService';
import { logger } from '../services/core/LoggingService';

export const useProductDeletion = () => {
  const { signer, isAvailable } = useNostrSigner();
  const {
    deletingProduct,
    showDeleteDialog,
    isDeleting,
    deleteProgress,
    deleteError,
    setDeleting,
    setDeleteProgress,
    setDeleteError,
    removeProduct,
    openDeleteDialog,
    hideDeleteDialog,
  } = useMyShopStore();

  const showDeleteConfirmation = useCallback((product: ShopProduct) => {
    logger.info('Showing delete confirmation', {
      service: 'useProductDeletion',
      method: 'showDeleteConfirmation',
      productId: product.id,
      title: product.title,
    });
    
    openDeleteDialog(product);
  }, [openDeleteDialog]);

  const deleteProductData = useCallback(async (productId: string): Promise<{ success: boolean; error?: string }> => {
    if (!signer || !isAvailable) {
      const error = 'Nostr signer not available';
      logger.error('Cannot delete product: No signer', new Error(error), {
        service: 'useProductDeletion',
        method: 'deleteProductData',
        productId,
      });
      return { success: false, error };
    }

    logger.info('Starting product deletion', {
      service: 'useProductDeletion',
      method: 'deleteProductData',
      productId,
    });

    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await shopBusinessService.deleteProduct(
        productId,
        signer,
        (progress: ShopPublishingProgress) => {
          logger.info('Delete progress', {
            service: 'useProductDeletion',
            method: 'deleteProductData',
            step: progress.step,
            progress: progress.progress,
            message: progress.message,
          });
          
          setDeleteProgress(progress);
        }
      );

      if (result.success) {
        // Remove the product from the store
        removeProduct(productId);
        
        logger.info('Product deleted successfully', {
          service: 'useProductDeletion',
          method: 'deleteProductData',
          productId,
          deletionEventId: result.eventId,
          publishedRelays: result.publishedRelays?.length || 0,
        });

        return { success: true };
      } else {
        const error = result.error || 'Deletion failed';
        setDeleteError(error);
        
        logger.error('Product deletion failed', new Error(error), {
          service: 'useProductDeletion',
          method: 'deleteProductData',
          productId,
          error,
        });

        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDeleteError(errorMessage);
      
      logger.error('Product deletion error', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useProductDeletion',
        method: 'deleteProductData',
        productId,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    } finally {
      setDeleting(false);
      setDeleteProgress(null);
    }
  }, [signer, isAvailable, setDeleting, setDeleteError, setDeleteProgress, removeProduct]);

  const cancelDelete = useCallback(() => {
    logger.info('Cancelling product deletion', {
      service: 'useProductDeletion',
      method: 'cancelDelete',
      productId: deletingProduct?.id,
    });
    
    hideDeleteDialog();
  }, [deletingProduct?.id, hideDeleteDialog]);

  const confirmDelete = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!deletingProduct) {
      return { success: false, error: 'No product selected for deletion' };
    }

    const result = await deleteProductData(deletingProduct.id);
    
    if (result.success) {
      hideDeleteDialog();
    }
    
    return result;
  }, [deletingProduct, deleteProductData, hideDeleteDialog]);

  return {
    deletingProduct,
    showDeleteDialog,
    isDeleting,
    deleteProgress,
    deleteError,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  };
};
