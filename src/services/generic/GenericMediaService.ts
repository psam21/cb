/**
 * Generic Media Service for centralized media file operations
 * Handles validation, metadata extraction, and file organization following SOA patterns
 */

import { logger } from '../core/LoggingService';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
import { 
  MEDIA_CONFIG, 
  validateMediaFile, 
  validateBatchFiles as validateBatchFilesConfig, 
  getMediaTypeFromMime, 
  getMediaTypeFromExtension,
  formatFileSize,
  type FileValidationResult
} from '../../config/media';

export interface MediaMetadata {
  hash: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  dimensions?: { width: number; height: number };
  duration?: number; // for audio/video in seconds
  createdAt: number;
}

export interface MediaAttachment {
  id: string; // unique identifier
  hash: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  originalFile?: File; // Keep reference to original file for processing
  metadata?: MediaMetadata;
}

export interface MediaValidationResult {
  valid: boolean;
  validFiles: MediaAttachment[];
  invalidFiles: { file: File; error: string }[];
  totalSize: number;
  errors: string[];
  summary: {
    images: number;
    videos: number;
    audio: number;
    total: number;
  };
}

/**
 * Generic Media Service for centralized media operations
 * Follows SOA patterns - reusable across different domains
 */
export class GenericMediaService {
  private static instance: GenericMediaService;

  private constructor() {}

  /**
   * Get singleton instance of GenericMediaService
   */
  public static getInstance(): GenericMediaService {
    if (!GenericMediaService.instance) {
      GenericMediaService.instance = new GenericMediaService();
    }
    return GenericMediaService.instance;
  }

  /**
   * Validate a single media file
   */
  public async validateSingleFile(file: File): Promise<FileValidationResult> {
    try {
      logger.debug('Validating single media file', {
        service: 'GenericMediaService',
        method: 'validateSingleFile',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      });

      const result = validateMediaFile(file);
      
      if (!result.valid) {
        logger.warn('File validation failed', {
          service: 'GenericMediaService',
          method: 'validateSingleFile',
          fileName: file.name,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      logger.error('Error validating media file', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericMediaService',
        method: 'validateSingleFile',
        fileName: file.name,
        error: errorMessage
      });

      return {
        valid: false,
        error: `Validation failed: ${errorMessage}`,
        size: file.size
      };
    }
  }

  /**
   * Validate multiple media files for batch operations
   */
  public async validateBatchFiles(files: File[]): Promise<MediaValidationResult> {
    try {
      logger.info('Starting batch file validation', {
        service: 'GenericMediaService',
        method: 'validateBatchFiles',
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
      });

      // Use the config-based batch validation
      const configResult = validateBatchFilesConfig(files);
      
      // Create MediaAttachment objects for valid files
      const validAttachments: MediaAttachment[] = [];
      
      for (const file of configResult.validFiles) {
        try {
          const attachment = await this.createMediaAttachment(file);
          validAttachments.push(attachment);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create attachment';
          configResult.invalidFiles.push({ file, error: errorMessage });
          logger.warn('Failed to create media attachment', {
            service: 'GenericMediaService',
            method: 'validateBatchFiles',
            fileName: file.name,
            error: errorMessage
          });
        }
      }

      // Calculate summary by media type
      const summary = {
        images: validAttachments.filter(a => a.type === 'image').length,
        videos: validAttachments.filter(a => a.type === 'video').length,
        audio: validAttachments.filter(a => a.type === 'audio').length,
        total: validAttachments.length
      };

      const result: MediaValidationResult = {
        valid: configResult.valid && validAttachments.length > 0,
        validFiles: validAttachments,
        invalidFiles: configResult.invalidFiles,
        totalSize: configResult.totalSize,
        errors: configResult.errors,
        summary
      };

      logger.info('Batch file validation completed', {
        service: 'GenericMediaService',
        method: 'validateBatchFiles',
        result: {
          valid: result.valid,
          validCount: result.validFiles.length,
          invalidCount: result.invalidFiles.length,
          summary: result.summary,
          totalSize: formatFileSize(result.totalSize)
        }
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown batch validation error';
      logger.error('Error in batch file validation', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericMediaService',
        method: 'validateBatchFiles',
        fileCount: files.length,
        error: errorMessage
      });

      throw new AppError(
        'Batch file validation failed',
        ErrorCode.MEDIA_VALIDATION_FAILED,
        HttpStatus.BAD_REQUEST,
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM,
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Create a MediaAttachment object from a File
   */
  public async createMediaAttachment(file: File): Promise<MediaAttachment> {
    try {
      logger.debug('Creating media attachment', {
        service: 'GenericMediaService',
        method: 'createMediaAttachment',
        fileName: file.name,
        fileSize: file.size
      });

      // Generate unique ID
      const id = await this.generateFileId(file);
      
      // Get file hash
      const hash = await this.generateFileHash(file);
      
      // Determine media type
      const type = getMediaTypeFromMime(file.type) || getMediaTypeFromExtension(file.name);
      if (!type) {
        throw new AppError(
          `Unable to determine media type for file: ${file.name}`,
          ErrorCode.UNSUPPORTED_FILE_TYPE,
          HttpStatus.BAD_REQUEST,
          ErrorCategory.VALIDATION,
          ErrorSeverity.MEDIUM
        );
      }

      // Get file extension
      const extension = file.name.toLowerCase().split('.').pop() || '';

      // Create basic attachment
      const attachment: MediaAttachment = {
        id,
        hash,
        type,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        extension,
        originalFile: file
      };

      // Generate metadata
      try {
        attachment.metadata = await this.extractMediaMetadata(file, attachment);
      } catch (metadataError) {
        logger.warn('Failed to extract media metadata', {
          service: 'GenericMediaService',
          method: 'createMediaAttachment',
          fileName: file.name,
          error: metadataError instanceof Error ? metadataError.message : 'Unknown error'
        });
        // Continue without metadata - not critical for basic functionality
      }

      logger.debug('Media attachment created successfully', {
        service: 'GenericMediaService',
        method: 'createMediaAttachment',
        fileName: file.name,
        attachmentId: id,
        type,
        hash: hash.substring(0, 8) + '...'
      });

      return attachment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating attachment';
      logger.error('Failed to create media attachment', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericMediaService',
        method: 'createMediaAttachment',
        fileName: file.name,
        error: errorMessage
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `Failed to create media attachment: ${errorMessage}`,
        ErrorCode.ATTACHMENT_PROCESSING_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.HIGH,
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Generate a unique ID for a file based on its content and metadata
   */
  public async generateFileId(file: File): Promise<string> {
    try {
      // Create unique ID from filename, size, and timestamp
      const timestamp = Date.now();
      const data = `${file.name}-${file.size}-${file.lastModified || timestamp}-${timestamp}`;
      
      // Generate hash of the data
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Return first 16 characters for a reasonably unique ID
      return hashHex.substring(0, 16);
    } catch (error) {
      // Fallback to timestamp + random if crypto fails
      const fallbackId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      logger.warn('Failed to generate crypto-based file ID, using fallback', {
        service: 'GenericMediaService',
        method: 'generateFileId',
        fileName: file.name,
        fallbackId
      });
      return fallbackId;
    }
  }

  /**
   * Generate SHA-256 hash of file content
   */
  public async generateFileHash(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown hashing error';
      logger.error('Failed to generate file hash', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericMediaService',
        method: 'generateFileHash',
        fileName: file.name,
        error: errorMessage
      });

      throw new AppError(
        `Failed to generate file hash: ${errorMessage}`,
        ErrorCode.ATTACHMENT_PROCESSING_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.HIGH,
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Extract metadata from media files
   */
  private async extractMediaMetadata(file: File, attachment: MediaAttachment): Promise<MediaMetadata> {
    const metadata: MediaMetadata = {
      hash: attachment.hash,
      type: attachment.type,
      name: attachment.name,
      size: attachment.size,
      mimeType: attachment.mimeType,
      extension: attachment.extension,
      createdAt: Date.now()
    };

    try {
      if (attachment.type === 'image') {
        metadata.dimensions = await this.extractImageDimensions(file);
      } else if (attachment.type === 'video' || attachment.type === 'audio') {
        metadata.duration = await this.extractMediaDuration(file);
        if (attachment.type === 'video') {
          metadata.dimensions = await this.extractVideoDimensions(file);
        }
      }
    } catch (error) {
      logger.debug('Failed to extract additional metadata', {
        service: 'GenericMediaService',
        method: 'extractMediaMetadata',
        fileName: file.name,
        type: attachment.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw - basic metadata is sufficient
    }

    return metadata;
  }

  /**
   * Extract image dimensions
   */
  private async extractImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for dimension extraction'));
      };
      
      img.src = url;
    });
  }

  /**
   * Extract video dimensions (basic implementation)
   */
  private async extractVideoDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({ width: video.videoWidth, height: video.videoHeight });
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video for dimension extraction'));
      };
      
      video.src = url;
    });
  }

  /**
   * Extract media duration for audio/video
   */
  private async extractMediaDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const media = file.type.startsWith('video/') 
        ? document.createElement('video')
        : document.createElement('audio');
      
      const url = URL.createObjectURL(file);
      
      media.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(media.duration || 0);
      };
      
      media.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load media for duration extraction'));
      };
      
      media.src = url;
    });
  }

  /**
   * Sort attachments by type for organized display
   */
  public sortAttachmentsByType(attachments: MediaAttachment[]): MediaAttachment[] {
    return [...attachments].sort((a, b) => {
      // Sort order: images first, then videos, then audio
      const typeOrder = { image: 1, video: 2, audio: 3 };
      const orderDiff = typeOrder[a.type] - typeOrder[b.type];
      
      // If same type, sort by name
      if (orderDiff === 0) {
        return a.name.localeCompare(b.name);
      }
      
      return orderDiff;
    });
  }

  /**
   * Get configuration limits for display/validation
   */
  public getMediaLimits() {
    return {
      maxAttachments: MEDIA_CONFIG.maxAttachments,
      maxFileSize: MEDIA_CONFIG.maxFileSize,
      maxTotalSize: MEDIA_CONFIG.maxTotalSize,
      maxFileSizeFormatted: formatFileSize(MEDIA_CONFIG.maxFileSize),
      maxTotalSizeFormatted: formatFileSize(MEDIA_CONFIG.maxTotalSize)
    };
  }
}

// Export singleton instance
export const genericMediaService = GenericMediaService.getInstance();

// Export convenience functions
export const validateSingleFile = (file: File) => 
  genericMediaService.validateSingleFile(file);

export const validateBatchFiles = (files: File[]) => 
  genericMediaService.validateBatchFiles(files);

export const createMediaAttachment = (file: File) => 
  genericMediaService.createMediaAttachment(file);

export const generateFileHash = (file: File) => 
  genericMediaService.generateFileHash(file);

export const sortAttachmentsByType = (attachments: MediaAttachment[]) => 
  genericMediaService.sortAttachmentsByType(attachments);
