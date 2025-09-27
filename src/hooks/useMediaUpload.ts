/**
 * Hook for managing media upload state and operations
 * Provides a clean interface for file upload workflows with progress tracking
 */

import { useState, useCallback, useRef } from 'react';
import { logger } from '../services/core/LoggingService';
import { 
  blossomService,
  type SequentialUploadResult,
  type SequentialUploadProgress,
  type BlossomFileMetadata,
  type BatchUploadConsent
} from '../services/generic/GenericBlossomService';
import { NostrSigner } from '../types/nostr';
import { useConsentDialog } from './useConsentDialog';

export interface MediaUploadState {
  isUploading: boolean;
  progress: SequentialUploadProgress | null;
  result: SequentialUploadResult | null;
  error: string | null;
  uploadedFiles: BlossomFileMetadata[];
  failedFiles: { file: File; error: string }[];
}

export interface UseMediaUploadReturn {
  // State
  uploadState: MediaUploadState;
  
  // Actions
  uploadFiles: (files: File[], signer: NostrSigner) => Promise<SequentialUploadResult>;
  resetUpload: () => void;
  retryFailedFiles: (signer: NostrSigner) => Promise<SequentialUploadResult>;
  
  // Utilities
  canRetry: boolean;
  hasUploadedFiles: boolean;
  hasFailedFiles: boolean;
  isComplete: boolean;
  
  // Consent Dialog
  consentDialog: {
    isOpen: boolean;
    consent: BatchUploadConsent | null;
    acceptConsent: () => void;
    cancelConsent: () => void;
    closeDialog: () => void;
  };
}

const initialState: MediaUploadState = {
  isUploading: false,
  progress: null,
  result: null,
  error: null,
  uploadedFiles: [],
  failedFiles: [],
};

/**
 * Hook for managing media upload operations with Enhanced Sequential Upload
 */
export const useMediaUpload = (): UseMediaUploadReturn => {
  const [uploadState, setUploadState] = useState<MediaUploadState>(initialState);
  const currentFilesRef = useRef<File[]>([]);
  const consentDialog = useConsentDialog();

  /**
   * Upload multiple files using Enhanced Sequential Upload
   */
  const uploadFiles = useCallback(async (
    files: File[], 
    signer: NostrSigner
  ): Promise<SequentialUploadResult> => {
    if (!files.length) {
      logger.warn('No files provided for upload', {
        hook: 'useMediaUpload',
        method: 'uploadFiles'
      });
      return {
        success: false,
        uploadedFiles: [],
        failedFiles: [],
        partialSuccess: false,
        userCancelled: false,
        totalFiles: 0,
        successCount: 0,
        failureCount: 0
      };
    }

    logger.info('Starting media upload', {
      hook: 'useMediaUpload',
      method: 'uploadFiles',
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    // Store files for potential retry
    currentFilesRef.current = files;

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      progress: null,
      result: null,
      error: null,
      uploadedFiles: [],
      failedFiles: []
    }));

    try {
      // Show consent dialog first
      const userAccepted = await consentDialog.showConsentDialog(files);
      if (!userAccepted) {
        logger.info('User cancelled upload during consent phase', {
          hook: 'useMediaUpload',
          method: 'uploadFiles',
          fileCount: files.length
        });

        return {
          success: false,
          uploadedFiles: [],
          failedFiles: [],
          partialSuccess: false,
          userCancelled: true,
          totalFiles: files.length,
          successCount: 0,
          failureCount: 0
        };
      }

      const result = await blossomService.uploadSequentialWithConsent(
        files,
        signer,
        (progress: SequentialUploadProgress) => {
          logger.debug('Upload progress update', {
            hook: 'useMediaUpload',
            method: 'uploadFiles',
            currentFile: progress.currentFileIndex + 1,
            totalFiles: progress.totalFiles,
            overallProgress: progress.overallProgress,
            nextAction: progress.nextAction
          });

          setUploadState(prev => ({
            ...prev,
            progress
          }));
        }
      );

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        result,
        uploadedFiles: result.uploadedFiles,
        failedFiles: result.failedFiles,
        error: result.success ? null : 'Upload failed'
      }));

      logger.info('Media upload completed', {
        hook: 'useMediaUpload',
        method: 'uploadFiles',
        success: result.success,
        successCount: result.successCount,
        failureCount: result.failureCount,
        partialSuccess: result.partialSuccess
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      
      logger.error('Media upload failed', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useMediaUpload',
        method: 'uploadFiles',
        error: errorMessage
      });

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
        result: {
          success: false,
          uploadedFiles: [],
          failedFiles: files.map(file => ({ file, error: errorMessage })),
          partialSuccess: false,
          userCancelled: false,
          totalFiles: files.length,
          successCount: 0,
          failureCount: files.length
        }
      }));

      return {
        success: false,
        uploadedFiles: [],
        failedFiles: files.map(file => ({ file, error: errorMessage })),
        partialSuccess: false,
        userCancelled: false,
        totalFiles: files.length,
        successCount: 0,
        failureCount: files.length
      };
    }
  }, []);

  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    logger.debug('Resetting upload state', {
      hook: 'useMediaUpload',
      method: 'resetUpload'
    });

    setUploadState(initialState);
    currentFilesRef.current = [];
  }, []);

  /**
   * Retry failed files
   */
  const retryFailedFiles = useCallback(async (
    signer: NostrSigner
  ): Promise<SequentialUploadResult> => {
    if (!uploadState.failedFiles.length) {
      logger.warn('No failed files to retry', {
        hook: 'useMediaUpload',
        method: 'retryFailedFiles'
      });
      return {
        success: false,
        uploadedFiles: [],
        failedFiles: [],
        partialSuccess: false,
        userCancelled: false,
        totalFiles: 0,
        successCount: 0,
        failureCount: 0
      };
    }

    logger.info('Retrying failed files', {
      hook: 'useMediaUpload',
      method: 'retryFailedFiles',
      failedFileCount: uploadState.failedFiles.length
    });

    const failedFiles = uploadState.failedFiles.map(f => f.file);
    return await uploadFiles(failedFiles, signer);
  }, [uploadState.failedFiles, uploadFiles]);

  /**
   * Check if retry is possible
   */
  const canRetry = uploadState.failedFiles.length > 0 && !uploadState.isUploading;

  /**
   * Check if there are uploaded files
   */
  const hasUploadedFiles = uploadState.uploadedFiles.length > 0;

  /**
   * Check if there are failed files
   */
  const hasFailedFiles = uploadState.failedFiles.length > 0;

  /**
   * Check if upload is complete (success or failure)
   */
  const isComplete = !uploadState.isUploading && (uploadState.result !== null);

  return {
    uploadState,
    uploadFiles,
    resetUpload,
    retryFailedFiles,
    canRetry,
    hasUploadedFiles,
    hasFailedFiles,
    isComplete,
    consentDialog: {
      isOpen: consentDialog.isOpen,
      consent: consentDialog.consent,
      acceptConsent: consentDialog.acceptConsent,
      cancelConsent: consentDialog.cancelConsent,
      closeDialog: consentDialog.closeDialog,
    },
  };
};

export default useMediaUpload;
