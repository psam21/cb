/**
 * Specialized Hook for Selective Attachment Management
 * Provides optimized workflows for selective add/remove/reorder operations
 */

import { useState, useCallback, useMemo } from 'react';
import { logger } from '../services/core/LoggingService';
import { 
  GenericAttachment, 
  AttachmentOperation, 
  AttachmentSelectionState,
  SelectiveUpdateResult,
  AttachmentManagerConfig,
  DEFAULT_ATTACHMENT_CONFIG
} from '../types/attachments';
import { useAttachmentManager } from './useAttachmentManager';
import { mediaBusinessService } from '../services/business/MediaBusinessService';

export interface SelectiveAttachmentManagerState<T extends GenericAttachment = GenericAttachment> {
  attachments: T[];
  operations: AttachmentOperation[];
  selection: AttachmentSelectionState;
  isProcessing: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
  config: AttachmentManagerConfig;
  batchMode: boolean;
  pendingOperations: AttachmentOperation[];
}

export interface UseSelectiveAttachmentManagerReturn<T extends GenericAttachment = GenericAttachment> {
  // State
  state: SelectiveAttachmentManagerState<T>;
  
  // Core selective operations
  addAttachments: (files: File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  replaceAttachment: (id: string, file: File) => Promise<void>;
  reorderAttachments: (fromIndex: number, toIndex: number) => void;
  
  // Batch operations
  addToBatch: (operation: AttachmentOperation) => void;
  removeFromBatch: (operationId: string) => void;
  clearBatch: () => void;
  executeBatch: () => Promise<SelectiveUpdateResult<T[]>>;
  
  // Selection management
  selectAttachment: (id: string) => void;
  deselectAttachment: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelection: (id: string) => void;
  selectRange: (startIndex: number, endIndex: number) => void;
  
  // Batch selection operations
  removeSelected: () => void;
  replaceSelected: (files: File[]) => Promise<void>;
  reorderSelected: (fromIndex: number, toIndex: number) => void;
  
  // Operation management
  getOperations: () => AttachmentOperation[];
  getPendingOperations: () => AttachmentOperation[];
  hasPendingOperations: () => boolean;
  clearOperations: () => void;
  
  // Validation
  validateOperations: (operations: AttachmentOperation[]) => Promise<{ valid: boolean; error?: string }>;
  validateCurrentState: () => Promise<{ valid: boolean; error?: string }>;
  
  // Utilities
  getAttachmentById: (id: string) => T | undefined;
  getAttachmentsByType: (type: GenericAttachment['type']) => T[];
  getSelectedAttachments: () => T[];
  canAddMore: () => boolean;
  getRemainingCapacity: () => { files: number; size: number };
  getTotalSize: () => number;
  getFileCount: () => number;
  
  // State management
  reset: () => void;
  updateConfig: (config: Partial<AttachmentManagerConfig>) => void;
  setBatchMode: (enabled: boolean) => void;
  
  // Status
  hasAttachments: boolean;
  hasErrors: boolean;
  isReady: boolean;
  isBatchMode: boolean;
}

/**
 * Specialized hook for selective attachment management
 * Optimized for complex workflows with batching and selection
 */
export const useSelectiveAttachmentManager = <T extends GenericAttachment = GenericAttachment>(
  initialConfig: Partial<AttachmentManagerConfig> = {}
): UseSelectiveAttachmentManagerReturn<T> => {
  const config = useMemo(() => ({ ...DEFAULT_ATTACHMENT_CONFIG, ...initialConfig }), [initialConfig]);
  
  // Use the base attachment manager
  const baseManager = useAttachmentManager<T>(config);
  
  // Additional state for selective operations
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [pendingOperations, setPendingOperations] = useState<AttachmentOperation[]>([]);

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Add operation to batch
   */
  const addToBatch = useCallback((operation: AttachmentOperation): void => {
    logger.debug('Adding operation to batch', {
      hook: 'useSelectiveAttachmentManager',
      method: 'addToBatch',
      operationType: operation.type,
      operationId: operation.id,
      batchSize: pendingOperations.length + 1
    });

    setPendingOperations(prev => {
      // Remove any existing operation with the same ID
      const filtered = prev.filter(op => op.id !== operation.id);
      return [...filtered, operation];
    });
  }, [pendingOperations.length]);

  /**
   * Remove operation from batch
   */
  const removeFromBatch = useCallback((operationId: string): void => {
    logger.debug('Removing operation from batch', {
      hook: 'useSelectiveAttachmentManager',
      method: 'removeFromBatch',
      operationId,
      batchSize: pendingOperations.length
    });

    setPendingOperations(prev => prev.filter(op => op.id !== operationId));
  }, [pendingOperations.length]);

  /**
   * Clear all pending operations
   */
  const clearBatch = useCallback((): void => {
    logger.debug('Clearing batch operations', {
      hook: 'useSelectiveAttachmentManager',
      method: 'clearBatch',
      batchSize: pendingOperations.length
    });

    setPendingOperations([]);
  }, [pendingOperations.length]);

  /**
   * Execute all pending operations
   */
  const executeBatch = useCallback(async (): Promise<SelectiveUpdateResult<T[]>> => {
    if (pendingOperations.length === 0) {
      return {
        success: true,
        content: baseManager.state.attachments,
        attachments: baseManager.state.attachments,
        operations: [],
        addedAttachments: [],
        removedAttachments: [],
        reorderedAttachments: []
      };
    }

    logger.info('Executing batch operations', {
      hook: 'useSelectiveAttachmentManager',
      method: 'executeBatch',
      operationCount: pendingOperations.length
    });

    try {
      // Process all operations at once
      const result = await mediaBusinessService.processAttachmentOperations(
        pendingOperations,
        baseManager.state.attachments
      );

      if (result.success) {
        // Update the base manager state
        baseManager.state.attachments = result.attachments as T[];
        baseManager.state.operations = [...baseManager.state.operations, ...pendingOperations];
        
        // Clear pending operations
        setPendingOperations([]);
      }

      return {
        success: result.success,
        content: result.attachments as T[],
        attachments: result.attachments as T[],
        operations: pendingOperations,
        addedAttachments: result.addedAttachments as T[],
        removedAttachments: result.removedAttachments as T[],
        reorderedAttachments: result.reorderedAttachments as T[],
        error: result.error,
        warnings: result.warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown batch execution error';
      logger.error('Failed to execute batch operations', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useSelectiveAttachmentManager',
        method: 'executeBatch',
        error: errorMessage
      });

      return {
        success: false,
        content: baseManager.state.attachments,
        attachments: baseManager.state.attachments,
        operations: pendingOperations,
        addedAttachments: [],
        removedAttachments: [],
        reorderedAttachments: [],
        error: errorMessage
      };
    }
  }, [pendingOperations, baseManager]);

  // ============================================================================
  // ENHANCED SELECTION OPERATIONS
  // ============================================================================

  /**
   * Select range of attachments
   */
  const selectRange = useCallback((startIndex: number, endIndex: number): void => {
    const attachments = baseManager.state.attachments;
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    const rangeIds = attachments
      .slice(start, end + 1)
      .map(att => att.id);

    logger.debug('Selecting range of attachments', {
      hook: 'useSelectiveAttachmentManager',
      method: 'selectRange',
      startIndex,
      endIndex,
      selectedCount: rangeIds.length
    });

    baseManager.state.selection.selectedIds = new Set([
      ...baseManager.state.selection.selectedIds,
      ...rangeIds
    ]);
  }, [baseManager]);

  // ============================================================================
  // ENHANCED BATCH SELECTION OPERATIONS
  // ============================================================================

  /**
   * Remove selected attachments with batch support
   */
  const removeSelected = useCallback((): void => {
    const selectedIds = Array.from(baseManager.state.selection.selectedIds);
    if (selectedIds.length === 0) return;

    logger.debug('Removing selected attachments', {
      hook: 'useSelectiveAttachmentManager',
      method: 'removeSelected',
      selectedCount: selectedIds.length,
      batchMode
    });

    if (batchMode) {
      // Add remove operations to batch
      selectedIds.forEach(id => {
        const operation = mediaBusinessService.createAttachmentOperation('remove', id);
        addToBatch(operation);
      });
    } else {
      // Execute immediately
      baseManager.removeSelected();
    }
  }, [baseManager, batchMode, addToBatch]);

  /**
   * Replace selected attachments with batch support
   */
  const replaceSelected = useCallback(async (files: File[]): Promise<void> => {
    const selectedIds = Array.from(baseManager.state.selection.selectedIds);
    if (selectedIds.length === 0 || files.length === 0) return;

    logger.debug('Replacing selected attachments', {
      hook: 'useSelectiveAttachmentManager',
      method: 'replaceSelected',
      selectedCount: selectedIds.length,
      fileCount: files.length,
      batchMode
    });

    if (batchMode) {
      // Add replace operations to batch
      for (let i = 0; i < Math.min(selectedIds.length, files.length); i++) {
        const operation = mediaBusinessService.createAttachmentOperation('replace', selectedIds[i], [files[i]]);
        addToBatch(operation);
      }
    } else {
      // Execute immediately
      await baseManager.replaceSelected(files);
    }
  }, [baseManager, batchMode, addToBatch]);

  /**
   * Reorder selected attachments with batch support
   */
  const reorderSelected = useCallback((fromIndex: number, toIndex: number): void => {
    const selectedIds = Array.from(baseManager.state.selection.selectedIds);
    if (selectedIds.length === 0) return;

    logger.debug('Reordering selected attachments', {
      hook: 'useSelectiveAttachmentManager',
      method: 'reorderSelected',
      selectedCount: selectedIds.length,
      fromIndex,
      toIndex,
      batchMode
    });

    if (batchMode) {
      // Add reorder operation to batch
      const operation = mediaBusinessService.createAttachmentOperation('reorder', undefined, undefined, fromIndex, toIndex);
      addToBatch(operation);
    } else {
      // Execute immediately
      baseManager.reorderSelected(fromIndex, toIndex);
    }
  }, [baseManager, batchMode, addToBatch]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate operations
   */
  const validateOperations = useCallback(async (operations: AttachmentOperation[]): Promise<{ valid: boolean; error?: string }> => {
    try {
      for (const operation of operations) {
        const validation = mediaBusinessService.validateAttachmentOperation(operation, baseManager.state.attachments);
        if (!validation.valid) {
          return { valid: false, error: validation.error };
        }
      }
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      };
    }
  }, [baseManager.state.attachments]);

  /**
   * Validate current state
   */
  const validateCurrentState = useCallback(async (): Promise<{ valid: boolean; error?: string }> => {
    const allOperations = [...baseManager.state.operations, ...pendingOperations];
    return validateOperations(allOperations);
  }, [baseManager.state.operations, pendingOperations, validateOperations]);

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get pending operations
   */
  const getPendingOperations = useCallback((): AttachmentOperation[] => {
    return [...pendingOperations];
  }, [pendingOperations]);

  /**
   * Check if there are pending operations
   */
  const hasPendingOperations = useCallback((): boolean => {
    return pendingOperations.length > 0 || baseManager.hasPendingOperations();
  }, [pendingOperations.length, baseManager]);

  /**
   * Clear all operations
   */
  const clearOperations = useCallback((): void => {
    baseManager.clearOperations();
    setPendingOperations([]);
  }, [baseManager]);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Reset manager state
   */
  const reset = useCallback((): void => {
    baseManager.reset();
    setPendingOperations([]);
    setBatchMode(false);
  }, [baseManager]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<AttachmentManagerConfig>): void => {
    baseManager.updateConfig(newConfig);
  }, [baseManager]);

  // ============================================================================
  // COMPUTED STATE
  // ============================================================================

  const selectiveState: SelectiveAttachmentManagerState<T> = {
    attachments: baseManager.state.attachments,
    operations: baseManager.state.operations,
    selection: baseManager.state.selection,
    isProcessing: baseManager.state.isProcessing,
    isUploading: baseManager.state.isUploading,
    progress: baseManager.state.progress,
    error: baseManager.state.error,
    config: baseManager.state.config,
    batchMode,
    pendingOperations
  };

  const hasAttachments = baseManager.state.attachments.length > 0;
  const hasErrors = baseManager.state.error !== null;
  const isReady = !baseManager.state.isProcessing && !baseManager.state.isUploading && !hasErrors;
  const isBatchMode = batchMode;

  return {
    // State
    state: selectiveState,
    
    // Core selective operations
    addAttachments: baseManager.addAttachments,
    removeAttachment: baseManager.removeAttachment,
    replaceAttachment: baseManager.replaceAttachment,
    reorderAttachments: baseManager.reorderAttachments,
    
    // Batch operations
    addToBatch,
    removeFromBatch,
    clearBatch,
    executeBatch,
    
    // Selection management
    selectAttachment: baseManager.selectAttachment,
    deselectAttachment: baseManager.deselectAttachment,
    selectAll: baseManager.selectAll,
    deselectAll: baseManager.deselectAll,
    toggleSelection: baseManager.toggleSelection,
    selectRange,
    
    // Batch selection operations
    removeSelected,
    replaceSelected,
    reorderSelected,
    
    // Operation management
    getOperations: baseManager.getOperations,
    getPendingOperations,
    hasPendingOperations,
    clearOperations,
    
    // Validation
    validateOperations,
    validateCurrentState,
    
    // Utilities
    getAttachmentById: baseManager.getAttachmentById,
    getAttachmentsByType: baseManager.getAttachmentsByType,
    getSelectedAttachments: baseManager.getSelectedAttachments,
    canAddMore: baseManager.canAddMore,
    getRemainingCapacity: baseManager.getRemainingCapacity,
    getTotalSize: baseManager.getTotalSize,
    getFileCount: baseManager.getFileCount,
    
    // State management
    reset,
    updateConfig,
    setBatchMode,
    
    // Status
    hasAttachments,
    hasErrors,
    isReady,
    isBatchMode,
  };
};

export default useSelectiveAttachmentManager;
