'use client';

import { useCallback, useState } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useNostrSigner } from './useNostrSigner';
import { useConsentDialog } from './useConsentDialog';
import type {
  HeritageContributionData,
  HeritagePublishingResult,
  HeritagePublishingState,
} from '@/types/heritage';
import { 
  createHeritageContribution, 
  type HeritagePublishingProgress 
} from '@/services/business/HeritageContentService';

/**
 * Hook for publishing heritage contributions to Nostr
 * Delegates to HeritageContentService for all business logic
 */
export const useHeritagePublishing = () => {
  const { isAvailable, getSigner } = useNostrSigner();
  const consentDialog = useConsentDialog();

  const [state, setState] = useState<HeritagePublishingState>({
    isPublishing: false,
    uploadProgress: 0,
    currentStep: 'idle',
    error: null,
    result: null,
  });

  const setProgress = useCallback((progress: HeritagePublishingProgress) => {
    setState(prev => ({
      ...prev,
      currentStep: progress.step,
      uploadProgress: progress.progress,
    }));

    logger.debug('Heritage publishing progress', {
      service: 'useHeritagePublishing',
      step: progress.step,
      progress: progress.progress,
      message: progress.message,
    });
  }, []);

  /**
   * Publish heritage contribution to Nostr
   * @param data - Heritage contribution data
   * @param attachmentFiles - File objects to upload
   * @param existingDTag - Optional dTag for updating existing contributions
   */
  const publishHeritage = useCallback(async (
    data: HeritageContributionData,
    attachmentFiles: File[],
    existingDTag?: string
  ): Promise<HeritagePublishingResult> => {
    try {
      logger.info('Starting heritage contribution publishing', {
        service: 'useHeritagePublishing',
        method: 'publishHeritage',
        title: data.title,
        heritageType: data.heritageType,
        attachmentCount: attachmentFiles.length,
      });

      // Reset state
      setState({
        isPublishing: true,
        uploadProgress: 0,
        currentStep: 'validating',
        error: null,
        result: null,
      });

      // Check Nostr signer
      if (!isAvailable) {
        const errorMsg = 'Nostr signer not available. Please install a Nostr extension.';
        logger.error(errorMsg, new Error(errorMsg), {
          service: 'useHeritagePublishing',
        });

        setState(prev => ({
          ...prev,
          isPublishing: false,
          currentStep: 'error',
          error: errorMsg,
        }));

        return {
          success: false,
          error: errorMsg,
        };
      }

      const signer = await getSigner();
      if (!signer) {
        const errorMsg = 'Failed to get Nostr signer';
        logger.error(errorMsg, new Error(errorMsg), {
          service: 'useHeritagePublishing',
        });

        setState(prev => ({
          ...prev,
          isPublishing: false,
          currentStep: 'error',
          error: errorMsg,
        }));

        return {
          success: false,
          error: errorMsg,
        };
      }

      // Show consent dialog if there are files to upload
      if (attachmentFiles.length > 0) {
        logger.info('Showing consent dialog for file uploads', {
          service: 'useHeritagePublishing',
          fileCount: attachmentFiles.length,
        });
        
        const userAccepted = await consentDialog.showConsentDialog(attachmentFiles);
        
        if (!userAccepted) {
          logger.info('User cancelled heritage upload during consent phase', {
            service: 'useHeritagePublishing',
            attachmentCount: attachmentFiles.length,
          });

          setState(prev => ({
            ...prev,
            isPublishing: false,
            currentStep: 'idle',
          }));

          return {
            success: false,
            error: 'User cancelled upload',
          };
        }
      }

      // Delegate to business service
      const serviceResult = await createHeritageContribution(
        data,
        attachmentFiles,
        signer,
        existingDTag,
        setProgress
      );

      if (!serviceResult.success) {
        setState(prev => ({
          ...prev,
          isPublishing: false,
          currentStep: 'error',
          error: serviceResult.error || 'Failed to create heritage contribution',
        }));
        return {
          success: false,
          error: serviceResult.error || 'Failed to create heritage contribution',
        };
      }

      const result: HeritagePublishingResult = {
        success: true,
        eventId: serviceResult.eventId!,
        dTag: serviceResult.contribution?.dTag,
        event: undefined,
        publishedToRelays: serviceResult.publishedRelays || [],
      };

      setState(prev => ({
        ...prev,
        isPublishing: false,
        currentStep: 'complete',
        result,
      }));

      logger.info('Heritage contribution published successfully', {
        service: 'useHeritagePublishing',
        eventId: serviceResult.eventId,
        publishedRelays: serviceResult.publishedRelays?.length || 0,
        failedRelays: serviceResult.failedRelays?.length || 0,
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Heritage publishing failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useHeritagePublishing',
        error: errorMessage,
      });

      setState(prev => ({
        ...prev,
        isPublishing: false,
        currentStep: 'error',
        error: errorMessage,
      }));

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [isAvailable, getSigner, consentDialog, setProgress]);

  /**
   * Reset publishing state
   */
  const resetPublishing = useCallback(() => {
    logger.info('Resetting heritage publishing state', {
      service: 'useHeritagePublishing',
    });

    setState({
      isPublishing: false,
      uploadProgress: 0,
      currentStep: 'idle',
      error: null,
      result: null,
    });
  }, []);

  return {
    // State
    isPublishing: state.isPublishing,
    uploadProgress: state.uploadProgress,
    currentStep: state.currentStep,
    error: state.error,
    result: state.result,

    // Actions
    publishHeritage,
    resetPublishing,

    // Utilities
    isSignerAvailable: isAvailable,
    consentDialog,
  };
};

