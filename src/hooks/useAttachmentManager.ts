/**
 * Generic Hook for managing attachment state and operations
 * Provides a comprehensive interface for attachment management workflows across any content type
 */

import { useState, useCallback, useMemo } from 'react';
import { logger } from '../services/core/LoggingService';
import { 
  GenericAttachment, 
  AttachmentOperation, 
  AttachmentOperationType,
  AttachmentValidationResult,
  AttachmentSelectionState,
  AttachmentManagerState,
  GenericAttachmentManager,
  AttachmentManagerConfig,
  DEFAULT_ATTACHMENT_CONFIG,
  createAttachmentOperation,
  SelectiveUpdateResult
} from '../types/attachments';
import { mediaBusinessService } from '../services/business/MediaBusinessService';

// Generic attachment manager hook interface
export interface UseAttachmentManagerReturn<T extends GenericAttachment = GenericAttachment> extends GenericAttachmentManager<T> {
  // Additional hook-specific methods
  reset: () => void;
  updateConfig: (config: Partial<AttachmentManagerConfig>) => void;
}

const createInitialState = <T extends GenericAttachment>(config: AttachmentManagerConfig): AttachmentManagerState<T> => ({
  attachments: [],
  operations: [],
  selection: {
    selectedIds: new Set(),
    isSelecting: false,
    isReordering: false,
  },
  validation: null,
  isProcessing: false,
  isUploading: false,
  progress: 0,
  error: null,
  config
});

/**
 * Generic Hook for comprehensive attachment management
 * Works with any content type that extends GenericAttachment
 */
export const useAttachmentManager = <T extends GenericAttachment = GenericAttachment>(
  initialConfig: Partial<AttachmentManagerConfig> = {}
): UseAttachmentManagerReturn<T> => {
  const config = useMemo(() => ({ ...DEFAULT_ATTACHMENT_CONFIG, ...initialConfig }), [initialConfig]);
  const [managerState, setManagerState] = useState<AttachmentManagerState<T>>(() => createInitialState<T>(config));

  // ============================================================================
  // CORE OPERATIONS
  // ============================================================================

  /**
   * Add multiple files and process them
   */
  const addAttachments = useCallback(async (files: File[]): Promise<void> => {
    if (!files.length) {
      logger.warn('No files provided for attachment manager', {
        hook: 'useAttachmentManager',
        method: 'addAttachments'
      });
      return;
    }

    logger.info('Adding files to attachment manager', {
      hook: 'useAttachmentManager',
      method: 'addAttachments',
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    setManagerState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      progress: 0
    }));

    try {
      // Create add operation
      const operation = createAttachmentOperation('add', undefined, files);
      
      // Validate operation
      const validation = mediaBusinessService.validateAttachmentOperation(operation, managerState.attachments);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Process operation
      const result = await mediaBusinessService.processAttachmentOperations(
        [operation],
        managerState.attachments
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to process attachments');
      }

      setManagerState(prev => ({
        ...prev,
        attachments: result.attachments as T[],
        operations: [...prev.operations, operation],
        isProcessing: false,
        progress: 100
      }));

      logger.info('Files added to attachment manager successfully', {
        hook: 'useAttachmentManager',
        method: 'addAttachments',
        newAttachmentCount: result.addedAttachments.length,
        totalAttachments: result.attachments.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to add files to attachment manager', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useAttachmentManager',
        method: 'addAttachments',
        error: errorMessage
      });

      setManagerState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        progress: 0
      }));
    }
  }, [managerState.attachments]);

  /**
   * Remove an attachment by ID
   */
  const removeAttachment = useCallback(async (attachmentId: string): Promise<void> => {
    logger.debug('Removing attachment', {
      hook: 'useAttachmentManager',
      method: 'removeAttachment',
      attachmentId
    });

    try {
      const operation = createAttachmentOperation('remove', attachmentId);
      
      // Validate operation
      const validation = mediaBusinessService.validateAttachmentOperation(operation, managerState.attachments);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Process operation
      const result = await mediaBusinessService.processAttachmentOperations(
        [operation],
        managerState.attachments
      );

      if (result.success) {
        setManagerState(prev => ({
          ...prev,
          attachments: result.attachments as T[],
          operations: [...prev.operations, operation],
          selection: {
            ...prev.selection,
            selectedIds: new Set([...prev.selection.selectedIds].filter(id => id !== attachmentId))
          }
        }));
      } else {
        throw new Error(result.error || 'Failed to remove attachment');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to remove attachment', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useAttachmentManager',
        method: 'removeAttachment',
        attachmentId,
        error: errorMessage
      });

      setManagerState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [managerState.attachments]);

  /**
   * Replace an attachment with a new file
   */
  const replaceAttachment = useCallback(async (attachmentId: string, file: File): Promise<void> => {
    logger.debug('Replacing attachment', {
      hook: 'useAttachmentManager',
      method: 'replaceAttachment',
      attachmentId,
      fileName: file.name
    });

    setManagerState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      progress: 0
    }));

    try {
      const operation = createAttachmentOperation('replace', attachmentId, [file]);
      
      // Validate operation
      const validation = mediaBusinessService.validateAttachmentOperation(operation, managerState.attachments);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Process operation
      const result = await mediaBusinessService.processAttachmentOperations(
        [operation],
        managerState.attachments
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to replace attachment');
      }

      setManagerState(prev => ({
        ...prev,
        attachments: result.attachments as T[],
        operations: [...prev.operations, operation],
        isProcessing: false,
        progress: 100
      }));

      logger.info('Attachment replaced successfully', {
        hook: 'useAttachmentManager',
        method: 'replaceAttachment',
        attachmentId,
        newFileName: file.name
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to replace attachment', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useAttachmentManager',
        method: 'replaceAttachment',
        attachmentId,
        error: errorMessage
      });

      setManagerState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        progress: 0
      }));
    }
  }, [managerState.attachments]);

  /**
   * Reorder attachments
   */
  const reorderAttachments = useCallback(async (fromIndex: number, toIndex: number): Promise<void> => {
    logger.debug('Reordering attachments', {
      hook: 'useAttachmentManager',
      method: 'reorderAttachments',
      fromIndex,
      toIndex
    });

    try {
      const operation = createAttachmentOperation('reorder', undefined, undefined, fromIndex, toIndex);
      
      // Validate operation
      const validation = mediaBusinessService.validateAttachmentOperation(operation, managerState.attachments);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Process operation
      const result = await mediaBusinessService.processAttachmentOperations(
        [operation],
        managerState.attachments
      );

      if (result.success) {
        setManagerState(prev => ({
          ...prev,
          attachments: result.attachments as T[],
          operations: [...prev.operations, operation]
        }));
      } else {
        throw new Error(result.error || 'Failed to reorder attachments');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to reorder attachments', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useAttachmentManager',
        method: 'reorderAttachments',
        fromIndex,
        toIndex,
        error: errorMessage
      });

      setManagerState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [managerState.attachments]);

  // ============================================================================
  // SELECTION OPERATIONS
  // ============================================================================

  /**
   * Select an attachment
   */
  const selectAttachment = useCallback((id: string): void => {
    setManagerState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedIds: new Set([...prev.selection.selectedIds, id])
      }
    }));
  }, []);

  /**
   * Deselect an attachment
   */
  const deselectAttachment = useCallback((id: string): void => {
    setManagerState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedIds: new Set([...prev.selection.selectedIds].filter(selectedId => selectedId !== id))
      }
    }));
  }, []);

  /**
   * Select all attachments
   */
  const selectAll = useCallback((): void => {
    setManagerState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedIds: new Set(prev.attachments.map(att => att.id))
      }
    }));
  }, [managerState.attachments]);

  /**
   * Deselect all attachments
   */
  const deselectAll = useCallback((): void => {
    setManagerState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedIds: new Set()
      }
    }));
  }, []);

  /**
   * Toggle selection of an attachment
   */
  const toggleSelection = useCallback((id: string): void => {
    setManagerState(prev => {
      const newSelectedIds = new Set(prev.selection.selectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      
      return {
        ...prev,
        selection: {
          ...prev.selection,
          selectedIds: newSelectedIds
        }
      };
    });
  }, []);

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Remove selected attachments
   */
  const removeSelected = useCallback(async (): Promise<void> => {
    const selectedIds = Array.from(managerState.selection.selectedIds);
    if (selectedIds.length === 0) return;

    logger.debug('Removing selected attachments', {
      hook: 'useAttachmentManager',
      method: 'removeSelected',
      selectedCount: selectedIds.length
    });

    try {
      const operations = selectedIds.map(id => createAttachmentOperation('remove', id));
      
      // Validate all operations
      for (const operation of operations) {
        const validation = mediaBusinessService.validateAttachmentOperation(operation, managerState.attachments);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      // Process operations
      const result = await mediaBusinessService.processAttachmentOperations(
        operations,
        managerState.attachments
      );

      if (result.success) {
        setManagerState(prev => ({
          ...prev,
          attachments: result.attachments as T[],
          operations: [...prev.operations, ...operations],
          selection: {
            ...prev.selection,
            selectedIds: new Set()
          }
        }));
      } else {
        throw new Error(result.error || 'Failed to remove selected attachments');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to remove selected attachments', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useAttachmentManager',
        method: 'removeSelected',
        error: errorMessage
      });

      setManagerState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [managerState.attachments, managerState.selection.selectedIds]);

  /**
   * Replace selected attachments with new files
   */
  const replaceSelected = useCallback(async (files: File[]): Promise<void> => {
    const selectedIds = Array.from(managerState.selection.selectedIds);
    if (selectedIds.length === 0 || files.length === 0) return;

    logger.debug('Replacing selected attachments', {
      hook: 'useAttachmentManager',
      method: 'replaceSelected',
      selectedCount: selectedIds.length,
      fileCount: files.length
    });

    setManagerState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      progress: 0
    }));

    try {
      const operations: AttachmentOperation[] = [];
      
      // Create replace operations for each selected attachment
      for (let i = 0; i < Math.min(selectedIds.length, files.length); i++) {
        operations.push(createAttachmentOperation('replace', selectedIds[i], [files[i]]));
      }

      // Validate all operations
      for (const operation of operations) {
        const validation = mediaBusinessService.validateAttachmentOperation(operation, managerState.attachments);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      // Process operations
      const result = await mediaBusinessService.processAttachmentOperations(
        operations,
        managerState.attachments
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to replace selected attachments');
      }

      setManagerState(prev => ({
        ...prev,
        attachments: result.attachments as T[],
        operations: [...prev.operations, ...operations],
        isProcessing: false,
        progress: 100,
        selection: {
          ...prev.selection,
          selectedIds: new Set()
        }
      }));

      logger.info('Selected attachments replaced successfully', {
        hook: 'useAttachmentManager',
        method: 'replaceSelected',
        replacedCount: operations.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to replace selected attachments', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useAttachmentManager',
        method: 'replaceSelected',
        error: errorMessage
      });

      setManagerState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        progress: 0
      }));
    }
  }, [managerState.attachments, managerState.selection.selectedIds]);

  /**
   * Reorder selected attachments
   */
  const reorderSelected = useCallback(async (fromIndex: number, toIndex: number): Promise<void> => {
    const selectedIds = Array.from(managerState.selection.selectedIds);
    if (selectedIds.length === 0) return;

    logger.debug('Reordering selected attachments', {
      hook: 'useAttachmentManager',
      method: 'reorderSelected',
      selectedCount: selectedIds.length,
      fromIndex,
      toIndex
    });

    try {
      const operation = createAttachmentOperation('reorder', undefined, undefined, fromIndex, toIndex);
      
      // Validate operation
      const validation = mediaBusinessService.validateAttachmentOperation(operation, managerState.attachments);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Process operation
      const result = await mediaBusinessService.processAttachmentOperations(
        [operation],
        managerState.attachments
      );

      if (result.success) {
        setManagerState(prev => ({
          ...prev,
          attachments: result.attachments as T[],
          operations: [...prev.operations, operation]
        }));
      } else {
        throw new Error(result.error || 'Failed to reorder selected attachments');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to reorder selected attachments', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useAttachmentManager',
        method: 'reorderSelected',
        error: errorMessage
      });

      setManagerState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [managerState.attachments, managerState.selection.selectedIds]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate current attachments
   */
  const validateAttachments = useCallback(async (): Promise<AttachmentValidationResult> => {
    if (!managerState.attachments.length) {
      return {
        valid: true,
        errors: [],
        warnings: [],
        validAttachments: [],
        invalidAttachments: [],
        totalSize: 0,
        estimatedUploadTime: 0
      };
    }

    // Convert attachments back to files for validation
    const files = managerState.attachments
      .filter(a => a.originalFile)
      .map(a => a.originalFile!);

    return await validateFiles(files);
  }, [managerState.attachments]);

  /**
   * Validate files without adding them
   */
  const validateFiles = useCallback(async (files: File[]): Promise<AttachmentValidationResult> => {
    logger.debug('Validating files', {
      hook: 'useAttachmentManager',
      method: 'validateFiles',
      fileCount: files.length
    });

    setManagerState(prev => ({
      ...prev,
      isProcessing: true
    }));

    try {
      const result = await mediaBusinessService.processAttachmentOperations(
        files.map(file => createAttachmentOperation('add', undefined, [file])),
        managerState.attachments
      );
      
      setManagerState(prev => ({
        ...prev,
        isProcessing: false,
        validation: result.success ? {
          valid: true,
          errors: [],
          warnings: result.warnings || [],
          validAttachments: result.attachments,
          invalidAttachments: [],
          totalSize: result.attachments.reduce((sum, att) => sum + att.size, 0),
          estimatedUploadTime: 0
        } : null
      }));

      return result.success ? {
        valid: true,
        errors: [],
        warnings: result.warnings || [],
        validAttachments: result.attachments,
        invalidAttachments: [],
        totalSize: result.attachments.reduce((sum, att) => sum + att.size, 0),
        estimatedUploadTime: 0
      } : {
        valid: false,
        errors: [result.error || 'Validation failed'],
        warnings: [],
        validAttachments: [],
        invalidAttachments: files.map(file => ({ file, error: result.error || 'Validation failed' })),
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        estimatedUploadTime: 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      
      setManagerState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));

      return {
        valid: false,
        errors: [errorMessage],
        warnings: [],
        validAttachments: [],
        invalidAttachments: files.map(file => ({ file, error: errorMessage })),
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        estimatedUploadTime: 0
      };
    }
  }, [managerState.attachments]);

  // ============================================================================
  // PROCESSING
  // ============================================================================


  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get attachment by ID
   */
  const getAttachmentById = useCallback((id: string): T | undefined => {
    return managerState.attachments.find(a => a.id === id);
  }, [managerState.attachments]);

  /**
   * Get attachments by type
   */
  const getAttachmentsByType = useCallback((type: GenericAttachment['type']): T[] => {
    return managerState.attachments.filter(a => a.type === type);
  }, [managerState.attachments]);

  /**
   * Get selected attachments
   */
  const getSelectedAttachments = useCallback((): T[] => {
    return managerState.attachments.filter(att => managerState.selection.selectedIds.has(att.id));
  }, [managerState.attachments, managerState.selection.selectedIds]);

  /**
   * Check if more files can be added
   */
  const canAddMore = useCallback((): boolean => {
    return managerState.attachments.length < managerState.config.maxAttachments;
  }, [managerState.attachments.length, managerState.config.maxAttachments]);

  /**
   * Get remaining capacity
   */
  const getRemainingCapacity = useCallback(() => {
    const currentSize = managerState.attachments.reduce((sum, att) => sum + att.size, 0);
    return {
      files: Math.max(0, managerState.config.maxAttachments - managerState.attachments.length),
      size: Math.max(0, managerState.config.maxTotalSize - currentSize)
    };
  }, [managerState.attachments, managerState.config]);

  /**
   * Get total size
   */
  const getTotalSize = useCallback((): number => {
    return managerState.attachments.reduce((sum, att) => sum + att.size, 0);
  }, [managerState.attachments]);

  /**
   * Get file count
   */
  const getFileCount = useCallback((): number => {
    return managerState.attachments.length;
  }, [managerState.attachments]);

  // ============================================================================
  // OPERATIONS MANAGEMENT
  // ============================================================================

  /**
   * Get operations
   */
  const getOperations = useCallback((): AttachmentOperation[] => {
    return [...managerState.operations];
  }, [managerState.operations]);

  /**
   * Clear operations
   */
  const clearOperations = useCallback((): void => {
    setManagerState(prev => ({
      ...prev,
      operations: []
    }));
  }, []);

  /**
   * Check if there are pending operations
   */
  const hasPendingOperations = useCallback((): boolean => {
    return managerState.operations.some(op => op.status === 'pending' || op.status === 'processing');
  }, [managerState.operations]);

  /**
   * Execute operations
   */
  const executeOperations = useCallback(async (): Promise<SelectiveUpdateResult<T[]>> => {
    if (managerState.operations.length === 0) {
      return {
        success: true,
        content: managerState.attachments,
        attachments: managerState.attachments,
        operations: [],
        addedAttachments: [],
        removedAttachments: [],
        reorderedAttachments: []
      };
    }

    try {
      const result = await mediaBusinessService.processAttachmentOperations(
        managerState.operations,
        []
      );

      if (result.success) {
        setManagerState(prev => ({
          ...prev,
          attachments: result.attachments as T[],
          operations: []
        }));
      }

      return {
        success: result.success,
        content: result.attachments as T[],
        attachments: result.attachments as T[],
        operations: managerState.operations,
        addedAttachments: result.addedAttachments as T[],
        removedAttachments: result.removedAttachments as T[],
        reorderedAttachments: result.reorderedAttachments as T[],
        error: result.error,
        warnings: result.warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        content: managerState.attachments,
        attachments: managerState.attachments,
        operations: managerState.operations,
        addedAttachments: [],
        removedAttachments: [],
        reorderedAttachments: [],
        error: errorMessage
      };
    }
  }, [managerState.operations, managerState.attachments]);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Reset manager state
   */
  const reset = useCallback((): void => {
    logger.debug('Resetting attachment manager', {
      hook: 'useAttachmentManager',
      method: 'reset'
    });

    setManagerState(createInitialState<T>(config));
  }, [config]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<AttachmentManagerConfig>): void => {
    setManagerState(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig }
    }));
  }, []);

  // Computed properties
  const hasAttachments = managerState.attachments.length > 0;
  const hasErrors = managerState.error !== null;
  const isReady = !managerState.isProcessing && !managerState.isUploading && !hasErrors;

  return {
    // State
    state: managerState,
    
    // Core operations
    addAttachments,
    removeAttachment,
    replaceAttachment,
    reorderAttachments,
    
    // Selection operations
    selectAttachment,
    deselectAttachment,
    selectAll,
    deselectAll,
    toggleSelection,
    
    // Batch operations
    removeSelected,
    replaceSelected,
    reorderSelected,
    
    // Validation
    validateAttachments,
    validateFiles,
    
    // Utilities
    getAttachmentById,
    getAttachmentsByType,
    getSelectedAttachments,
    canAddMore,
    getRemainingCapacity,
    getTotalSize,
    getFileCount,
    
    // Operations
    getOperations,
    clearOperations,
    hasPendingOperations,
    executeOperations,
    
    // State management
    reset,
    updateConfig,
    
    // Status
    hasAttachments,
    hasErrors,
    isReady,
  };
};

export default useAttachmentManager;