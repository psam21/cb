'use client';

import { useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useNostrSigner } from './useNostrSigner';
import { useShopStore } from '@/stores/useShopStore';
import { 
  shopBusinessService, 
  CreateProductResult,
  updateProductWithAttachments,
  CreateProductWithAttachmentsResult
} from '@/services/business/ShopBusinessService';
import { ProductEventData } from '@/services/nostr/NostrEventService';
import { useConsentDialog } from './useConsentDialog';

export const useShopPublishing = () => {
  const { isAvailable, getSigner } = useNostrSigner();
  const {
    isPublishing,
    publishingProgress,
    lastPublishingResult,
    setPublishing,
    setPublishingProgress,
    setLastPublishingResult,
    addProduct,
  } = useShopStore();
  const consentDialog = useConsentDialog();

  const publishProduct = useCallback(async (
    productData: ProductEventData,
    imageFile: File | null
  ): Promise<CreateProductResult> => {
    try {
      logger.info('Starting product publishing', {
        service: 'useShopPublishing',
        method: 'publishProduct',
        title: productData.title,
        hasImage: !!imageFile,
      });

      setPublishing(true);
      setPublishingProgress({ step: 'uploading', progress: 0, message: 'Initializing...', details: 'Starting product creation...' });
      setLastPublishingResult(null);

      if (!isAvailable) {
        const errorMsg = 'Nostr signer not available. Please install a Nostr extension.';
        logger.error(errorMsg, new Error(errorMsg), { service: 'useShopPublishing', method: 'publishProduct' });
        const errorResult = { success: false, error: errorMsg, publishedRelays: [], failedRelays: [] };
        setLastPublishingResult(errorResult);
        return errorResult;
      }

      const signer = await getSigner();

      const result = await shopBusinessService.createProduct(
        productData,
        imageFile,
        signer,
        (p) => {
          // Convert ShopPublishingProgress to RelayPublishingProgress for store
          setPublishingProgress(p);
          logger.debug('Publishing progress update', {
            service: 'useShopPublishing',
            method: 'publishProduct',
            progress: p.progress,
            message: p.message,
          });
        }
      );

      // Convert ShopPublishingProgress to RelayPublishingProgress for store
      if (result.success && result.product) {
        addProduct(result.product);
      }

      const publishingResult = {
        success: result.success,
        eventId: result.eventId,
        publishedRelays: result.publishedRelays || [],
        failedRelays: result.failedRelays || [],
        error: result.error,
      };

      setLastPublishingResult(publishingResult);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product publishing failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useShopPublishing',
        method: 'publishProduct',
        error: errorMessage,
      });
      const errorResult = { success: false, error: errorMessage, publishedRelays: [], failedRelays: [] };
      setLastPublishingResult(errorResult);
      return errorResult;
    } finally {
      setPublishing(false);
      setPublishingProgress(null);
    }
  }, [isAvailable, getSigner, setPublishing, setPublishingProgress, setLastPublishingResult, addProduct]);

  const resetPublishing = useCallback(() => {
    logger.info('Resetting publishing state', {
      service: 'useShopPublishing',
      method: 'resetPublishing',
    });
    setPublishing(false);
    setPublishingProgress(null);
    setLastPublishingResult(null);
  }, [setPublishing, setPublishingProgress, setLastPublishingResult]);

  const publishProductWithAttachments = useCallback(async (
    productData: ProductEventData,
    attachmentFiles: File[]
  ): Promise<CreateProductWithAttachmentsResult> => {
    if (!isAvailable) {
      const error = 'Nostr signer not available';
      logger.error('Cannot publish product with attachments', new Error(error), {
        service: 'useShopPublishing',
        method: 'publishProductWithAttachments',
        error,
      });
      return {
        success: false,
        error,
        attachmentResults: {
          successful: [],
          failed: attachmentFiles.map(file => ({ file, error })),
          partialSuccess: false
        }
      };
    }

    const signer = await getSigner();
    if (!signer) {
      const error = 'Failed to get Nostr signer';
      logger.error('Cannot publish product with attachments', new Error(error), {
        service: 'useShopPublishing',
        method: 'publishProductWithAttachments',
        error,
      });
      return {
        success: false,
        error,
        attachmentResults: {
          successful: [],
          failed: attachmentFiles.map(file => ({ file, error })),
          partialSuccess: false
        }
      };
    }

    logger.info('Starting product publication with multiple attachments', {
      service: 'useShopPublishing',
      method: 'publishProductWithAttachments',
      attachmentCount: attachmentFiles.length,
      totalSize: attachmentFiles.reduce((sum, f) => sum + f.size, 0),
    });

    setPublishing(true);
    setPublishingProgress(null);

    try {
      const result = await shopBusinessService.createProductWithAttachments(
        productData,
        attachmentFiles,
        signer,
        (progress) => {
          logger.info('Publishing with attachments progress', {
            service: 'useShopPublishing',
            method: 'publishProductWithAttachments',
            step: progress.step,
            progress: progress.progress,
            message: progress.message,
            attachmentProgress: progress.attachmentProgress,
          });
          
          setPublishingProgress(progress);
        }
      );

      if (result.success && result.product) {
        addProduct(result.product);
        
        logger.info('Product with attachments published successfully', {
          service: 'useShopPublishing',
          method: 'publishProductWithAttachments',
          eventId: result.eventId,
          publishedRelays: result.publishedRelays?.length || 0,
          attachmentCount: result.attachmentResults?.successful.length || 0,
        });
      } else {
        logger.error('Product with attachments publication failed', new Error(result.error || 'Unknown error'), {
          service: 'useShopPublishing',
          method: 'publishProductWithAttachments',
          error: result.error,
        });
      }

      setLastPublishingResult({
        success: result.success,
        eventId: result.eventId,
        publishedRelays: result.publishedRelays || [],
        failedRelays: result.failedRelays || [],
        error: result.error,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product with attachments publication error', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useShopPublishing',
        method: 'publishProductWithAttachments',
        error: errorMessage,
      });
      const errorResult = { 
        success: false, 
        error: errorMessage, 
        publishedRelays: [], 
        failedRelays: [],
        attachmentResults: {
          successful: [],
          failed: attachmentFiles.map(file => ({ file, error: errorMessage })),
          partialSuccess: false
        }
      };
      setLastPublishingResult(errorResult);
      return errorResult;
    } finally {
      setPublishing(false);
      setPublishingProgress(null);
    }
  }, [isAvailable, getSigner, setPublishing, setPublishingProgress, setLastPublishingResult, addProduct]);

  const updateProductWithAttachmentsData = useCallback(async (
    originalEventId: string,
    updatedData: Partial<ProductEventData>,
    attachmentFiles: File[]
  ): Promise<CreateProductWithAttachmentsResult> => {
    if (!isAvailable) {
      const error = 'Nostr signer not available';
      logger.error('Cannot update product with attachments', new Error(error), {
        service: 'useShopPublishing',
        method: 'updateProductWithAttachmentsData',
        error,
      });
      return {
        success: false,
        error,
        attachmentResults: {
          successful: [],
          failed: attachmentFiles.map(file => ({ file, error })),
          partialSuccess: false
        }
      };
    }

    const signer = await getSigner();
    if (!signer) {
      const error = 'Failed to get Nostr signer';
      logger.error('Cannot update product with attachments', new Error(error), {
        service: 'useShopPublishing',
        method: 'updateProductWithAttachmentsData',
        error,
      });
      return {
        success: false,
        error,
        attachmentResults: {
          successful: [],
          failed: attachmentFiles.map(file => ({ file, error })),
          partialSuccess: false
        }
      };
    }

    logger.info('Starting product update with multiple attachments', {
      service: 'useShopPublishing',
      method: 'updateProductWithAttachmentsData',
      originalEventId,
      attachmentCount: attachmentFiles.length,
    });

    setPublishing(true);
    setPublishingProgress(null);

    try {
      const result = await updateProductWithAttachments(
        originalEventId,
        updatedData,
        attachmentFiles,
        signer,
        '', // userPubkey will be handled by the service
        (progress) => {
          logger.info('Update with attachments progress', {
            service: 'useShopPublishing',
            method: 'updateProductWithAttachmentsData',
            step: progress.step,
            progress: progress.progress,
            message: progress.message,
            attachmentProgress: progress.attachmentProgress,
          });
          
          setPublishingProgress(progress);
        }
      );

      if (result.success && result.product) {
        addProduct(result.product);
        
        logger.info('Product with attachments updated successfully', {
          service: 'useShopPublishing',
          method: 'updateProductWithAttachmentsData',
          originalEventId,
          newEventId: result.eventId,
          publishedRelays: result.publishedRelays?.length || 0,
          attachmentCount: result.attachmentResults?.successful.length || 0,
        });
      } else {
        logger.error('Product with attachments update failed', new Error(result.error || 'Unknown error'), {
          service: 'useShopPublishing',
          method: 'updateProductWithAttachmentsData',
          error: result.error,
        });
      }

      setLastPublishingResult({
        success: result.success,
        eventId: result.eventId,
        publishedRelays: result.publishedRelays || [],
        failedRelays: result.failedRelays || [],
        error: result.error,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product with attachments update error', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useShopPublishing',
        method: 'updateProductWithAttachmentsData',
        error: errorMessage,
      });
      const errorResult = { 
        success: false, 
        error: errorMessage, 
        publishedRelays: [], 
        failedRelays: [],
        attachmentResults: {
          successful: [],
          failed: attachmentFiles.map(file => ({ file, error: errorMessage })),
          partialSuccess: false
        }
      };
      setLastPublishingResult(errorResult);
      return errorResult;
    } finally {
      setPublishing(false);
      setPublishingProgress(null);
    }
  }, [isAvailable, getSigner, setPublishing, setPublishingProgress, setLastPublishingResult, addProduct]);

  return {
    publishProduct,
    publishProductWithAttachments, // NEW: Multiple attachments support
    updateProductWithAttachmentsData, // NEW: Update with attachments support
    isPublishing,
    progress: publishingProgress,
    lastResult: lastPublishingResult,
    canPublish: isAvailable && !isPublishing,
    resetPublishing,
    // Enhanced state management for multi-attachment workflows
    isMultiAttachmentSupported: true,
    maxAttachments: 5, // From MEDIA_CONFIG
    supportedFileTypes: ['image/*', 'video/*', 'audio/*'],
    // Consent dialog for file uploads
    consentDialog,
  };
};