/**
 * Generic attachment types and interfaces for modular, reusable attachment management
 * Supports selective operations across multiple content types and projects
 */

// File type is available globally in browser environments

/**
 * Generic attachment interface that can be extended for specific content types
 */
export interface GenericAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  size: number;
  mimeType: string;
  url?: string;
  hash?: string;
  metadata?: AttachmentMetadata;
  originalFile?: File;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Attachment metadata for different media types
 */
export interface AttachmentMetadata {
  // Image metadata
  width?: number;
  height?: number;
  aspectRatio?: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  
  // Video metadata
  duration?: number;
  frameRate?: number;
  bitrate?: number;
  codec?: string;
  
  // Audio metadata
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  
  // Document metadata
  pageCount?: number;
  wordCount?: number;
  language?: string;
  
  // Generic metadata
  description?: string;
  tags?: string[];
  author?: string;
  license?: string;
}

/**
 * Attachment operation types for selective management
 */
export type AttachmentOperationType = 'add' | 'remove' | 'reorder' | 'replace' | 'update';

/**
 * Individual attachment operation
 */
export interface AttachmentOperation {
  id: string;
  type: AttachmentOperationType;
  attachmentId?: string;
  files?: File[];
  fromIndex?: number;
  toIndex?: number;
  metadata?: Partial<AttachmentMetadata>;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Result of selective attachment operations
 */
export interface SelectiveUpdateResult<T> {
  success: boolean;
  content: T;
  attachments: GenericAttachment[];
  operations: AttachmentOperation[];
  addedAttachments: GenericAttachment[];
  removedAttachments: GenericAttachment[];
  reorderedAttachments: GenericAttachment[];
  error?: string;
  warnings?: string[];
}

/**
 * Attachment selection state for UI management
 */
export interface AttachmentSelectionState {
  selectedIds: Set<string>;
  isSelecting: boolean;
  isReordering: boolean;
  dragSource?: string;
  dragTarget?: string;
  lastOperation?: AttachmentOperation;
}

/**
 * Attachment validation result
 */
export interface AttachmentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  validAttachments: GenericAttachment[];
  invalidAttachments: { file: File; error: string }[];
  totalSize: number;
  estimatedUploadTime: number;
}

/**
 * Attachment operation batch for efficient processing
 */
export interface AttachmentOperationBatch {
  id: string;
  operations: AttachmentOperation[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  error?: string;
}

/**
 * Attachment manager configuration
 */
export interface AttachmentManagerConfig {
  maxAttachments: number;
  maxFileSize: number;
  maxTotalSize: number;
  supportedTypes: string[];
  allowReorder: boolean;
  allowReplace: boolean;
  allowMultipleSelection: boolean;
  autoUpload: boolean;
  validateOnAdd: boolean;
  showPreview: boolean;
  showMetadata: boolean;
}

/**
 * Attachment manager state
 */
export interface AttachmentManagerState<T extends GenericAttachment = GenericAttachment> {
  attachments: T[];
  operations: AttachmentOperation[];
  selection: AttachmentSelectionState;
  validation: AttachmentValidationResult | null;
  isProcessing: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
  config: AttachmentManagerConfig;
}

/**
 * Generic attachment manager interface
 */
export interface GenericAttachmentManager<T extends GenericAttachment = GenericAttachment> {
  // State
  state: AttachmentManagerState<T>;
  
  // Core operations
  addAttachments(files: File[]): Promise<void>;
  removeAttachment(id: string): void;
  replaceAttachment(id: string, file: File): Promise<void>;
  reorderAttachments(fromIndex: number, toIndex: number): void;
  
  // Selection operations
  selectAttachment(id: string): void;
  deselectAttachment(id: string): void;
  selectAll(): void;
  deselectAll(): void;
  toggleSelection(id: string): void;
  
  // Batch operations
  removeSelected(): void;
  replaceSelected(files: File[]): Promise<void>;
  reorderSelected(fromIndex: number, toIndex: number): void;
  
  // Validation
  validateAttachments(): Promise<AttachmentValidationResult>;
  validateFiles(files: File[]): Promise<AttachmentValidationResult>;
  
  // Operations
  getOperations(): AttachmentOperation[];
  clearOperations(): void;
  hasPendingOperations(): boolean;
  executeOperations(): Promise<SelectiveUpdateResult<T[]>>;
  
  // Utilities
  getAttachmentById(id: string): T | undefined;
  getAttachmentsByType(type: GenericAttachment['type']): T[];
  getSelectedAttachments(): T[];
  canAddMore(): boolean;
  getRemainingCapacity(): { files: number; size: number };
  getTotalSize(): number;
  getFileCount(): number;
  
  // Status
  hasAttachments: boolean;
  hasErrors: boolean;
  isReady: boolean;
  
  // State management
  reset(): void;
  updateConfig(config: Partial<AttachmentManagerConfig>): void;
}

/**
 * Content-specific attachment interfaces
 */

/**
 * Shop product attachment
 */
export interface ProductAttachment extends GenericAttachment {
  type: 'image' | 'video' | 'audio';
  isPrimary: boolean;
  displayOrder: number;
  productId?: string;
  category?: string;
}

/**
 * Event attachment
 */
export interface EventAttachment extends GenericAttachment {
  type: 'image' | 'video' | 'audio' | 'document';
  eventId?: string;
  isCover: boolean;
  displayOrder: number;
  category?: 'photo' | 'video' | 'audio' | 'document';
}

/**
 * Resource attachment
 */
export interface ResourceAttachment extends GenericAttachment {
  type: 'document' | 'image' | 'video' | 'audio';
  resourceId?: string;
  isDownloadable: boolean;
  displayOrder: number;
  category?: 'guide' | 'media' | 'document' | 'reference';
}

/**
 * Profile attachment
 */
export interface ProfileAttachment extends GenericAttachment {
  type: 'image' | 'video' | 'audio';
  profileId?: string;
  isAvatar: boolean;
  displayOrder: number;
  category?: 'avatar' | 'banner' | 'gallery' | 'audio';
}

/**
 * Generic attachment manager factory
 */
export interface AttachmentManagerFactory {
  createManager<T extends GenericAttachment>(
    config: AttachmentManagerConfig
  ): GenericAttachmentManager<T>;
  
  createProductManager(config?: Partial<AttachmentManagerConfig>): GenericAttachmentManager<ProductAttachment>;
  createEventManager(config?: Partial<AttachmentManagerConfig>): GenericAttachmentManager<EventAttachment>;
  createResourceManager(config?: Partial<AttachmentManagerConfig>): GenericAttachmentManager<ResourceAttachment>;
  createProfileManager(config?: Partial<AttachmentManagerConfig>): GenericAttachmentManager<ProfileAttachment>;
}

/**
 * Default attachment manager configuration
 */
export const DEFAULT_ATTACHMENT_CONFIG: AttachmentManagerConfig = {
  maxAttachments: 5,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxTotalSize: 500 * 1024 * 1024, // 500MB
  supportedTypes: ['image/*', 'video/*', 'audio/*'],
  allowReorder: true,
  allowReplace: true,
  allowMultipleSelection: true,
  autoUpload: false,
  validateOnAdd: true,
  showPreview: true,
  showMetadata: true,
};

/**
 * Attachment operation type guards
 */
export const isAttachmentOperation = (obj: unknown): obj is AttachmentOperation => {
  return obj !== null && 
    typeof obj === 'object' &&
    'id' in obj &&
    'type' in obj &&
    'timestamp' in obj &&
    'status' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    typeof (obj as Record<string, unknown>).type === 'string' &&
    typeof (obj as Record<string, unknown>).timestamp === 'number' &&
    typeof (obj as Record<string, unknown>).status === 'string';
};

export const isGenericAttachment = (obj: unknown): obj is GenericAttachment => {
  return obj !== null &&
    typeof obj === 'object' &&
    'id' in obj &&
    'type' in obj &&
    'name' in obj &&
    'size' in obj &&
    'mimeType' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    typeof (obj as Record<string, unknown>).type === 'string' &&
    typeof (obj as Record<string, unknown>).name === 'string' &&
    typeof (obj as Record<string, unknown>).size === 'number' &&
    typeof (obj as Record<string, unknown>).mimeType === 'string';
};

/**
 * Utility functions for attachment management
 */
export const createAttachmentOperation = (
  type: AttachmentOperationType,
  attachmentId?: string,
  files?: File[],
  fromIndex?: number,
  toIndex?: number
): AttachmentOperation => ({
  id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  attachmentId,
  files,
  fromIndex,
  toIndex,
  timestamp: Date.now(),
  status: 'pending',
});

export const createGenericAttachment = (
  file: File,
  type: GenericAttachment['type'],
  url?: string,
  hash?: string,
  metadata?: AttachmentMetadata
): GenericAttachment => ({
  id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  name: file.name,
  size: file.size,
  mimeType: file.type,
  url,
  hash,
  metadata,
  originalFile: file,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export default GenericAttachment;
