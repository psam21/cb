'use client';

import { useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useNostrSigner } from './useNostrSigner';
import { useShopStore } from '@/stores/useShopStore';
import { 
  shopBusinessService, 
  CreateProductResult
} from '@/services/business/ShopBusinessService';
import { ProductEventData } from '@/services/nostr/NostrEventService';
import { RelayPublishingProgress } from '@/services/generic/GenericRelayService';

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
      setPublishingProgress({ step: 'connecting', progress: 0, message: 'Initializing...', publishedRelays: [], failedRelays: [] });
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
          const relayProgress: RelayPublishingProgress = {
            step: p.step === 'uploading' ? 'connecting' : 
                  p.step === 'creating_event' ? 'connecting' :
                  p.step === 'publishing' ? 'publishing' :
                  p.step === 'complete' ? 'complete' : 'connecting',
            progress: p.progress,
            message: p.message,
            details: p.details,
            publishedRelays: [],
            failedRelays: [],
          };
          setPublishingProgress(relayProgress);
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

  return {
    publishProduct,
    isPublishing,
    progress: publishingProgress,
    lastResult: lastPublishingResult,
    canPublish: isAvailable && !isPublishing,
    resetPublishing,
  };
};