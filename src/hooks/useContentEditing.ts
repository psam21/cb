import { useState, useCallback } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/services/core/LoggingService';
import { NostrSigner } from '@/types/nostr';

/**
 * Generic progress state for content editing
 * Services can extend this with additional fields
 */
export interface ContentEditingProgress {
  step: string;
  progress: number;
  message: string;
  details?: string;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Generic update function signature
 */
export type UpdateFunction<TData, TResult, TProgress = ContentEditingProgress> = (
  contentId: string,
  updatedData: Partial<TData>,
  attachmentFiles: File[],
  signer: NostrSigner,
  pubkey: string,
  onProgress: (progress: TProgress) => void,
  selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
) => Promise<TResult>;

/**
 * Generic update function signature (without pubkey for simpler services)
 */
export type SimpleUpdateFunction<TData, TResult, TProgress = ContentEditingProgress> = (
  contentId: string,
  updatedData: Partial<TData>,
  attachmentFiles: File[],
  signer: NostrSigner,
  onProgress: (progress: TProgress) => void,
  selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
) => Promise<TResult>;

/**
 * Result of update operation
 */
export interface UpdateResult {
  success: boolean;
  error?: string;
  eventId?: string;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Generic content editing hook
 * Extracts common editing pattern from useProductEditing and useHeritageEditing
 * 
 * @param serviceName - Name for logging (e.g., 'useProductEditing')
 * @param updateFn - Service function to call for updates
 * @param requiresPubkey - Whether the update function requires pubkey parameter (default: true)
 */
export function useContentEditing<
  TData = Record<string, unknown>,
  TResult extends UpdateResult = UpdateResult,
  TProgress extends ContentEditingProgress = ContentEditingProgress
>(
  serviceName: string,
  updateFn: UpdateFunction<TData, TResult, TProgress> | SimpleUpdateFunction<TData, TResult, TProgress>,
  requiresPubkey: boolean = true
) {
  const { signer, isAvailable } = useNostrSigner();
  const { user } = useAuthStore();
  const [isUpdating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<TProgress | null>(null);

  const updateContent = useCallback(async (
    contentId: string,
    updatedData: Partial<TData>,
    attachmentFiles: File[],
    selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
  ): Promise<TResult> => {
    // Validation: Signer availability
    if (!signer || !isAvailable) {
      const error = 'Nostr signer not available';
      logger.error('Cannot update content: No signer', new Error(error), {
        service: serviceName,
        method: 'updateContent',
        contentId,
      });
      setUpdateError(error);
      return { success: false, error } as TResult;
    }

    // Validation: User pubkey (if required)
    if (requiresPubkey && !user?.pubkey) {
      const error = 'User pubkey not available';
      logger.error('Cannot update content: No pubkey', new Error(error), {
        service: serviceName,
        method: 'updateContent',
        contentId,
      });
      setUpdateError(error);
      return { success: false, error } as TResult;
    }

    logger.info('Starting content update', {
      service: serviceName,
      method: 'updateContent',
      contentId,
      attachmentCount: attachmentFiles.length,
      hasSelectiveOps: !!selectiveOps,
    });

    setUpdating(true);
    setUpdateError(null);
    setUpdateProgress(null);

    try {
      // Call the update function with appropriate parameters
      const result = requiresPubkey
        ? await (updateFn as UpdateFunction<TData, TResult, TProgress>)(
            contentId,
            updatedData,
            attachmentFiles,
            signer,
            user!.pubkey,
            setUpdateProgress as (progress: TProgress) => void,
            selectiveOps
          )
        : await (updateFn as SimpleUpdateFunction<TData, TResult, TProgress>)(
            contentId,
            updatedData,
            attachmentFiles,
            signer,
            setUpdateProgress as (progress: TProgress) => void,
            selectiveOps
          );

      if (result.success) {
        logger.info('Content updated successfully', {
          service: serviceName,
          method: 'updateContent',
          contentId,
          eventId: result.eventId,
        });

        return result;
      } else {
        const error = result.error || 'Update failed';
        setUpdateError(error);

        logger.error('Content update failed', new Error(error), {
          service: serviceName,
          method: 'updateContent',
          contentId,
        });

        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during update';
      setUpdateError(errorMessage);

      logger.error('Content update exception', error instanceof Error ? error : new Error(errorMessage), {
        service: serviceName,
        method: 'updateContent',
        contentId,
      });

      return { success: false, error: errorMessage } as TResult;
    } finally {
      setUpdating(false);
    }
  }, [signer, isAvailable, user, serviceName, updateFn, requiresPubkey]);

  const clearUpdateError = useCallback(() => {
    setUpdateError(null);
    setUpdateProgress(null);
  }, []);

  return {
    isUpdating,
    updateError,
    updateProgress,
    updateContent,
    clearUpdateError,
  };
}
