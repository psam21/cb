import { useCallback } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useMyShopStore } from '../stores/useMyShopStore';
import { useAuthStore } from '../stores/useAuthStore';
import { 
  shopBusinessService, 
  ShopProduct, 
  ShopPublishingProgress,
  updateProductWithAttachments,
  CreateProductWithAttachmentsResult
} from '../services/business/ShopBusinessService';
import { ProductEventData } from '../services/nostr/NostrEventService';
import { logger } from '../services/core/LoggingService';

export const useProductEditing = () => {
  const { signer, isAvailable } = useNostrSigner();
  const { user } = useAuthStore();
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
    attachmentFiles: File[]
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

    if (!user?.pubkey) {
      const error = 'User pubkey not available';
      logger.error('Cannot update product: No pubkey', new Error(error), {
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
      attachmentCount: attachmentFiles.length,
    });

    setUpdating(true);
    setUpdateError(null);

    try {
      const result = await shopBusinessService.updateProductWithAttachments(
        productId,
        updatedData,
        attachmentFiles,
        signer,
        user.pubkey, // Pass pubkey to avoid extra signer prompt
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
  }, [signer, isAvailable, user?.pubkey, setUpdating, setUpdateError, setUpdateProgress, updateProduct]);

  const cancelEdit = useCallback(() => {
    logger.info('Cancelling product edit', {
      service: 'useProductEditing',
      method: 'cancelEdit',
      productId: editingProduct?.id,
    });
    
    cancelEditing();
  }, [editingProduct?.id, cancelEditing]);

  const updateProductWithAttachmentsData = useCallback(async (
    productId: string,
    updatedData: Partial<ProductEventData>,
    attachmentFiles: File[]
  ): Promise<{ success: boolean; error?: string; result?: CreateProductWithAttachmentsResult }> => {
    if (!signer || !isAvailable) {
      const error = 'Nostr signer not available';
      setUpdateError(error);
      return { success: false, error };
    }

    if (!user?.pubkey) {
      const error = 'User not authenticated';
      setUpdateError(error);
      return { success: false, error };
    }

    logger.info('Starting product update with multiple attachments', {
      service: 'useProductEditing',
      method: 'updateProductWithAttachmentsData',
      productId,
      attachmentCount: attachmentFiles.length,
    });

    setUpdating(true);
    setUpdateError(null);

    try {
      const result = await updateProductWithAttachments(
        productId,
        updatedData,
        attachmentFiles,
        signer,
        user.pubkey,
        (progress: ShopPublishingProgress) => {
          logger.info('Update with attachments progress', {
            service: 'useProductEditing',
            method: 'updateProductWithAttachmentsData',
            step: progress.step,
            progress: progress.progress,
            message: progress.message,
            attachmentProgress: progress.attachmentProgress,
          });
          
          setUpdateProgress(progress);
        }
      );

      if (result.success && result.product) {
        // Update the product in the store
        updateProduct(productId, result.product);
        
        logger.info('Product updated with attachments successfully', {
          service: 'useProductEditing',
          method: 'updateProductWithAttachmentsData',
          productId,
          newEventId: result.eventId,
          publishedRelays: result.publishedRelays?.length || 0,
          attachmentCount: result.attachmentResults?.successful.length || 0,
        });

        return { success: true, result };
      } else {
        const error = result.error || 'Update with attachments failed';
        setUpdateError(error);
        
        logger.error('Product update with attachments failed', new Error(error), {
          service: 'useProductEditing',
          method: 'updateProductWithAttachmentsData',
          productId,
          error,
        });

        return { success: false, error, result };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUpdateError(errorMessage);
      
      logger.error('Product update with attachments error', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useProductEditing',
        method: 'updateProductWithAttachmentsData',
        productId,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    } finally {
      setUpdating(false);
      setUpdateProgress(null);
    }
  }, [signer, isAvailable, user?.pubkey, setUpdating, setUpdateError, setUpdateProgress, updateProduct]);

  return {
    editingProduct,
    isEditing,
    isUpdating,
    updateProgress,
    updateError,
    startEditing,
    updateProductData,
    updateProductWithAttachmentsData, // NEW: Multiple attachments support
    cancelEdit,
    // Enhanced state management for multi-attachment workflows
    isMultiAttachmentSupported: true,
    maxAttachments: 5, // From MEDIA_CONFIG
    supportedFileTypes: ['image/*', 'video/*', 'audio/*'],
    canEditAttachments: true,
  };
};
