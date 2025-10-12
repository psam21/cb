import { useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useNostrSigner } from './useNostrSigner';
import { useConsentDialog } from './useConsentDialog';
import type { NostrSigner } from '@/types/nostr';

/**
 * Generic result interface for publishing operations
 */
export interface PublishResult {
  success: boolean;
  error?: string;
  eventId?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  [key: string]: unknown;
}

/**
 * Generic progress interface for publishing operations
 */
export interface PublishProgress {
  step: string;
  progress: number;
  message: string;
  details?: string;
  [key: string]: unknown;
}

/**
 * State setters interface - allows different state management approaches
 */
export interface PublishStateSetters<TProgress> {
  setPublishing: (isPublishing: boolean) => void;
  setProgress: (progress: TProgress | null) => void;
  setResult?: (result: PublishResult | null) => void;
}

/**
 * Generic publish function signature
 */
export type PublishFunction<TData, TResult extends PublishResult, TProgress extends PublishProgress> = (
  data: TData,
  attachmentFiles: File[],
  signer: NostrSigner,
  onProgress?: (progress: TProgress) => void,
  ...extraParams: unknown[]
) => Promise<TResult>;

/**
 * Options for the generic publishing wrapper
 */
export interface UseContentPublishingOptions<TResult extends PublishResult, TProgress extends PublishProgress> {
  serviceName: string;
  methodName: string;
  isAvailable: boolean;
  getSigner: () => Promise<NostrSigner | null>;
  consentDialog: ReturnType<typeof useConsentDialog>;
  stateSetters: PublishStateSetters<TProgress>;
  onSuccess?: (result: TResult) => void;
}

/**
 * Generic content publishing hook
 * Extracts common publishing pattern: signer validation, consent dialog, state management, error handling, logging
 * 
 * @param options - Configuration options
 * @returns Wrapped publish function
 */
export function useContentPublishing<
  TData,
  TResult extends PublishResult,
  TProgress extends PublishProgress
>(options: UseContentPublishingOptions<TResult, TProgress>) {
  const { serviceName, methodName, stateSetters, onSuccess } = options;
  const { isAvailable, getSigner } = useNostrSigner();
  const consentDialog = useConsentDialog();

  const publishWithWrapper = useCallback(async (
    publishFn: PublishFunction<TData, TResult, TProgress>,
    data: TData,
    attachmentFiles: File[],
    ...extraParams: unknown[]
  ): Promise<TResult> => {
    const { setPublishing, setProgress, setResult } = stateSetters;

    try {
      logger.info(`Starting ${methodName}`, {
        service: serviceName,
        method: methodName,
        attachmentCount: attachmentFiles.length,
      });

      // Step 1: Validate signer availability
      if (!isAvailable) {
        const error = 'Nostr signer not available. Please install a Nostr extension.';
        logger.error(`Cannot ${methodName}: No signer`, new Error(error), {
          service: serviceName,
          method: methodName,
        });

        const errorResult = {
          success: false,
          error,
          publishedRelays: [],
          failedRelays: [],
        } as unknown as TResult;

        setResult?.(errorResult);
        return errorResult;
      }

      // Step 2: Get signer
      const signer = await getSigner();
      if (!signer) {
        const error = 'Failed to get Nostr signer';
        logger.error(`Cannot ${methodName}: Failed to get signer`, new Error(error), {
          service: serviceName,
          method: methodName,
        });

        const errorResult = {
          success: false,
          error,
          publishedRelays: [],
          failedRelays: [],
        } as unknown as TResult;

        setResult?.(errorResult);
        return errorResult;
      }

      // Step 3: Show consent dialog if there are files
      if (attachmentFiles.length > 0) {
        logger.info('Showing consent dialog for file uploads', {
          service: serviceName,
          method: methodName,
          fileCount: attachmentFiles.length,
        });

        const userAccepted = await consentDialog.showConsentDialog(attachmentFiles);

        if (!userAccepted) {
          logger.info('User cancelled upload during consent phase', {
            service: serviceName,
            method: methodName,
            attachmentCount: attachmentFiles.length,
          });

          const cancelResult = {
            success: false,
            error: 'User cancelled upload',
            publishedRelays: [],
            failedRelays: [],
          } as unknown as TResult;

          setResult?.(cancelResult);
          return cancelResult;
        }
      }

      // Step 4: Set publishing state
      setPublishing(true);
      setProgress(null);

      // Step 5: Call the actual publish function with progress tracking
      const result = await publishFn(
        data,
        attachmentFiles,
        signer,
        (progress: TProgress) => {
          logger.debug('Publishing progress', {
            service: serviceName,
            method: methodName,
            step: progress.step,
            progress: progress.progress,
            message: progress.message,
          });
          setProgress(progress);
        },
        ...extraParams
      );

      // Step 6: Handle success/failure
      if (result.success) {
        logger.info(`${methodName} completed successfully`, {
          service: serviceName,
          method: methodName,
          eventId: result.eventId,
          publishedRelays: result.publishedRelays?.length || 0,
          failedRelays: result.failedRelays?.length || 0,
        });

        onSuccess?.(result);
      } else {
        logger.error(`${methodName} failed`, new Error(result.error || 'Unknown error'), {
          service: serviceName,
          method: methodName,
          error: result.error,
        });
      }

      setResult?.(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`${methodName} exception`, error instanceof Error ? error : new Error(errorMessage), {
        service: serviceName,
        method: methodName,
        error: errorMessage,
      });

      const errorResult = {
        success: false,
        error: errorMessage,
        publishedRelays: [],
        failedRelays: [],
      } as unknown as TResult;

      setResult?.(errorResult);
      return errorResult;

    } finally {
      setPublishing(false);
      setProgress(null);
    }
  }, [serviceName, methodName, isAvailable, getSigner, consentDialog, stateSetters, onSuccess]);

  return {
    publishWithWrapper,
    isSignerAvailable: isAvailable,
    consentDialog,
  };
}
