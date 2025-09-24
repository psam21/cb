'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useNostrSigner } from './useNostrSigner';
import { 
  shopBusinessService, 
  CreateProductResult, 
  ShopPublishingProgress 
} from '@/services/business/ShopBusinessService';
import { ProductEventData } from '@/services/nostr/NostrEventService';

export const useShopPublishing = () => {
  const { isAvailable, getSigner } = useNostrSigner();
  const [isPublishing, setIsPublishing] = useState(false);
  const [progress, setProgress] = useState<ShopPublishingProgress | null>(null);
  const [lastResult, setLastResult] = useState<CreateProductResult | null>(null);

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

      if (!isAvailable) {
        const error = 'Nostr signer not available';
        logger.error('Signer not available for publishing', new Error(error), {
          service: 'useShopPublishing',
          method: 'publishProduct',
        });
        return {
          success: false,
          error,
        };
      }

      setIsPublishing(true);
      setProgress({
        step: 'uploading',
        progress: 0,
        message: 'Preparing to publish...',
      });

      const signer = await getSigner();
      
      const result = await shopBusinessService.createProduct(
        productData,
        imageFile,
        signer,
        (progressUpdate) => {
          logger.info('Publishing progress update', {
            service: 'useShopPublishing',
            method: 'publishProduct',
            step: progressUpdate.step,
            progress: progressUpdate.progress,
            message: progressUpdate.message,
          });
          setProgress(progressUpdate);
        }
      );

      setLastResult(result);
      setIsPublishing(false);

      if (result.success) {
        logger.info('Product published successfully', {
          service: 'useShopPublishing',
          method: 'publishProduct',
          productId: result.product?.id,
          eventId: result.eventId,
          publishedRelays: result.publishedRelays?.length,
        });
      } else {
        logger.error('Product publishing failed', new Error(result.error || 'Unknown error'), {
          service: 'useShopPublishing',
          method: 'publishProduct',
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product publishing error', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useShopPublishing',
        method: 'publishProduct',
        error: errorMessage,
      });

      const result: CreateProductResult = {
        success: false,
        error: errorMessage,
      };

      setLastResult(result);
      setIsPublishing(false);
      return result;
    }
  }, [isAvailable, getSigner]);

  const resetPublishing = useCallback(() => {
    logger.info('Resetting publishing state', {
      service: 'useShopPublishing',
      method: 'resetPublishing',
    });
    setIsPublishing(false);
    setProgress(null);
    setLastResult(null);
  }, []);

  return {
    isPublishing,
    progress,
    lastResult,
    publishProduct,
    resetPublishing,
    canPublish: isAvailable,
  };
};
