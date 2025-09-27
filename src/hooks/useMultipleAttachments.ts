/**
 * Hook for managing multiple media attachments
 * Demonstrates GenericMediaService integration and Enhanced Sequential Upload UX
 */

import { useState, useCallback } from 'react';
import { logger } from '../services/core/LoggingService';
import { 
  genericMediaService, 
  type MediaAttachment, 
  type MediaValidationResult 
} from '../services/generic/GenericMediaService';

export interface AttachmentState {
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
}

export interface UseMultipleAttachmentsReturn {
  // State
  attachmentState: AttachmentState;
  
  // Actions
  validateFiles: (files: File[]) => Promise<void>;
  addAttachment: (attachment: MediaAttachment) => void;
  removeAttachment: (attachmentId: string) => void;
  clearAttachments: () => void;
  reorderAttachments: (fromIndex: number, toIndex: number) => void;
  
  // Utilities
  getMediaLimits: () => ReturnType<typeof genericMediaService.getMediaLimits>;
  canAddMoreFiles: () => boolean;
  getRemainingCapacity: () => { files: number; size: number };
}

const initialState: AttachmentState = {
  attachments: [],
  isValidating: false,
  validationResult: null,
  errors: [],
  totalSize: 0,
  summary: {
    images: 0,
    videos: 0,
    audio: 0,
    total: 0,
  },
};

/**
 * Hook for managing multiple media attachments with validation
 */
export const useMultipleAttachments = (): UseMultipleAttachmentsReturn => {
  const [attachmentState, setAttachmentState] = useState<AttachmentState>(initialState);

  /**
   * Validate multiple files and update state
   */
  const validateFiles = useCallback(async (files: File[]): Promise<void> => {
    if (!files.length) {
      logger.warn('No files provided for validation', {
        hook: 'useMultipleAttachments',
        method: 'validateFiles'
      });
      return;
    }

    setAttachmentState(prev => ({ ...prev, isValidating: true, errors: [] }));

    try {
      logger.info('Starting file validation', {
        hook: 'useMultipleAttachments',
        method: 'validateFiles',
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
      });

      const validationResult = await genericMediaService.validateBatchFiles(files);

      // Sort attachments by type for better organization
      const sortedAttachments = genericMediaService.sortAttachmentsByType(validationResult.validFiles);

      setAttachmentState(prev => ({
        ...prev,
        isValidating: false,
        validationResult,
        attachments: sortedAttachments,
        errors: validationResult.errors,
        totalSize: validationResult.totalSize,
        summary: validationResult.summary,
      }));

      logger.info('File validation completed', {
        hook: 'useMultipleAttachments',
        method: 'validateFiles',
        result: {
          valid: validationResult.valid,
          validCount: validationResult.validFiles.length,
          invalidCount: validationResult.invalidFiles.length,
          summary: validationResult.summary
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      logger.error('File validation failed', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useMultipleAttachments',
        method: 'validateFiles',
        fileCount: files.length,
        error: errorMessage
      });

      setAttachmentState(prev => ({
        ...prev,
        isValidating: false,
        errors: [errorMessage],
        validationResult: null,
      }));
    }
  }, []);

  /**
   * Add a single attachment (for individual file processing)
   */
  const addAttachment = useCallback((attachment: MediaAttachment): void => {
    setAttachmentState(prev => {
      const newAttachments = [...prev.attachments, attachment];
      const sortedAttachments = genericMediaService.sortAttachmentsByType(newAttachments);
      
      const newSummary = {
        images: sortedAttachments.filter(a => a.type === 'image').length,
        videos: sortedAttachments.filter(a => a.type === 'video').length,
        audio: sortedAttachments.filter(a => a.type === 'audio').length,
        total: sortedAttachments.length,
      };

      const newTotalSize = sortedAttachments.reduce((sum, a) => sum + a.size, 0);

      return {
        ...prev,
        attachments: sortedAttachments,
        summary: newSummary,
        totalSize: newTotalSize,
      };
    });

    logger.debug('Attachment added', {
      hook: 'useMultipleAttachments',
      method: 'addAttachment',
      attachmentId: attachment.id,
      type: attachment.type,
      name: attachment.name
    });
  }, []);

  /**
   * Remove an attachment by ID
   */
  const removeAttachment = useCallback((attachmentId: string): void => {
    setAttachmentState(prev => {
      const newAttachments = prev.attachments.filter(a => a.id !== attachmentId);
      
      const newSummary = {
        images: newAttachments.filter(a => a.type === 'image').length,
        videos: newAttachments.filter(a => a.type === 'video').length,
        audio: newAttachments.filter(a => a.type === 'audio').length,
        total: newAttachments.length,
      };

      const newTotalSize = newAttachments.reduce((sum, a) => sum + a.size, 0);

      return {
        ...prev,
        attachments: newAttachments,
        summary: newSummary,
        totalSize: newTotalSize,
      };
    });

    logger.debug('Attachment removed', {
      hook: 'useMultipleAttachments',
      method: 'removeAttachment',
      attachmentId
    });
  }, []);

  /**
   * Clear all attachments
   */
  const clearAttachments = useCallback((): void => {
    setAttachmentState(initialState);
    logger.debug('All attachments cleared', {
      hook: 'useMultipleAttachments',
      method: 'clearAttachments'
    });
  }, []);

  /**
   * Reorder attachments (for drag-and-drop or manual ordering)
   */
  const reorderAttachments = useCallback((fromIndex: number, toIndex: number): void => {
    setAttachmentState(prev => {
      const newAttachments = [...prev.attachments];
      const [movedAttachment] = newAttachments.splice(fromIndex, 1);
      newAttachments.splice(toIndex, 0, movedAttachment);

      return {
        ...prev,
        attachments: newAttachments,
      };
    });

    logger.debug('Attachments reordered', {
      hook: 'useMultipleAttachments',
      method: 'reorderAttachments',
      fromIndex,
      toIndex
    });
  }, []);

  /**
   * Get media configuration limits
   */
  const getMediaLimits = useCallback(() => {
    return genericMediaService.getMediaLimits();
  }, []);

  /**
   * Check if more files can be added
   */
  const canAddMoreFiles = useCallback((): boolean => {
    const limits = genericMediaService.getMediaLimits();
    return attachmentState.attachments.length < limits.maxAttachments;
  }, [attachmentState.attachments.length]);

  /**
   * Get remaining capacity for files and size
   */
  const getRemainingCapacity = useCallback(() => {
    const limits = genericMediaService.getMediaLimits();
    return {
      files: Math.max(0, limits.maxAttachments - attachmentState.attachments.length),
      size: Math.max(0, limits.maxTotalSize - attachmentState.totalSize),
    };
  }, [attachmentState.attachments.length, attachmentState.totalSize]);

  return {
    attachmentState,
    validateFiles,
    addAttachment,
    removeAttachment,
    clearAttachments,
    reorderAttachments,
    getMediaLimits,
    canAddMoreFiles,
    getRemainingCapacity,
  };
};

export default useMultipleAttachments;
