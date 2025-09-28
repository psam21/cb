/**
 * Media Business Service for attachment management logic
 * Handles business rules and lifecycle management for attachments
 */

import { logger } from '../core/LoggingService';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
import { 
  GenericAttachment, 
  AttachmentOperation, 
  AttachmentOperationType,
  SelectiveUpdateResult,
  AttachmentManagerConfig,
  DEFAULT_ATTACHMENT_CONFIG
} from '../../types/attachments';
import { genericMediaService } from '../generic/GenericMediaService';
import { blossomService } from '../generic/GenericBlossomService';
import { NostrSigner } from '../../types/nostr';

export interface MediaBusinessRules {
  maxAttachments: number;
  maxFileSize: number;
  maxTotalSize: number;
  allowedTypes: string[];
  requireAuthentication: boolean;
  allowReplace: boolean;
  allowReorder: boolean;
  allowMultipleSelection: boolean;
}

export interface AttachmentLifecycleEvent {
  type: 'created' | 'updated' | 'deleted' | 'reordered';
  attachmentId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface MediaBusinessServiceConfig {
  rules: MediaBusinessRules;
  autoUpload: boolean;
  validateOnAdd: boolean;
  trackLifecycle: boolean;
}

/**
 * Media Business Service for attachment management
 */
export class MediaBusinessService {
  private static instance: MediaBusinessService;
  private config: MediaBusinessServiceConfig;
  private lifecycleEvents: AttachmentLifecycleEvent[] = [];

  private constructor(config?: Partial<MediaBusinessServiceConfig>) {
    this.config = {
      rules: {
        maxAttachments: DEFAULT_ATTACHMENT_CONFIG.maxAttachments,
        maxFileSize: DEFAULT_ATTACHMENT_CONFIG.maxFileSize,
        maxTotalSize: DEFAULT_ATTACHMENT_CONFIG.maxTotalSize,
        allowedTypes: DEFAULT_ATTACHMENT_CONFIG.supportedTypes,
        requireAuthentication: true,
        allowReplace: true,
        allowReorder: true,
        allowMultipleSelection: true,
      },
      autoUpload: false,
      validateOnAdd: true,
      trackLifecycle: true,
      ...config
    };

    logger.info('MediaBusinessService initialized', {
      service: 'MediaBusinessService',
      method: 'constructor',
      config: this.config
    });
  }

  public static getInstance(config?: Partial<MediaBusinessServiceConfig>): MediaBusinessService {
    if (!MediaBusinessService.instance) {
      MediaBusinessService.instance = new MediaBusinessService(config);
    }
    return MediaBusinessService.instance;
  }

  /**
   * Validate attachment operation against business rules
   */
  public validateAttachmentOperation(
    operation: AttachmentOperation,
    existingAttachments: GenericAttachment[] = []
  ): { valid: boolean; error?: string; warnings?: string[] } {
    try {
      logger.debug('Validating attachment operation', {
        service: 'MediaBusinessService',
        method: 'validateAttachmentOperation',
        operationType: operation.type,
        operationId: operation.id,
        existingAttachmentCount: existingAttachments.length
      });

      const warnings: string[] = [];

      // Validate operation type against business rules
      switch (operation.type) {
        case 'add':
          if (!this.config.rules.allowMultipleSelection && operation.files && operation.files.length > 1) {
            return { valid: false, error: 'Multiple file selection not allowed' };
          }
          break;

        case 'replace':
          if (!this.config.rules.allowReplace) {
            return { valid: false, error: 'Replace operation not allowed' };
          }
          break;

        case 'reorder':
          if (!this.config.rules.allowReorder) {
            return { valid: false, error: 'Reorder operation not allowed' };
          }
          break;
      }

      // Check attachment limits
      const totalAttachments = existingAttachments.length;
      if (operation.type === 'add' && totalAttachments >= this.config.rules.maxAttachments) {
        return { 
          valid: false, 
          error: `Maximum attachments limit reached (${this.config.rules.maxAttachments})` 
        };
      }

      // Check file size limits
      if (operation.files) {
        for (const file of operation.files) {
          if (file.size > this.config.rules.maxFileSize) {
            return { 
              valid: false, 
              error: `File "${file.name}" exceeds maximum size limit (${this.formatFileSize(this.config.rules.maxFileSize)})` 
            };
          }

          // Check file type
          const isAllowedType = this.config.rules.allowedTypes.some(type => {
            if (type.endsWith('/*')) {
              const baseType = type.slice(0, -2);
              return file.type.startsWith(baseType);
            }
            return file.type === type;
          });

          if (!isAllowedType) {
            return { 
              valid: false, 
              error: `File type "${file.type}" not allowed. Allowed types: ${this.config.rules.allowedTypes.join(', ')}` 
            };
          }
        }
      }

      // Check total size limit
      const existingSize = existingAttachments.reduce((sum, att) => sum + att.size, 0);
      const newSize = operation.files ? operation.files.reduce((sum, file) => sum + file.size, 0) : 0;
      const totalSize = existingSize + newSize;

      if (totalSize > this.config.rules.maxTotalSize) {
        return { 
          valid: false, 
          error: `Total size would exceed limit (${this.formatFileSize(this.config.rules.maxTotalSize)})` 
        };
      }

      // Add warnings for large files
      if (operation.files) {
        for (const file of operation.files) {
          if (file.size > this.config.rules.maxFileSize * 0.8) {
            warnings.push(`File "${file.name}" is large (${this.formatFileSize(file.size)})`);
          }
        }
      }

      logger.debug('Attachment operation validation completed', {
        service: 'MediaBusinessService',
        method: 'validateAttachmentOperation',
        valid: true,
        warningCount: warnings.length
      });

      return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      logger.error('Attachment operation validation failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'MediaBusinessService',
        method: 'validateAttachmentOperation',
        operationId: operation.id,
        error: errorMessage
      });

      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Process attachment operations with business logic
   */
  public async processAttachmentOperations(
    operations: AttachmentOperation[],
    existingAttachments: GenericAttachment[] = []
  ): Promise<SelectiveUpdateResult<GenericAttachment[]>> {
    try {
      logger.info('Processing attachment operations with business logic', {
        service: 'MediaBusinessService',
        method: 'processAttachmentOperations',
        operationCount: operations.length,
        existingAttachmentCount: existingAttachments.length
      });

      const errors: string[] = [];
      const warnings: string[] = [];
      const processedAttachments = [...existingAttachments];
      const addedAttachments: GenericAttachment[] = [];
      const removedAttachments: GenericAttachment[] = [];
      const reorderedAttachments: GenericAttachment[] = [];

      // Validate all operations first
      for (const operation of operations) {
        const validation = this.validateAttachmentOperation(operation, processedAttachments);
        if (!validation.valid) {
          errors.push(`Operation ${operation.id}: ${validation.error}`);
          continue;
        }
        if (validation.warnings) {
          warnings.push(...validation.warnings);
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          content: processedAttachments,
          attachments: processedAttachments,
          operations,
          addedAttachments: [],
          removedAttachments: [],
          reorderedAttachments: [],
          error: errors.join('; '),
          warnings
        };
      }

      // Process operations
      for (const operation of operations) {
        try {
          switch (operation.type) {
            case 'add':
              if (operation.files) {
                // Validate files
                const validation = await genericMediaService.validateFilesForSelectiveOperations(
                  operation.files,
                  processedAttachments
                );

                if (!validation.valid) {
                  errors.push(`Add operation failed: ${validation.errors.join(', ')}`);
                  continue;
                }

                // Add valid attachments
                for (const attachment of validation.validAttachments) {
                  processedAttachments.push(attachment);
                  addedAttachments.push(attachment);
                  
                  if (this.config.trackLifecycle) {
                    this.trackLifecycleEvent('created', attachment.id);
                  }
                }
              }
              break;

            case 'remove':
              if (operation.attachmentId) {
                const index = processedAttachments.findIndex(att => att.id === operation.attachmentId);
                if (index !== -1) {
                  const removedAttachment = processedAttachments.splice(index, 1)[0];
                  removedAttachments.push(removedAttachment);
                  
                  if (this.config.trackLifecycle) {
                    this.trackLifecycleEvent('deleted', operation.attachmentId);
                  }
                }
              }
              break;

            case 'replace':
              if (operation.attachmentId && operation.files && operation.files.length > 0) {
                const index = processedAttachments.findIndex(att => att.id === operation.attachmentId);
                if (index !== -1) {
                  const oldAttachment = processedAttachments[index];
                  const validation = await genericMediaService.validateFilesForSelectiveOperations(
                    operation.files,
                    processedAttachments.filter(att => att.id !== operation.attachmentId)
                  );

                  if (!validation.valid) {
                    errors.push(`Replace operation failed: ${validation.errors.join(', ')}`);
                    continue;
                  }

                  const newAttachment = validation.validAttachments[0];
                  processedAttachments[index] = newAttachment;
                  removedAttachments.push(oldAttachment);
                  addedAttachments.push(newAttachment);
                  
                  if (this.config.trackLifecycle) {
                    this.trackLifecycleEvent('updated', operation.attachmentId);
                  }
                }
              }
              break;

            case 'reorder':
              if (operation.fromIndex !== undefined && operation.toIndex !== undefined) {
                const [movedAttachment] = processedAttachments.splice(operation.fromIndex, 1);
                processedAttachments.splice(operation.toIndex, 0, movedAttachment);
                reorderedAttachments.push(movedAttachment);
                
                if (this.config.trackLifecycle) {
                  this.trackLifecycleEvent('reordered', movedAttachment.id);
                }
              }
              break;

            case 'update':
              if (operation.attachmentId && operation.metadata) {
                const index = processedAttachments.findIndex(att => att.id === operation.attachmentId);
                if (index !== -1) {
                  processedAttachments[index] = {
                    ...processedAttachments[index],
                    metadata: {
                      ...processedAttachments[index].metadata,
                      ...operation.metadata
                    },
                    updatedAt: Date.now()
                  };
                  
                  if (this.config.trackLifecycle) {
                    this.trackLifecycleEvent('updated', operation.attachmentId);
                  }
                }
              }
              break;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown operation error';
          errors.push(`Operation ${operation.id}: ${errorMessage}`);
        }
      }

      const success = errors.length === 0;

      logger.info('Attachment operations processed with business logic', {
        service: 'MediaBusinessService',
        method: 'processAttachmentOperations',
        success,
        processedCount: processedAttachments.length,
        addedCount: addedAttachments.length,
        removedCount: removedAttachments.length,
        reorderedCount: reorderedAttachments.length,
        errorCount: errors.length
      });

      return {
        success,
        content: processedAttachments,
        attachments: processedAttachments,
        operations,
        addedAttachments,
        removedAttachments,
        reorderedAttachments,
        error: errors.length > 0 ? errors.join('; ') : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      logger.error('Failed to process attachment operations with business logic', error instanceof Error ? error : new Error(errorMessage), {
        service: 'MediaBusinessService',
        method: 'processAttachmentOperations',
        error: errorMessage
      });

      return {
        success: false,
        content: existingAttachments,
        attachments: existingAttachments,
        operations,
        addedAttachments: [],
        removedAttachments: [],
        reorderedAttachments: [],
        error: errorMessage
      };
    }
  }

  /**
   * Get business rules configuration
   */
  public getBusinessRules(): MediaBusinessRules {
    return { ...this.config.rules };
  }

  /**
   * Update business rules
   */
  public updateBusinessRules(rules: Partial<MediaBusinessRules>): void {
    this.config.rules = { ...this.config.rules, ...rules };
    
    logger.info('Business rules updated', {
      service: 'MediaBusinessService',
      method: 'updateBusinessRules',
      rules: this.config.rules
    });
  }

  /**
   * Get lifecycle events
   */
  public getLifecycleEvents(): AttachmentLifecycleEvent[] {
    return [...this.lifecycleEvents];
  }

  /**
   * Clear lifecycle events
   */
  public clearLifecycleEvents(): void {
    this.lifecycleEvents = [];
  }

  /**
   * Track lifecycle event
   */
  private trackLifecycleEvent(type: AttachmentLifecycleEvent['type'], attachmentId: string, metadata?: Record<string, unknown>): void {
    if (!this.config.trackLifecycle) return;

    const event: AttachmentLifecycleEvent = {
      type,
      attachmentId,
      timestamp: Date.now(),
      metadata
    };

    this.lifecycleEvents.push(event);

    logger.debug('Lifecycle event tracked', {
      service: 'MediaBusinessService',
      method: 'trackLifecycleEvent',
      eventType: type,
      attachmentId
    });
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Create attachment operation with business validation
   */
  public createAttachmentOperation(
    type: AttachmentOperationType,
    attachmentId?: string,
    files?: File[],
    fromIndex?: number,
    toIndex?: number
  ): AttachmentOperation {
    const operation = genericMediaService.createAttachmentOperation(
      type,
      attachmentId,
      files,
      fromIndex,
      toIndex
    );

    // Validate against business rules
    const validation = this.validateAttachmentOperation(operation);
    if (!validation.valid) {
      throw new AppError(
        `Invalid attachment operation: ${validation.error}`,
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM
      );
    }

    return operation;
  }

  /**
   * Get attachment manager configuration
   */
  public getAttachmentManagerConfig(): AttachmentManagerConfig {
    return {
      maxAttachments: this.config.rules.maxAttachments,
      maxFileSize: this.config.rules.maxFileSize,
      maxTotalSize: this.config.rules.maxTotalSize,
      supportedTypes: this.config.rules.allowedTypes,
      allowReorder: this.config.rules.allowReorder,
      allowReplace: this.config.rules.allowReplace,
      allowMultipleSelection: this.config.rules.allowMultipleSelection,
      autoUpload: this.config.autoUpload,
      validateOnAdd: this.config.validateOnAdd,
      showPreview: true,
      showMetadata: true
    };
  }

  /**
   * Apply selective operations to existing attachments
   */
  public async applySelectiveOperations(
    operations: AttachmentOperation[],
    existingAttachments: GenericAttachment[],
    signer?: NostrSigner
  ): Promise<SelectiveUpdateResult<GenericAttachment[]>> {
    try {
      logger.info('Applying selective operations', {
        service: 'MediaBusinessService',
        method: 'applySelectiveOperations',
        operationCount: operations.length,
        existingAttachmentCount: existingAttachments.length
      });

      // Process operations using GenericMediaService
      const result = await genericMediaService.processAttachmentOperations(
        operations,
        existingAttachments
      );

      if (result.success) {
        // Upload new files using GenericBlossomService
        if (!signer) {
          return {
            success: false,
            content: existingAttachments,
            attachments: existingAttachments,
            operations: operations,
            addedAttachments: [],
            removedAttachments: [],
            reorderedAttachments: [],
            error: 'Signer is required for file uploads'
          };
        }

        const uploadResult = await blossomService.processSelectiveOperations(
          operations,
          result.processedAttachments,
          signer,
          undefined  // onProgress - not needed for this operation
        );

        if (uploadResult.success) {
          return {
            success: true,
            content: uploadResult.processedAttachments,
            attachments: uploadResult.processedAttachments,
            operations: operations,
            addedAttachments: uploadResult.processedAttachments.filter(att => 
              operations.some(op => op.type === 'add' && op.files?.some(f => f.name === att.name))
            ),
            removedAttachments: uploadResult.processedAttachments.filter(att => 
              operations.some(op => op.type === 'remove' && op.attachmentId === att.id)
            ),
            reorderedAttachments: uploadResult.processedAttachments.filter(att => 
              operations.some(op => op.type === 'reorder' && op.attachmentId === att.id)
            )
          };
        } else {
          return {
            success: false,
            content: existingAttachments,
            attachments: existingAttachments,
            operations: operations,
            addedAttachments: [],
            removedAttachments: [],
            reorderedAttachments: [],
            error: uploadResult.errors.join(', ')
          };
        }
      } else {
        return {
          success: false,
          content: existingAttachments,
          attachments: existingAttachments,
          operations: operations,
          addedAttachments: [],
          removedAttachments: [],
          reorderedAttachments: [],
          error: result.errors.join(', ')
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to apply selective operations', error instanceof Error ? error : new Error(errorMessage), {
        service: 'MediaBusinessService',
        method: 'applySelectiveOperations',
        operationCount: operations.length
      });

      return {
        success: false,
        content: existingAttachments,
        attachments: existingAttachments,
        operations: operations,
        addedAttachments: [],
        removedAttachments: [],
        reorderedAttachments: [],
        error: errorMessage
      };
    }
  }
}

// Export singleton instance
export const mediaBusinessService = MediaBusinessService.getInstance();

// Export convenience functions
export const validateAttachmentOperation = (
  operation: AttachmentOperation,
  existingAttachments: GenericAttachment[] = []
) => mediaBusinessService.validateAttachmentOperation(operation, existingAttachments);

export const processAttachmentOperations = (
  operations: AttachmentOperation[],
  existingAttachments: GenericAttachment[] = []
) => mediaBusinessService.processAttachmentOperations(operations, existingAttachments);

export const createAttachmentOperation = (
  type: AttachmentOperationType,
  attachmentId?: string,
  files?: File[],
  fromIndex?: number,
  toIndex?: number
) => mediaBusinessService.createAttachmentOperation(type, attachmentId, files, fromIndex, toIndex);

export default MediaBusinessService;
