/**
 * Generic Attachment Manager Component
 * Provides drag-and-drop, selection, and management for any content type
 */

import React, { useState, useCallback, useRef, DragEvent, useEffect } from 'react';
import { logger } from '../../services/core/LoggingService';
import { 
  GenericAttachment, 
  AttachmentManagerConfig,
  DEFAULT_ATTACHMENT_CONFIG 
} from '../../types/attachments';
import { formatFileSize } from '../../config/media';
import { useAttachmentManager } from '../../hooks/useAttachmentManager';

export interface AttachmentManagerProps<T extends GenericAttachment = GenericAttachment> {
  // Configuration
  config?: Partial<AttachmentManagerConfig>;
  
  // Initial data
  initialAttachments?: T[];
  
  // Callbacks
  onAttachmentsChange?: (attachments: T[]) => void;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onError?: (error: string) => void;
  
  // UI customization
  className?: string;
  showPreview?: boolean;
  showMetadata?: boolean;
  showOperations?: boolean;
  allowDragDrop?: boolean;
  allowSelection?: boolean;
  allowReorder?: boolean;
  
  // Content type specific
  renderAttachment?: (attachment: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderError?: (error: string) => React.ReactNode;
}

export const AttachmentManager = <T extends GenericAttachment = GenericAttachment>({
  config = {},
  initialAttachments = [],
  onAttachmentsChange,
  onSelectionChange,
  onError,
  className = '',
  showPreview = true,
  showMetadata = true,
  showOperations = true,
  allowDragDrop = true,
  allowSelection = true,
  allowReorder = true,
  renderAttachment,
  renderEmpty,
  renderError
}: AttachmentManagerProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const hasInitialized = useRef(false);

  // Initialize attachment manager
  const attachmentManager = useAttachmentManager<T>({
    ...DEFAULT_ATTACHMENT_CONFIG,
    ...config,
    showPreview,
    showMetadata
  }, onAttachmentsChange, initialAttachments);

  // Debug logging for initial attachments
  useEffect(() => {
    logger.debug('AttachmentManager initialized with initialAttachments', {
      component: 'AttachmentManager',
      method: 'useEffect',
      initialAttachmentCount: initialAttachments.length,
      initialAttachments: initialAttachments,
      currentAttachments: attachmentManager.state.attachments.length
    });
  }, [initialAttachments, attachmentManager.state.attachments.length]);

  // Note: onAttachmentsChange is now handled directly by the useAttachmentManager hook

  // Handle file input change
  const handleFileInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    logger.debug('File input changed', {
      component: 'AttachmentManager',
      method: 'handleFileInputChange',
      fileCount: files.length
    });

    try {
      await attachmentManager.addAttachments(files);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add files';
      logger.error('Failed to add files', error instanceof Error ? error : new Error(errorMessage), {
        component: 'AttachmentManager',
        method: 'handleFileInputChange',
        error: errorMessage
      });
      onError?.(errorMessage);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [attachmentManager, onError]);

  // Handle drag events
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!allowDragDrop) return;
    
    setDragCounter(prev => prev + 1);
    if (dragCounter === 0) {
      setIsDragOver(true);
    }
  }, [allowDragDrop, dragCounter]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!allowDragDrop) return;
    
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragOver(false);
    }
  }, [allowDragDrop, dragCounter]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!allowDragDrop) return;
    
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    logger.debug('Files dropped', {
      component: 'AttachmentManager',
      method: 'handleDrop',
      fileCount: files.length
    });

    try {
      await attachmentManager.addAttachments(files);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add files';
      logger.error('Failed to add dropped files', error instanceof Error ? error : new Error(errorMessage), {
        component: 'AttachmentManager',
        method: 'handleDrop',
        error: errorMessage
      });
      onError?.(errorMessage);
    }
  }, [allowDragDrop, attachmentManager, onError]);

  // Handle selection
  const handleSelectionChange = useCallback((attachmentId: string, selected: boolean) => {
    if (!allowSelection) return;

    if (selected) {
      attachmentManager.selectAttachment(attachmentId);
    } else {
      attachmentManager.deselectAttachment(attachmentId);
    }

    onSelectionChange?.(attachmentManager.state.selection.selectedIds);
  }, [allowSelection, attachmentManager, onSelectionChange]);

  // Handle reorder
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (!allowReorder) return;

    logger.debug('Reordering attachments', {
      component: 'AttachmentManager',
      method: 'handleReorder',
      fromIndex,
      toIndex
    });

    attachmentManager.reorderAttachments(fromIndex, toIndex);
  }, [allowReorder, attachmentManager]);

  // Handle remove
  const handleRemove = useCallback((attachmentId: string) => {
    logger.debug('Removing attachment', {
      component: 'AttachmentManager',
      method: 'handleRemove',
      attachmentId
    });

    attachmentManager.removeAttachment(attachmentId);
  }, [attachmentManager]);

  // Handle replace
  const handleReplace = useCallback(async (attachmentId: string, file: File) => {
    logger.debug('Replacing attachment', {
      component: 'AttachmentManager',
      method: 'handleReplace',
      attachmentId,
      fileName: file.name
    });

    try {
      await attachmentManager.replaceAttachment(attachmentId, file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to replace file';
      logger.error('Failed to replace attachment', error instanceof Error ? error : new Error(errorMessage), {
        component: 'AttachmentManager',
        method: 'handleReplace',
        attachmentId,
        error: errorMessage
      });
      onError?.(errorMessage);
    }
  }, [attachmentManager, onError]);

  // Default attachment renderer
  const defaultRenderAttachment = useCallback((attachment: T, index: number) => (
    <AttachmentItem
      key={attachment.id}
      attachment={attachment}
      index={index}
      isSelected={attachmentManager.state.selection.selectedIds.has(attachment.id)}
      showPreview={showPreview}
      showMetadata={showMetadata}
      allowSelection={allowSelection}
      allowReorder={allowReorder}
      onSelectionChange={(selected) => handleSelectionChange(attachment.id, selected)}
      onRemove={() => handleRemove(attachment.id)}
      onReplace={(file) => handleReplace(attachment.id, file)}
    />
  ), [
    attachmentManager.state.selection.selectedIds,
    showPreview,
    showMetadata,
    allowSelection,
    allowReorder,
    handleSelectionChange,
    handleRemove,
    handleReplace
  ]);

  // Default empty state
  const defaultRenderEmpty = useCallback(() => (
    <div className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No attachments</h3>
      <p className="mt-1 text-sm text-gray-500">Get started by adding some files.</p>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Files
        </button>
      </div>
    </div>
  ), []);

  // Default error renderer
  const defaultRenderError = useCallback((error: string) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className={`attachment-manager ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={attachmentManager.state.config.supportedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Error display */}
      {attachmentManager.state.error && (
        <div className="mt-4">
          {renderError ? renderError(attachmentManager.state.error) : defaultRenderError(attachmentManager.state.error)}
        </div>
      )}

      {/* Attachments list or empty state */}
      {attachmentManager.state.attachments.length > 0 ? (
        <div className="mt-4 space-y-2">
          {attachmentManager.state.attachments.map((attachment, index) => 
            renderAttachment ? renderAttachment(attachment, index) : defaultRenderAttachment(attachment, index)
          )}
        </div>
      ) : (
        <div className="mt-4">
          {/* Show drag & drop area when no attachments and drag & drop is enabled */}
          {allowDragDrop ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop files here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Up to {attachmentManager.state.config.maxAttachments} files, {formatFileSize(attachmentManager.state.config.maxTotalSize)} total
              </p>
            </div>
          ) : (
            /* Show empty state when drag & drop is disabled */
            renderEmpty ? renderEmpty() : defaultRenderEmpty()
          )}
        </div>
      )}

      {/* Operations toolbar */}
      {showOperations && attachmentManager.state.attachments.length > 0 && (
        <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {attachmentManager.state.attachments.length} of {attachmentManager.state.config.maxAttachments} files
            </span>
            <span className="text-sm text-gray-500">
              ({formatFileSize(attachmentManager.getTotalSize())})
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {allowSelection && attachmentManager.state.selection.selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => attachmentManager.removeSelected()}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove Selected ({attachmentManager.state.selection.selectedIds.size})
              </button>
            )}
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!attachmentManager.canAddMore()}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add More
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual attachment item component
interface AttachmentItemProps<T extends GenericAttachment> {
  attachment: T;
  index: number;
  isSelected: boolean;
  showPreview: boolean;
  showMetadata: boolean;
  allowSelection: boolean;
  allowReorder: boolean;
  onSelectionChange: (selected: boolean) => void;
  onRemove: () => void;
  onReplace: (file: File) => void;
}

const AttachmentItem = <T extends GenericAttachment>({
  attachment,
  index,
  isSelected,
  showPreview,
  showMetadata,
  allowSelection,
  allowReorder,
  onSelectionChange,
  onRemove,
  onReplace
}: AttachmentItemProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReplace = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onReplace(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex items-center space-x-3 p-3 border rounded-lg ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      {/* Selection checkbox */}
      {allowSelection && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectionChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      )}

      {/* Drag handle */}
      {allowReorder && (
        <div className="cursor-move text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}

      {/* Preview */}
      {showPreview && attachment.url && (
        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
          {attachment.type === 'image' ? (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
        <p className="text-sm text-gray-500">
          {formatFileSize(attachment.size)} • {attachment.type}
        </p>
        {showMetadata && attachment.metadata && (
          <div className="mt-1 text-xs text-gray-400">
            {attachment.metadata.width && attachment.metadata.height && (
              <span>{attachment.metadata.width}×{attachment.metadata.height}</span>
            )}
            {attachment.metadata.duration && (
              <span className="ml-2">{Math.round(attachment.metadata.duration)}s</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={attachment.mimeType}
          onChange={handleReplace}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default AttachmentManager;
