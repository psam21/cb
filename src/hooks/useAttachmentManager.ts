/**
 * Hook for managing attachment state and operations
 * Provides a comprehensive interface for attachment management workflows
 */

import { useState, useCallback } from 'react';
import { logger } from '../services/core/LoggingService';
import { 
  genericMediaService,
  type MediaAttachment,
  type MediaValidationResult
} from '../services/generic/GenericMediaService';

export interface AttachmentManagerState {
  attachments: MediaAttachment[];
  isValidating: boolean;
  validationResult: MediaValidationResult | null;
  errors: string[];
  totalSize: number;
  summary: {
    images: number;
    videos: number;
    audio: number;
    total: number;
  };
  isProcessing: boolean;
  processingProgress: number; // 0-100
}

export interface UseAttachmentManagerReturn {
  // State
  managerState: AttachmentManagerState;
  
  // File Operations
  addFiles: (files: File[]) => Promise<void>;
  removeAttachment: (attachmentId: string) => void;
  clearAll: () => void;
  reorderAttachments: (fromIndex: number, toIndex: number) => void;
  
  // Validation
  validateFiles: (files: File[]) => Promise<MediaValidationResult>;
  validateCurrentAttachments: () => Promise<MediaValidationResult>;
  
  // Processing
  processAttachments: () => Promise<MediaAttachment[]>;
  
  // Utilities
  getAttachmentById: (id: string) => MediaAttachment | undefined;
  getAttachmentsByType: (type: 'image' | 'video' | 'audio') => MediaAttachment[];
  canAddMoreFiles: () => boolean;
  getRemainingCapacity: () => { files: number; size: number };
  getTotalSize: () => number;
  getFileCount: () => number;
  
  // Status
  hasAttachments: boolean;
  hasErrors: boolean;
  isReady: boolean;
}

const initialState: AttachmentManagerState = {
  attachments: [],
  isValidating: false,
  validationResult: null,
  errors: [],
  totalSize: 0,
  summary: {
    images: 0,
    videos: 0,
    audio: 0,
    total: 0
  },
  isProcessing: false,
  processingProgress: 0,
};

/**
 * Hook for comprehensive attachment management
 */
export const useAttachmentManager = (): UseAttachmentManagerReturn => {
  const [managerState, setManagerState] = useState<AttachmentManagerState>(initialState);

  /**
   * Add multiple files and process them
   */
  const addFiles = useCallback(async (files: File[]): Promise<void> => {
    if (!files.length) {
      logger.warn('No files provided for attachment manager', {
        hook: 'useAttachmentManager',
        method: 'addFiles'
      });
      return;
    }

    logger.info('Adding files to attachment manager', {
      hook: 'useAttachmentManager',
      method: 'addFiles',
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    setManagerState(prev => ({
      ...prev,
      isValidating: true,
      errors: [],
      isProcessing: true,
      processingProgress: 0
    }));

    try {
      // Validate files first
      const validationResult = await genericMediaService.validateBatchFiles(files);
      
      if (!validationResult.valid) {
        const errors = validationResult.errors || [];
        logger.warn('File validation failed', {
          hook: 'useAttachmentManager',
          method: 'addFiles',
          errors,
          invalidFileCount: validationResult.invalidFiles.length
        });

        setManagerState(prev => ({
          ...prev,
          isValidating: false,
          validationResult,
          errors,
          isProcessing: false,
          processingProgress: 0
        }));
        return;
      }

      // Process valid files
      const newAttachments: MediaAttachment[] = [];
      const totalFiles = validationResult.validFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const attachment = validationResult.validFiles[i];
        newAttachments.push(attachment);
        
        // Update progress
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        setManagerState(prev => ({
          ...prev,
          processingProgress: progress
        }));
      }

      // Sort attachments by type
      const sortedAttachments = genericMediaService.sortAttachmentsByType(newAttachments);
      
      // Calculate summary
      const summary = {
        images: sortedAttachments.filter(a => a.type === 'image').length,
        videos: sortedAttachments.filter(a => a.type === 'video').length,
        audio: sortedAttachments.filter(a => a.type === 'audio').length,
        total: sortedAttachments.length
      };

      const totalSize = sortedAttachments.reduce((sum, a) => sum + a.size, 0);

      setManagerState(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...sortedAttachments],
        isValidating: false,
        validationResult,
        errors: [],
        totalSize: prev.totalSize + totalSize,
        summary: {
          images: prev.summary.images + summary.images,
          videos: prev.summary.videos + summary.videos,
          audio: prev.summary.audio + summary.audio,
          total: prev.summary.total + summary.total
        },
        isProcessing: false,
        processingProgress: 100
      }));

      logger.info('Files added to attachment manager successfully', {
        hook: 'useAttachmentManager',
        method: 'addFiles',
        newAttachmentCount: sortedAttachments.length,
        totalAttachments: managerState.attachments.length + sortedAttachments.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to add files to attachment manager', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useAttachmentManager',
        method: 'addFiles',
        error: errorMessage
      });

      setManagerState(prev => ({
        ...prev,
        isValidating: false,
        errors: [errorMessage],
        isProcessing: false,
        processingProgress: 0
      }));
    }
  }, [managerState.attachments.length]);

  /**
   * Remove an attachment by ID
   */
  const removeAttachment = useCallback((attachmentId: string): void => {
    logger.debug('Removing attachment', {
      hook: 'useAttachmentManager',
      method: 'removeAttachment',
      attachmentId
    });

    setManagerState(prev => {
      const attachmentToRemove = prev.attachments.find(a => a.id === attachmentId);
      if (!attachmentToRemove) {
        logger.warn('Attachment not found for removal', {
          hook: 'useAttachmentManager',
          method: 'removeAttachment',
          attachmentId
        });
        return prev;
      }

      const newAttachments = prev.attachments.filter(a => a.id !== attachmentId);
      const newTotalSize = prev.totalSize - attachmentToRemove.size;
      
      const newSummary = {
        images: newAttachments.filter(a => a.type === 'image').length,
        videos: newAttachments.filter(a => a.type === 'video').length,
        audio: newAttachments.filter(a => a.type === 'audio').length,
        total: newAttachments.length
      };

      return {
        ...prev,
        attachments: newAttachments,
        totalSize: newTotalSize,
        summary: newSummary
      };
    });
  }, []);

  /**
   * Clear all attachments
   */
  const clearAll = useCallback((): void => {
    logger.debug('Clearing all attachments', {
      hook: 'useAttachmentManager',
      method: 'clearAll'
    });

    setManagerState(initialState);
  }, []);

  /**
   * Reorder attachments
   */
  const reorderAttachments = useCallback((fromIndex: number, toIndex: number): void => {
    logger.debug('Reordering attachments', {
      hook: 'useAttachmentManager',
      method: 'reorderAttachments',
      fromIndex,
      toIndex
    });

    setManagerState(prev => {
      const newAttachments = [...prev.attachments];
      const [movedAttachment] = newAttachments.splice(fromIndex, 1);
      newAttachments.splice(toIndex, 0, movedAttachment);

      return {
        ...prev,
        attachments: newAttachments
      };
    });
  }, []);

  /**
   * Validate files without adding them
   */
  const validateFiles = useCallback(async (files: File[]): Promise<MediaValidationResult> => {
    logger.debug('Validating files', {
      hook: 'useAttachmentManager',
      method: 'validateFiles',
      fileCount: files.length
    });

    setManagerState(prev => ({
      ...prev,
      isValidating: true
    }));

    try {
      const result = await genericMediaService.validateBatchFiles(files);
      
      setManagerState(prev => ({
        ...prev,
        isValidating: false,
        validationResult: result
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      
      setManagerState(prev => ({
        ...prev,
        isValidating: false,
        errors: [errorMessage]
      }));

      return {
        valid: false,
        validFiles: [],
        invalidFiles: files.map(file => ({ file, error: errorMessage })),
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        errors: [errorMessage],
        summary: { images: 0, videos: 0, audio: 0, total: 0 }
      };
    }
  }, []);

  /**
   * Validate current attachments
   */
  const validateCurrentAttachments = useCallback(async (): Promise<MediaValidationResult> => {
    if (!managerState.attachments.length) {
      return {
        valid: true,
        validFiles: [],
        invalidFiles: [],
        totalSize: 0,
        errors: [],
        summary: { images: 0, videos: 0, audio: 0, total: 0 }
      };
    }

    // Convert attachments back to files for validation
    const files = managerState.attachments
      .filter(a => a.originalFile)
      .map(a => a.originalFile!);

    return await validateFiles(files);
  }, [managerState.attachments, validateFiles]);

  /**
   * Process attachments (placeholder for future processing logic)
   */
  const processAttachments = useCallback(async (): Promise<MediaAttachment[]> => {
    logger.debug('Processing attachments', {
      hook: 'useAttachmentManager',
      method: 'processAttachments',
      attachmentCount: managerState.attachments.length
    });

    // For now, just return the current attachments
    // Future: Add processing logic like image optimization, etc.
    return managerState.attachments;
  }, [managerState.attachments]);

  /**
   * Get attachment by ID
   */
  const getAttachmentById = useCallback((id: string): MediaAttachment | undefined => {
    return managerState.attachments.find(a => a.id === id);
  }, [managerState.attachments]);

  /**
   * Get attachments by type
   */
  const getAttachmentsByType = useCallback((type: 'image' | 'video' | 'audio'): MediaAttachment[] => {
    return managerState.attachments.filter(a => a.type === type);
  }, [managerState.attachments]);

  /**
   * Check if more files can be added
   */
  const canAddMoreFiles = useCallback((): boolean => {
    const limits = genericMediaService.getMediaLimits();
    return managerState.attachments.length < limits.maxAttachments;
  }, [managerState.attachments.length]);

  /**
   * Get remaining capacity
   */
  const getRemainingCapacity = useCallback(() => {
    const limits = genericMediaService.getMediaLimits();
    return {
      files: Math.max(0, limits.maxAttachments - managerState.attachments.length),
      size: Math.max(0, limits.maxTotalSize - managerState.totalSize)
    };
  }, [managerState.attachments.length, managerState.totalSize]);

  /**
   * Get total size
   */
  const getTotalSize = useCallback((): number => {
    return managerState.totalSize;
  }, [managerState.totalSize]);

  /**
   * Get file count
   */
  const getFileCount = useCallback((): number => {
    return managerState.attachments.length;
  }, [managerState.attachments.length]);

  // Computed properties
  const hasAttachments = managerState.attachments.length > 0;
  const hasErrors = managerState.errors.length > 0;
  const isReady = !managerState.isValidating && !managerState.isProcessing && !hasErrors;

  return {
    managerState,
    addFiles,
    removeAttachment,
    clearAll,
    reorderAttachments,
    validateFiles,
    validateCurrentAttachments,
    processAttachments,
    getAttachmentById,
    getAttachmentsByType,
    canAddMoreFiles,
    getRemainingCapacity,
    getTotalSize,
    getFileCount,
    hasAttachments,
    hasErrors,
    isReady,
  };
};

export default useAttachmentManager;
