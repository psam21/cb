import { useCallback } from 'react';
import { useMyShopStore } from '../stores/useMyShopStore';
import { 
  shopBusinessService, 
  ShopProduct, 
  CreateProductWithAttachmentsResult,
  ShopPublishingProgress
} from '../services/business/ShopBusinessService';
import { ProductEventData } from '../services/nostr/NostrEventService';
import { logger } from '../services/core/LoggingService';
import { useContentEditing, type UpdateFunction } from './useContentEditing';

export const useProductEditing = () => {
  const {
    editingProduct,
    isEditing,
    updateProduct,
    cancelEditing,
  } = useMyShopStore();

  // Wrap the service function to match UpdateFunction signature
  const updateFn: UpdateFunction<ProductEventData, CreateProductWithAttachmentsResult, ShopPublishingProgress> = async (
    contentId,
    updatedData,
    attachmentFiles,
    signer,
    pubkey,
    onProgress,
    selectiveOps
  ) => {
    return await shopBusinessService.updateProductWithAttachments(
      contentId,
      updatedData,
      attachmentFiles,
      signer,
      pubkey,
      onProgress,
      selectiveOps
    );
  };

  // Use generic editing hook for update logic
  const {
    isUpdating,
    updateError,
    updateProgress,
    updateContent,
    clearUpdateError,
  } = useContentEditing<ProductEventData, CreateProductWithAttachmentsResult, ShopPublishingProgress>(
    'useProductEditing',
    updateFn,
    true // Requires pubkey parameter
  );

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
    attachmentFiles: File[],
    selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
  ): Promise<{ success: boolean; error?: string; result?: CreateProductWithAttachmentsResult }> => {
    const result = await updateContent(productId, updatedData, attachmentFiles, selectiveOps);

    // Update the product in the store if successful
    if (result.success && result.product) {
      updateProduct(productId, result.product);
      
      logger.info('Product updated and stored', {
        service: 'useProductEditing',
        method: 'updateProductData',
        productId,
        eventId: result.eventId,
      });
    }

    return { success: result.success, error: result.error, result };
  }, [updateContent, updateProduct]);

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
    clearUpdateError,
    // Enhanced state management for multi-attachment workflows
    isMultiAttachmentSupported: true,
    maxAttachments: 5, // From MEDIA_CONFIG
    supportedFileTypes: ['image/*', 'video/*', 'audio/*'],
    canEditAttachments: true,
  };
};
