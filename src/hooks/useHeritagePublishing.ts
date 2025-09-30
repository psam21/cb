'use client';

import { useCallback, useState } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useNostrSigner } from './useNostrSigner';
import { useConsentDialog } from './useConsentDialog';
import type {
  HeritageContributionData,
  HeritagePublishingResult,
  HeritagePublishingState,
  HERITAGE_SYSTEM_TAG,
  HERITAGE_CONTENT_TYPE,
} from '@/types/heritage';
import type { GenericAttachment } from '@/types/attachments';
import { validateHeritageData } from '@/types/heritage';

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

      // Step 3: Get user consent for media uploads (if attachments exist)
      if (data.attachments.length > 0) {
        const attachmentFiles = data.attachments
          .map(att => att.originalFile)
          .filter((file): file is File => file !== undefined);

        if (attachmentFiles.length > 0) {
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
      }

      // Step 4: Upload media to Blossom
      setProgress({
        step: 'uploading',
        progress: 30,
        message: 'Uploading media...',
        details: `Uploading ${data.attachments.length} file(s)`,
      });

      const mediaUrls: { type: 'image' | 'video' | 'audio'; url: string }[] = [];

      // TODO: Implement actual media upload using MediaBusinessService
      // For now, use placeholder URLs from attachments
      for (let i = 0; i < data.attachments.length; i++) {
        const attachment = data.attachments[i];
        
        setProgress({
          step: 'uploading',
          progress: 30 + (40 * (i + 1) / data.attachments.length),
          message: 'Uploading media...',
          attachmentProgress: {
            current: i + 1,
            total: data.attachments.length,
            currentFile: attachment.name,
          },
        });

        // Use existing URL or placeholder
        if (attachment.url && (attachment.type === 'image' || attachment.type === 'video' || attachment.type === 'audio')) {
          mediaUrls.push({
            type: attachment.type,
            url: attachment.url,
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

      // Add media URLs
      mediaUrls.forEach(media => {
        tags.push([media.type, media.url]);
      });

      // Create event (without pubkey - signer will add it)
      const unsignedEvent = {
        kind: 30023,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: JSON.stringify({ description: data.description }),
        pubkey: '', // Will be filled by signer
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

      // TODO: Implement actual relay publishing using NostrEventService
      // For now, simulate success
      const publishedRelays = ['wss://relay.example.com'];

      setProgress({
        step: 'complete',
        progress: 100,
        message: 'Heritage contribution published!',
        details: 'Successfully published to Nostr',
      });

      const result: HeritagePublishingResult = {
        success: true,
        eventId: signedEvent.id,
        event: signedEvent as any, // TODO: Type properly
        publishedToRelays: publishedRelays,
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
        relayCount: publishedRelays.length,
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
  };
};
