import { useState, useCallback } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { updateHeritageWithAttachments } from '@/services/business/HeritageContentService';
import type { HeritageContributionData } from '@/types/heritage';
import { logger } from '@/services/core/LoggingService';

/**
 * Heritage editing progress state
 */
export interface HeritageEditingProgress {
  step: 'idle' | 'validating' | 'uploading' | 'publishing' | 'complete' | 'error';
  progress: number;
  message: string;
  details?: string;
}

/**
 * Hook for editing heritage contributions
 * Follows the same pattern as useProductEditing for Shop
 * 
 * Handles:
 * - State management for update process
 * - Calling HeritageContentService.updateHeritageWithAttachments()
 * - Progress tracking
 * - Error handling
 */
export function useHeritageEditing() {
  const { signer, isAvailable } = useNostrSigner();
  const { user } = useAuthStore();
  const [isUpdating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<HeritageEditingProgress | null>(null);

  const updateContributionData = useCallback(async (
    contributionId: string,
    updatedData: Partial<HeritageContributionData>,
    attachmentFiles: File[],
    selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
  ): Promise<{ success: boolean; error?: string; eventId?: string }> => {
    if (!signer || !isAvailable) {
      const error = 'Nostr signer not available';
      logger.error('Cannot update contribution: No signer', new Error(error), {
        service: 'useHeritageEditing',
        method: 'updateContributionData',
        contributionId,
      });
      return { success: false, error };
    }

    if (!user?.pubkey) {
      const error = 'User pubkey not available';
      logger.error('Cannot update contribution: No pubkey', new Error(error), {
        service: 'useHeritageEditing',
        method: 'updateContributionData',
        contributionId,
      });
      return { success: false, error };
    }

    logger.info('Starting contribution update', {
      service: 'useHeritageEditing',
      method: 'updateContributionData',
      contributionId,
      title: updatedData.title,
      newAttachmentCount: attachmentFiles.length,
      hasSelectiveOps: !!selectiveOps,
    });

    setUpdating(true);
    setUpdateError(null);
    setUpdateProgress({
      step: 'validating',
      progress: 0,
      message: 'Starting update...',
    });

    try {
      const result = await updateHeritageWithAttachments(
        contributionId,
        updatedData,
        attachmentFiles,
        signer,
        selectiveOps
      );

      if (result.success && result.contribution) {
        setUpdateProgress({
          step: 'complete',
          progress: 100,
          message: 'Contribution updated successfully!',
          details: `Published to ${result.publishedRelays?.length || 0} relays`,
        });

        logger.info('Contribution updated successfully', {
          service: 'useHeritageEditing',
          method: 'updateContributionData',
          contributionId,
          newEventId: result.eventId,
          publishedRelays: result.publishedRelays?.length || 0,
        });

        // Keep the success state briefly before clearing
        setTimeout(() => {
          setUpdating(false);
          setUpdateProgress(null);
        }, 2000);

        return { success: true, eventId: result.eventId };
      } else {
        const error = result.error || 'Update failed';
        setUpdateError(error);
        setUpdateProgress({
          step: 'error',
          progress: 0,
          message: error,
        });
        
        logger.error('Contribution update failed', new Error(error), {
          service: 'useHeritageEditing',
          method: 'updateContributionData',
          contributionId,
        });

        setUpdating(false);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during update';
      setUpdateError(errorMessage);
      setUpdateProgress({
        step: 'error',
        progress: 0,
        message: errorMessage,
      });

      logger.error('Contribution update exception', error instanceof Error ? error : new Error(errorMessage), {
        service: 'useHeritageEditing',
        method: 'updateContributionData',
        contributionId,
      });

      setUpdating(false);
      return { success: false, error: errorMessage };
    }
  }, [signer, isAvailable, user]);

  const clearUpdateError = useCallback(() => {
    setUpdateError(null);
    setUpdateProgress(null);
  }, []);

  return {
    isUpdating,
    updateError,
    updateProgress,
    updateContributionData,
    clearUpdateError,
  };
}
