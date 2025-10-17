'use client';

import { useCallback, useState, useMemo } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useNostrSigner } from './useNostrSigner';
import { useConsentDialog } from './useConsentDialog';
import { useContentPublishing } from './useContentPublishing';
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

  // State setters for the generic publishing hook
  const stateSetters = useMemo(() => ({
    setPublishing: (isPublishing: boolean) => {
      setState(prev => ({ ...prev, isPublishing }));
    },
    setProgress: (progress: HeritagePublishingProgress | null) => {
      if (progress) {
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
      }
    },
    setResult: (result: { success: boolean; error?: string; eventId?: string; dTag?: string; publishedRelays?: string[]; failedRelays?: string[] } | null) => {
      if (result) {
        setState(prev => ({
          ...prev,
          result: result.success ? {
            success: true,
            eventId: result.eventId!,
            dTag: result.dTag,
            publishedRelays: result.publishedRelays || [],
            failedRelays: result.failedRelays || [],
          } : null,
          error: result.error || null,
        }));
      }
    },
  }), []);

  // Initialize generic publishing wrapper
  const { publishWithWrapper } = useContentPublishing<
    HeritageContributionData,
    HeritagePublishingResult,
    HeritagePublishingProgress
  >({
    serviceName: 'HeritageContentService',
    methodName: 'createHeritageContribution',
    isAvailable,
    getSigner,
    consentDialog,
    stateSetters,
  });

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
    console.log('[useHeritagePublishing] publishHeritage called', {
      attachmentFilesCount: attachmentFiles.length,
      existingDTag,
    });
    
    // Reset state
    setState({
      isPublishing: true,
      uploadProgress: 0,
      currentStep: 'validating',
      error: null,
      result: null,
    });

    console.log('[useHeritagePublishing] About to call publishWithWrapper');
    
    const result = await publishWithWrapper(
      async (contributionData, files, signer, onProgress) => {
        console.log('[useHeritagePublishing] Inside publishWithWrapper callback', {
          filesCount: files.length,
        });
        
        const serviceResult = await createHeritageContribution(
          contributionData,
          files,
          signer,
          existingDTag,
          onProgress
        );

        console.log('[useHeritagePublishing] createHeritageContribution completed', {
          success: serviceResult.success,
        });
        
        // Map service result to HeritagePublishingResult
        return {
          success: serviceResult.success,
          eventId: serviceResult.eventId,
          dTag: serviceResult.contribution?.dTag,
          event: undefined,
          publishedToRelays: serviceResult.publishedRelays || [],
          publishedRelays: serviceResult.publishedRelays || [],
          failedRelays: serviceResult.failedRelays || [],
          error: serviceResult.error,
        };
      },
      data,
      attachmentFiles
    );

    console.log('[useHeritagePublishing] publishWithWrapper completed', {
      success: result.success,
    });
    
    return result;
  }, [publishWithWrapper, setState]);

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

