'use client';

import { useCallback, useState } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useNostrSigner } from './useNostrSigner';
import { useConsentDialog } from './useConsentDialog';
import type {
  HeritageContributionData,
  HeritagePublishingResult,
  HeritagePublishingState,
  HeritageNostrEvent,
} from '@/types/heritage';
import { validateHeritageData } from '@/types/heritage';
import { uploadSequentialWithConsent } from '@/services/generic/GenericBlossomService';
import { publishEvent } from '@/services/generic/GenericRelayService';

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
   */
  const publishHeritage = useCallback(async (
    data: HeritageContributionData
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
      const uploadedMediaUrls: { type: 'image' | 'video' | 'audio'; url: string; hash: string; name: string }[] = [];

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
          const userAccepted = await consentDialog.showConsentDialog(filesToUpload);
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

      // Step 5: Create Nostr event
      setProgress({
        step: 'creating',
        progress: 70,
        message: 'Creating Nostr event...',
        details: 'Preparing heritage contribution event',
      });

      // Get user's public key
      const pubkey = await signer.getPublicKey();

      // Generate unique d tag
      const dTag = `heritage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Build event tags
      const tags: string[][] = [
        ['d', dTag],
        ['content-type', 'heritage'],
        ['t', 'culture-bridge-heritage-contribution'], // System tag
        ['title', data.title],
        ['category', data.category],
        ['heritage-type', data.heritageType],
        ['time-period', data.timePeriod],
        ['source-type', data.sourceType],
        ['region', data.region],
        ['country', data.country],
        ['contributor-role', data.contributorRole],
      ];

      // Add optional fields
      if (data.language) {
        tags.push(['language', data.language]);
      }
      if (data.community) {
        tags.push(['community', data.community]);
      }
      if (data.knowledgeKeeperContact) {
        tags.push(['knowledge-keeper', data.knowledgeKeeperContact]);
      }

      // Add user tags
      data.tags.forEach(tag => {
        if (tag.trim()) {
          tags.push(['t', tag.trim()]);
        }
      });

      // Add media URLs with hash
      uploadedMediaUrls.forEach(media => {
        tags.push([media.type, media.url]);
        if (media.hash) {
          tags.push(['imeta', `url ${media.url}`, `x ${media.hash}`]);
        }
      });

      // Create markdown content for NIP-23 format
      let markdownContent = `# ${data.title}\n\n${data.description}`;
      
      // Add embedded media to markdown content
      if (uploadedMediaUrls.length > 0) {
        markdownContent += '\n\n## Media\n\n';
        
        for (const media of uploadedMediaUrls) {
          if (media.type === 'image') {
            markdownContent += `![${media.name}](${media.url})\n\n`;
          } else if (media.type === 'video') {
            markdownContent += `[📹 ${media.name}](${media.url})\n\n`;
          } else if (media.type === 'audio') {
            markdownContent += `[🎵 ${media.name}](${media.url})\n\n`;
          }
        }
      }

      // Create event (without id and sig - signer will add these)
      const unsignedEvent = {
        kind: 30023,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: markdownContent,
        pubkey: pubkey,
      };

      // Sign event
      const signedEvent = await signer.signEvent(unsignedEvent);

      // Step 6: Publish to relays
      setProgress({
        step: 'publishing',
        progress: 85,
        message: 'Publishing to Nostr relays...',
        details: 'Broadcasting event',
      });

      // Publish event to Nostr relays
      const publishResult = await publishEvent(
        signedEvent,
        signer,
        (relayProgress) => {
          setProgress({
            step: 'publishing',
            progress: 85 + (relayProgress.progress * 0.15), // 85% to 100%
            message: relayProgress.message,
            details: relayProgress.currentRelay || 'Broadcasting to network',
          });
        }
      );

      // Check if publishing succeeded
      if (!publishResult.success || publishResult.publishedRelays.length === 0) {
        setState(prev => ({
          ...prev,
          isPublishing: false,
          error: publishResult.error || 'Failed to publish to any relay',
        }));
        return {
          success: false,
          error: publishResult.error || 'Failed to publish to any relay',
        };
      }

      setProgress({
        step: 'complete',
        progress: 100,
        message: 'Heritage contribution published!',
        details: `Successfully published to ${publishResult.publishedRelays.length} relays`,
      });

      const result: HeritagePublishingResult = {
        success: true,
        eventId: signedEvent.id,
        event: signedEvent as HeritageNostrEvent, // Type assertion - we created Kind 30023
        publishedToRelays: publishResult.publishedRelays,
      };

      setState(prev => ({
        ...prev,
        isPublishing: false,
        currentStep: 'complete',
        result,
      }));

      logger.info('Heritage contribution published successfully', {
        service: 'useHeritagePublishing',
        eventId: signedEvent.id,
        publishedRelays: publishResult.publishedRelays.length,
        failedRelays: publishResult.failedRelays.length,
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
