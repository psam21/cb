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
import { validateHeritageData } from '@/types/heritage';
import { uploadSequentialWithConsent } from '@/services/generic/GenericBlossomService';
import { createHeritageContribution } from '@/services/business/HeritageContentService';

/**
 * Publishing progress details
 */
export interface HeritagePublishingProgress {
  step: 'validating' | 'uploading' | 'creating' | 'publishing' | 'complete';
  progress: number; // 0-100
  message: string;
  details?: string;
  attachmentProgress?: {
    current: number;
    total: number;
    currentFile?: string;
  };
}

/**
 * Hook for publishing heritage contributions to Nostr
 * Based on useShopPublishing pattern
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
   * @param existingDTag - Optional dTag for updating existing contributions
   */
  const publishHeritage = useCallback(async (
    data: HeritageContributionData,
    existingDTag?: string
  ): Promise<HeritagePublishingResult> => {
    try {
      logger.info('Starting heritage contribution publishing', {
        service: 'useHeritagePublishing',
        method: 'publishHeritage',
        title: data.title,
        heritageType: data.heritageType,
        attachmentCount: data.attachments.length,
      });

      // Reset state
      setState({
        isPublishing: true,
        uploadProgress: 0,
        currentStep: 'validating',
        error: null,
        result: null,
      });

      // Step 1: Validate form data
      setProgress({
        step: 'validating',
        progress: 10,
        message: 'Validating contribution...',
        details: 'Checking required fields',
      });

      const validation = validateHeritageData(data);
      if (!validation.valid) {
        const errorMsg = Object.values(validation.errors).join(', ');
        logger.error('Heritage validation failed', new Error(errorMsg), {
          service: 'useHeritagePublishing',
          errors: validation.errors,
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

      // Step 2: Check Nostr signer
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

      // Step 3: Upload media to Blossom (if attachments exist)
      const uploadedMediaUrls: { 
        type: 'image' | 'video' | 'audio'; 
        url: string; 
        hash: string; 
        name: string;
        id: string;
        size: number;
        mimeType: string;
      }[] = [];

      if (data.attachments.length > 0) {
        // Convert GenericAttachment to File objects
        const filesToUpload: File[] = [];
        for (const attachment of data.attachments) {
          if (attachment.originalFile) {
            filesToUpload.push(attachment.originalFile);
          }
        }

        if (filesToUpload.length > 0) {
          // Show consent dialog BEFORE upload
          console.log('[useHeritagePublishing] About to show consent dialog', {
            fileCount: filesToUpload.length,
            consentDialog: !!consentDialog,
            showConsentDialog: !!consentDialog.showConsentDialog
          });
          
          const userAccepted = await consentDialog.showConsentDialog(filesToUpload);
          
          console.log('[useHeritagePublishing] Consent dialog result:', userAccepted);
          
          if (!userAccepted) {
            logger.info('User cancelled heritage upload during consent phase', {
              service: 'useHeritagePublishing',
              attachmentCount: filesToUpload.length,
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

          // User accepted - now proceed with upload
          setProgress({
            step: 'uploading',
            progress: 30,
            message: 'Starting media upload...',
            details: `Uploading ${filesToUpload.length} file(s)`,
          });

          // Upload files using Blossom service
          const uploadResult = await uploadSequentialWithConsent(
            filesToUpload,
            signer,
            (uploadProgress) => {
              // Map upload progress to heritage publishing progress
              const progressPercent = 30 + (40 * uploadProgress.overallProgress);
              setProgress({
                step: 'uploading',
                progress: progressPercent,
                message: uploadProgress.nextAction,
                details: `File ${uploadProgress.currentFileIndex + 1} of ${uploadProgress.totalFiles}`,
                attachmentProgress: {
                  current: uploadProgress.currentFileIndex + 1,
                  total: uploadProgress.totalFiles,
                  currentFile: uploadProgress.currentFile.name,
                },
              });
            }
          );

          // Check for user cancellation (shouldn't happen since we already got consent, but check anyway)
          if (uploadResult.userCancelled) {
            setState(prev => ({
              ...prev,
              isPublishing: false,
              error: 'User cancelled upload',
            }));
            return {
              success: false,
              error: 'User cancelled upload',
            };
          }

          // Check for upload failures
          if (uploadResult.successCount === 0) {
            setState(prev => ({
              ...prev,
              isPublishing: false,
              error: 'All media uploads failed',
            }));
            return {
              success: false,
              error: 'All media uploads failed',
            };
          }

          // Extract uploaded media URLs and map back to original attachments
          for (let i = 0; i < uploadResult.uploadedFiles.length; i++) {
            const uploadedFile = uploadResult.uploadedFiles[i];
            const originalFile = filesToUpload[i];
            const attachment = data.attachments.find(a => a.originalFile === originalFile);
            
            if (attachment && (attachment.type === 'image' || attachment.type === 'video' || attachment.type === 'audio')) {
              uploadedMediaUrls.push({
                type: attachment.type,
                url: uploadedFile.url,
                hash: uploadedFile.hash,
                name: attachment.name,
                id: attachment.id,
                size: attachment.size,
                mimeType: attachment.mimeType,
              });
            }
          }

          logger.info('Media uploaded successfully', {
            service: 'useHeritagePublishing',
            uploadedCount: uploadResult.successCount,
            failedCount: uploadResult.failureCount,
          });
        }
      }

      // Step 5: Create and publish heritage contribution via service
      setProgress({
        step: 'creating',
        progress: 70,
        message: 'Creating and publishing heritage contribution...',
        details: 'Using proper service layers',
      });

      // Map uploaded media to GenericAttachment format expected by service
      const attachments = uploadedMediaUrls.map(media => ({
        id: media.id,
        url: media.url,
        type: media.type,
        hash: media.hash,
        name: media.name,
        size: media.size,
        mimeType: media.mimeType,
      }));

      // Create heritage contribution data with uploaded attachments
      const heritageData: HeritageContributionData = {
        ...data,
        attachments,
      };

      // Use existing dTag for updates, or undefined for new creation (service generates)
      logger.info(existingDTag ? 'Updating existing heritage contribution' : 'Creating new heritage contribution', {
        service: 'useHeritagePublishing',
        dTag: existingDTag,
        isUpdate: !!existingDTag,
      });

      // Call business service to handle event creation and publishing
      const serviceResult = await createHeritageContribution(
        heritageData,
        signer,
        existingDTag
      );

      if (!serviceResult.success) {
        setState(prev => ({
          ...prev,
          isPublishing: false,
          error: serviceResult.error || 'Failed to create heritage contribution',
        }));
        return {
          success: false,
          error: serviceResult.error || 'Failed to create heritage contribution',
        };
      }

      setProgress({
        step: 'complete',
        progress: 100,
        message: 'Heritage contribution published!',
        details: `Successfully published to ${serviceResult.publishedRelays?.length || 0} relays`,
      });

      const result: HeritagePublishingResult = {
        success: true,
        eventId: serviceResult.eventId!,
        event: undefined, // Event structure handled by service layer
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
