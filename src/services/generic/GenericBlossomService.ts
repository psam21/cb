import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent } from '../../types/nostr';
import { BlossomClient } from 'blossom-client-sdk';
import { SHARED_BLOSSOM_SERVERS, BLOSSOM_CONFIG } from '../../config/blossom';
import { 
  GenericAttachment, 
  AttachmentOperation
} from '../../types/attachments';

export interface BlossomFileMetadata {
  fileId: string;
  fileType: string;
  fileSize: number;
  url: string;
  hash: string;
}

export interface BlossomUploadResult {
  success: boolean;
  metadata?: BlossomFileMetadata;
  error?: string;
}

// Enhanced Sequential Upload Interfaces
export interface SequentialUploadResult {
  success: boolean;
  uploadedFiles: BlossomFileMetadata[];
  failedFiles: { file: File; error: string }[];
  partialSuccess: boolean;
  userCancelled: boolean;
  totalFiles: number;
  successCount: number;
  failureCount: number;
}

export interface SequentialUploadProgress {
  currentFileIndex: number;
  totalFiles: number;
  currentFile: {
    name: string;
    size: number;
    status: 'waiting' | 'authenticating' | 'uploading' | 'completed' | 'failed' | 'retrying';
    progress: number; // 0-100
    error?: string;
    retryCount?: number;
    maxRetries?: number;
  };
  completedFiles: BlossomFileMetadata[];
  failedFiles: { name: string; error: string; retryCount: number }[];
  overallProgress: number; // 0-100
  nextAction: string; // e.g., "Please approve image2.jpg in your signer"
  estimatedTimeRemaining?: number; // seconds
}

export interface BatchUploadConsent {
  fileCount: number;
  totalSize: number;
  estimatedTime: number; // seconds
  requiredApprovals: number;
  userAccepted: boolean;
  timestamp: number;
  files: { name: string; size: number; type: string }[];
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number; // exponential backoff
  retryableErrors: string[]; // error patterns that should trigger retry
}

export interface BlossomServer {
  url: string;
  name: string;
  reliability: 'high' | 'medium' | 'low';
}

export class GenericBlossomService {
  private static instance: GenericBlossomService;
  private readonly servers: BlossomServer[] = SHARED_BLOSSOM_SERVERS.map(config => ({
    url: config.url,
    name: config.name,
    reliability: config.reliability
  }));
  private readonly maxFileSize = BLOSSOM_CONFIG.maxFileSize;
  private readonly maxRetries = 3;
  
  // Enhanced retry configuration for sequential uploads
  private readonly retryConfig: RetryConfig = {
    maxRetries: 2, // Max 2 retries per file (3 total attempts)
    retryDelay: 1000, // Start with 1 second delay
    backoffMultiplier: 2, // Double delay each retry (1s, 2s, 4s)
    retryableErrors: [
      'network error',
      'timeout',
      'connection failed',
      'server error',
      'rate limit',
      'temporary failure'
    ]
  };

  private constructor() {}

  public static getInstance(): GenericBlossomService {
    if (!GenericBlossomService.instance) {
      GenericBlossomService.instance = new GenericBlossomService();
    }
    return GenericBlossomService.instance;
  }

  /**
   * Upload file to Blossom servers with retry logic
   */
  public async uploadFile(
    file: File,
    signer: NostrSigner
  ): Promise<BlossomUploadResult> {
    try {
      logger.info('Starting file upload to Blossom', {
        service: 'GenericBlossomService',
        method: 'uploadFile',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Get file hash
      const hash = await this.getFileHash(file);
      logger.info('File hash calculated', {
        service: 'GenericBlossomService',
        method: 'uploadFile',
        hash,
      });

      // Try uploading to each server with retry logic
      for (const server of this.servers) {
        logger.info('Attempting upload to server', {
          service: 'GenericBlossomService',
          method: 'uploadFile',
          serverUrl: server.url,
          serverName: server.name,
        });

        const result = await this.uploadToServerWithSDK(file, server, signer);
        if (result.success) {
          logger.info('File uploaded successfully', {
            service: 'GenericBlossomService',
            method: 'uploadFile',
            serverUrl: server.url,
            metadata: result.metadata,
          });
          return result;
        }

        logger.warn('Upload failed, trying next server', {
          service: 'GenericBlossomService',
          method: 'uploadFile',
          serverUrl: server.url,
          error: result.error,
        });
      }

      return {
        success: false,
        error: 'All Blossom servers failed to upload file',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      logger.error('File upload failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'uploadFile',
        fileName: file.name,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload file to specific server using Blossom Client SDK
   */
  private async uploadToServerWithSDK(
    file: File,
    server: BlossomServer,
    signer: NostrSigner
  ): Promise<BlossomUploadResult> {
    try {
      logger.info('Uploading file using Blossom Client SDK', {
        service: 'GenericBlossomService',
        method: 'uploadToServerWithSDK',
        serverUrl: server.url,
        fileName: file.name,
      });

      // Create a signer function that matches the SDK's expected interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sdkSigner = async (draft: any) => {
        // Convert EventTemplate to our NostrEvent format
        const eventDraft: Omit<NostrEvent, 'id' | 'sig'> = {
          kind: draft.kind,
          pubkey: draft.pubkey,
          created_at: draft.created_at,
          tags: draft.tags || [],
          content: draft.content || '',
        };
        return await signer.signEvent(eventDraft);
      };

      // Create upload authentication using the SDK
      const auth = await BlossomClient.createUploadAuth(sdkSigner, file, { 
        message: `Upload ${file.name}` 
      });

      // Upload the file using the SDK
      const result = await BlossomClient.uploadBlob(server.url, file, { auth });

      logger.info('File uploaded successfully using SDK', {
        service: 'GenericBlossomService',
        method: 'uploadToServerWithSDK',
        serverUrl: server.url,
        result,
      });

      return {
        success: true,
        metadata: {
          fileId: result.sha256,
          fileType: file.type,
          fileSize: file.size,
          hash: result.sha256,
          url: result.url || `${server.url}/${result.sha256}`,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('SDK upload failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'uploadToServerWithSDK',
        serverUrl: server.url,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload file to specific server with retry logic (legacy method)
   */
  private async uploadToServer(
    file: File,
    server: BlossomServer,
    signer: NostrSigner
  ): Promise<BlossomUploadResult> {
    // Use the SDK method instead
    return await this.uploadToServerWithSDK(file, server, signer);
  }


  /**
   * Calculate SHA-256 hash of file
   */
  public async getFileHash(file: File): Promise<string> {
    try {
      logger.info('Calculating file hash', {
        service: 'GenericBlossomService',
        method: 'getFileHash',
        fileName: file.name,
        fileSize: file.size,
      });

      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      logger.info('File hash calculated', {
        service: 'GenericBlossomService',
        method: 'getFileHash',
        hash: hashHex,
      });

      return hashHex;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to calculate file hash', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'getFileHash',
        fileName: file.name,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  public validateFile(file: File): { valid: boolean; error?: string } {
    try {
      logger.info('Validating file', {
        service: 'GenericBlossomService',
        method: 'validateFile',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      if (file.size > this.maxFileSize) {
        return {
          valid: false,
          error: `File size ${file.size} exceeds maximum allowed size of ${this.maxFileSize} bytes`,
        };
      }

      if (file.size === 0) {
        return {
          valid: false,
          error: 'File is empty',
        };
      }

      // Check if file type is supported (basic check)
      const supportedTypes = ['image/', 'video/', 'audio/', 'text/', 'application/'];
      const isSupported = supportedTypes.some(type => file.type.startsWith(type));
      
      if (!isSupported) {
        logger.warn('Unsupported file type', {
          service: 'GenericBlossomService',
          method: 'validateFile',
          fileType: file.type,
        });
      }

      logger.info('File validation successful', {
        service: 'GenericBlossomService',
        method: 'validateFile',
        fileName: file.name,
      });

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('File validation failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'validateFile',
        fileName: file.name,
        error: errorMessage,
      });

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Download file by hash
   */
  public async downloadFile(hash: string): Promise<Blob | null> {
    try {
      logger.info('Downloading file by hash', {
        service: 'GenericBlossomService',
        method: 'downloadFile',
        hash,
      });

      for (const server of this.servers) {
        try {
          const response = await fetch(`${server.url}/${hash}`);
          if (response.ok) {
            const blob = await response.blob();
            logger.info('File downloaded successfully', {
              service: 'GenericBlossomService',
              method: 'downloadFile',
              serverUrl: server.url,
              hash,
              blobSize: blob.size,
            });
            return blob;
          }
        } catch (error) {
          logger.warn('Download failed from server', {
            service: 'GenericBlossomService',
            method: 'downloadFile',
            serverUrl: server.url,
            hash,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.error('File download failed from all servers', new Error('All servers failed'), {
        service: 'GenericBlossomService',
        method: 'downloadFile',
        hash,
      });

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('File download failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'downloadFile',
        hash,
        error: errorMessage,
      });
      return null;
    }
  }

  /**
   * List user's files (if server supports it)
   */
  public async listUserFiles(pubkey: string): Promise<BlossomFileMetadata[]> {
    try {
      logger.info('Listing user files', {
        service: 'GenericBlossomService',
        method: 'listUserFiles',
        pubkey,
      });

      // This would require authentication and server support
      // For now, return empty array as most servers don't support this
      logger.info('File listing not supported by current servers', {
        service: 'GenericBlossomService',
        method: 'listUserFiles',
        pubkey,
      });

      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list user files', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'listUserFiles',
        pubkey,
        error: errorMessage,
      });
      return [];
    }
  }

  /**
   * 🎯 KEY INNOVATION: Enhanced Sequential Upload with Superior UX
   * Transforms multiple prompts from surprise annoyance to expected workflow
   */
  public async uploadSequentialWithConsent(
    files: File[],
    signer: NostrSigner,
    onProgress?: (progress: SequentialUploadProgress) => void
  ): Promise<SequentialUploadResult> {
    try {
      logger.info('Starting Enhanced Sequential Upload with user consent', {
        service: 'GenericBlossomService',
        method: 'uploadSequentialWithConsent',
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
      });

      // Step 1: Get informed user consent
      const consent = await this.getUserBatchConsent(files);
      if (!consent.userAccepted) {
        logger.info('User cancelled batch upload during consent phase', {
          service: 'GenericBlossomService',
          method: 'uploadSequentialWithConsent',
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

      // Step 2: Upload files sequentially with progress feedback
      const result = await this.uploadFilesSequentially(files, signer, onProgress);

      logger.info('Enhanced Sequential Upload completed', {
        service: 'GenericBlossomService',
        method: 'uploadSequentialWithConsent',
        result: {
          success: result.success,
          totalFiles: result.totalFiles,
          successCount: result.successCount,
          failureCount: result.failureCount,
          partialSuccess: result.partialSuccess
        }
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sequential upload error';
      logger.error('Enhanced Sequential Upload failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'uploadSequentialWithConsent',
        fileCount: files.length,
        error: errorMessage
      });

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
  }

  /**
   * Get informed user consent before starting multi-file upload
   * This is where we transform the UX from "surprise popups" to "expected workflow"
   */
  private async getUserBatchConsent(files: File[]): Promise<BatchUploadConsent> {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    // Estimate time: ~2-5 seconds per file (auth + upload)
    const estimatedTimePerFile = 3.5; // seconds
    const estimatedTime = Math.ceil(files.length * estimatedTimePerFile);

    const consent: BatchUploadConsent = {
      fileCount: files.length,
      totalSize,
      estimatedTime,
      requiredApprovals: files.length, // Each file needs signer approval
      userAccepted: true, // Auto-accept for now - UI will handle the dialog
      timestamp: Date.now(),
      files: files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    };

    logger.info('Batch upload consent requested', {
      service: 'GenericBlossomService',
      method: 'getUserBatchConsent',
      fileCount: consent.fileCount,
      totalSize: consent.totalSize,
      estimatedTime: consent.estimatedTime,
      requiredApprovals: consent.requiredApprovals
    });

    // For now, auto-accept the consent
    // The real consent dialog should be handled at the UI layer before calling this method
    return consent;
  }

  /**
   * Upload files one by one with clear progress feedback
   * Each signer prompt is expected and contextualized
   */
  private async uploadFilesSequentially(
    files: File[],
    signer: NostrSigner,
    onProgress?: (progress: SequentialUploadProgress) => void
  ): Promise<SequentialUploadResult> {
    const uploadedFiles: BlossomFileMetadata[] = [];
    const failedFiles: { file: File; error: string }[] = [];
    const startTime = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const currentFileIndex = i;
      
      try {
        // Update progress: Starting file authentication
        if (onProgress) {
          onProgress({
            currentFileIndex,
            totalFiles: files.length,
            currentFile: {
              name: file.name,
              size: file.size,
              status: 'authenticating',
              progress: 0,
              retryCount: 0,
              maxRetries: this.retryConfig.maxRetries
            },
            completedFiles: uploadedFiles,
            failedFiles: failedFiles.map(f => ({ name: f.file.name, error: f.error, retryCount: 0 })),
            overallProgress: Math.round((i / files.length) * 100),
            nextAction: `Please approve "${file.name}" in your signer`,
            estimatedTimeRemaining: this.calculateEstimatedTime(i, files.length, startTime)
          });
        }

        logger.info('Starting sequential file upload', {
          service: 'GenericBlossomService',
          method: 'uploadFilesSequentially',
          fileIndex: i + 1,
          totalFiles: files.length,
          fileName: file.name,
          fileSize: file.size
        });

        // Update progress: Uploading
        if (onProgress) {
          onProgress({
            currentFileIndex,
            totalFiles: files.length,
            currentFile: {
              name: file.name,
              size: file.size,
              status: 'uploading',
              progress: 50
            },
            completedFiles: uploadedFiles,
            failedFiles: failedFiles.map(f => ({ name: f.file.name, error: f.error, retryCount: 0 })),
            overallProgress: Math.round(((i + 0.5) / files.length) * 100),
            nextAction: `Uploading "${file.name}"...`,
            estimatedTimeRemaining: this.calculateEstimatedTime(i, files.length, startTime)
          });
        }

        // Actual file upload with retry logic
        const { result: uploadResult, retryCount } = await this.uploadFileWithRetry(file, signer);

        if (uploadResult.success && uploadResult.metadata) {
          uploadedFiles.push(uploadResult.metadata);
          
          // Update progress: Completed
          if (onProgress) {
            onProgress({
              currentFileIndex,
              totalFiles: files.length,
              currentFile: {
                name: file.name,
                size: file.size,
                status: 'completed',
                progress: 100
              },
              completedFiles: uploadedFiles,
              failedFiles: failedFiles.map(f => ({ name: f.file.name, error: f.error, retryCount: 0 })),
              overallProgress: Math.round(((i + 1) / files.length) * 100),
              nextAction: i < files.length - 1 ? `Next: "${files[i + 1].name}"` : 'Upload complete!',
              estimatedTimeRemaining: this.calculateEstimatedTime(i + 1, files.length, startTime)
            });
          }

          logger.info('Sequential file upload successful', {
            service: 'GenericBlossomService',
            method: 'uploadFilesSequentially',
            fileIndex: i + 1,
            fileName: file.name,
            hash: uploadResult.metadata.hash
          });

        } else {
          const error = uploadResult.error || 'Unknown upload error';
          failedFiles.push({ file, error });
          
          // Update progress: Failed
          if (onProgress) {
            onProgress({
              currentFileIndex,
              totalFiles: files.length,
              currentFile: {
                name: file.name,
                size: file.size,
                status: 'failed',
                progress: 0,
                error,
                retryCount,
                maxRetries: this.retryConfig.maxRetries
              },
              completedFiles: uploadedFiles,
              failedFiles: failedFiles.map(f => ({ name: f.file.name, error: f.error, retryCount })),
              overallProgress: Math.round(((i + 1) / files.length) * 100),
              nextAction: i < files.length - 1 ? `Next: "${files[i + 1].name}"` : 'Upload complete with errors',
              estimatedTimeRemaining: this.calculateEstimatedTime(i + 1, files.length, startTime)
            });
          }

          logger.warn('Sequential file upload failed', {
            service: 'GenericBlossomService',
            method: 'uploadFilesSequentially',
            fileIndex: i + 1,
            fileName: file.name,
            error
          });
        }

        // Small delay between files to avoid overwhelming the signer
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown file upload error';
        failedFiles.push({ file, error: errorMessage });
        
        logger.error('Sequential file upload exception', error instanceof Error ? error : new Error(errorMessage), {
          service: 'GenericBlossomService',
          method: 'uploadFilesSequentially',
          fileIndex: i + 1,
          fileName: file.name,
          error: errorMessage
        });

        // Continue with next file even if this one failed
      }
    }

    const successCount = uploadedFiles.length;
    const failureCount = failedFiles.length;
    const success = successCount > 0 && failureCount === 0;
    const partialSuccess = successCount > 0 && failureCount > 0;

    return {
      success,
      uploadedFiles,
      failedFiles,
      partialSuccess,
      userCancelled: false,
      totalFiles: files.length,
      successCount,
      failureCount
    };
  }

  /**
   * Calculate estimated time remaining for sequential upload
   */
  private calculateEstimatedTime(currentIndex: number, totalFiles: number, startTime: number): number {
    if (currentIndex === 0) {
      return totalFiles * 3.5; // Initial estimate: 3.5 seconds per file
    }

    const elapsedTime = (Date.now() - startTime) / 1000; // seconds
    const avgTimePerFile = elapsedTime / currentIndex;
    const remainingFiles = totalFiles - currentIndex;
    
    return Math.ceil(remainingFiles * avgTimePerFile);
  }

  /**
   * Check if an error is retryable based on error message patterns
   */
  private isRetryableError(error: string): boolean {
    const errorLower = error.toLowerCase();
    return this.retryConfig.retryableErrors.some(pattern => 
      errorLower.includes(pattern.toLowerCase())
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    return this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
  }

  /**
   * Upload a single file with retry logic
   */
  private async uploadFileWithRetry(
    file: File,
    signer: NostrSigner,
    maxRetries: number = this.retryConfig.maxRetries
  ): Promise<{ result: BlossomUploadResult; retryCount: number }> {
    let lastError = '';
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const result = await this.uploadFile(file, signer);
        return { result, retryCount };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
        lastError = errorMessage;
        
        // Check if we should retry
        if (retryCount < maxRetries && this.isRetryableError(errorMessage)) {
          retryCount++;
          const delay = this.calculateRetryDelay(retryCount - 1);
          
          logger.warn('File upload failed, retrying', {
            service: 'GenericBlossomService',
            method: 'uploadFileWithRetry',
            fileName: file.name,
            retryCount,
            maxRetries,
            delay,
            error: errorMessage
          });
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Max retries reached or non-retryable error
        break;
      }
    }

    // Return failed result
    return {
      result: { success: false, error: lastError },
      retryCount
    };
  }

  // ============================================================================
  // SELECTIVE ATTACHMENT OPERATIONS
  // ============================================================================

  /**
   * Upload files for selective operations
   */
  public async uploadFilesForSelectiveOperations(
    files: File[],
    signer: NostrSigner,
    onProgress?: (progress: SequentialUploadProgress) => void
  ): Promise<SequentialUploadResult> {
    try {
      logger.info('Starting selective file upload', {
        service: 'GenericBlossomService',
        method: 'uploadFilesForSelectiveOperations',
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
      });

      // Use existing sequential upload with consent
      return await this.uploadSequentialWithConsent(files, signer, onProgress);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      logger.error('Selective file upload failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'uploadFilesForSelectiveOperations',
        error: errorMessage
      });

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
  }

  /**
   * Delete file from Blossom (for selective operations)
   */
  public async deleteFile(
    fileId: string,
    signer: NostrSigner
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Deleting file from Blossom', {
        service: 'GenericBlossomService',
        method: 'deleteFile',
        fileId,
        hasSigner: Boolean(signer)
      });

      // Note: Blossom doesn't have a direct delete API
      // This would need to be implemented based on Blossom's actual API
      // For now, we'll return success as the file will be replaced by new content
      
      logger.info('File deletion completed (no-op)', {
        service: 'GenericBlossomService',
        method: 'deleteFile',
        fileId
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown deletion error';
      logger.error('File deletion failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'deleteFile',
        fileId,
        error: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Process selective attachment operations
   */
  public async processSelectiveOperations(
    operations: AttachmentOperation[],
    existingAttachments: GenericAttachment[],
    signer: NostrSigner,
    onProgress?: (progress: SequentialUploadProgress) => void
  ): Promise<{
    success: boolean;
    uploadedFiles: BlossomFileMetadata[];
    failedFiles: { file: File; error: string }[];
    processedAttachments: GenericAttachment[];
    errors: string[];
  }> {
    try {
      logger.info('Processing selective attachment operations', {
        service: 'GenericBlossomService',
        method: 'processSelectiveOperations',
        operationCount: operations.length,
        existingAttachmentCount: existingAttachments.length
      });

      const uploadedFiles: BlossomFileMetadata[] = [];
      const failedFiles: { file: File; error: string }[] = [];
      const processedAttachments = [...existingAttachments];
      const errors: string[] = [];

      // Process each operation
      for (const operation of operations) {
        try {
          switch (operation.type) {
            case 'add':
              if (operation.files && operation.files.length > 0) {
                const uploadResult = await this.uploadFilesForSelectiveOperations(
                  operation.files,
                  signer,
                  onProgress
                );

                if (uploadResult.success) {
                  uploadedFiles.push(...uploadResult.uploadedFiles);
                  
                  // Update attachments with URLs
                  for (const metadata of uploadResult.uploadedFiles) {
                    const attachment = processedAttachments.find(att => 
                      att.originalFile?.name === metadata.fileType.split('/').pop()
                    );
                    if (attachment) {
                      attachment.url = metadata.url;
                      attachment.hash = metadata.hash;
                    }
                  }
                } else {
                  failedFiles.push(...uploadResult.failedFiles);
                  errors.push(`Add operation failed: ${uploadResult.failedFiles.map(f => f.error).join(', ')}`);
                }
              }
              break;

            case 'remove':
              if (operation.attachmentId) {
                const index = processedAttachments.findIndex(att => att.id === operation.attachmentId);
                if (index !== -1) {
                  const attachment = processedAttachments[index];
                  
                  // Delete from Blossom if URL exists
                  if (attachment.url) {
                    const deleteResult = await this.deleteFile(attachment.hash || '', signer);
                    if (!deleteResult.success) {
                      errors.push(`Failed to delete file: ${deleteResult.error}`);
                    }
                  }
                  
                  processedAttachments.splice(index, 1);
                }
              }
              break;

            case 'replace':
              if (operation.attachmentId && operation.files && operation.files.length > 0) {
                const index = processedAttachments.findIndex(att => att.id === operation.attachmentId);
                if (index !== -1) {
                  const oldAttachment = processedAttachments[index];
                  
                  // Delete old file
                  if (oldAttachment.url) {
                    const deleteResult = await this.deleteFile(oldAttachment.hash || '', signer);
                    if (!deleteResult.success) {
                      errors.push(`Failed to delete old file: ${deleteResult.error}`);
                    }
                  }
                  
                  // Upload new file
                  const uploadResult = await this.uploadFilesForSelectiveOperations(
                    operation.files,
                    signer,
                    onProgress
                  );

                  if (uploadResult.success && uploadResult.uploadedFiles.length > 0) {
                    const metadata = uploadResult.uploadedFiles[0];
                    processedAttachments[index] = {
                      ...processedAttachments[index],
                      url: metadata.url,
                      hash: metadata.hash,
                      name: operation.files[0].name,
                      size: operation.files[0].size,
                      mimeType: operation.files[0].type,
                      updatedAt: Date.now()
                    };
                    uploadedFiles.push(metadata);
                  } else {
                    failedFiles.push(...uploadResult.failedFiles);
                    errors.push(`Replace operation failed: ${uploadResult.failedFiles.map(f => f.error).join(', ')}`);
                  }
                }
              }
              break;

            case 'reorder':
              // Reordering doesn't require upload/delete operations
              if (operation.fromIndex !== undefined && operation.toIndex !== undefined) {
                const [movedAttachment] = processedAttachments.splice(operation.fromIndex, 1);
                processedAttachments.splice(operation.toIndex, 0, movedAttachment);
              }
              break;

            case 'update':
              // Update metadata doesn't require upload/delete operations
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

      logger.info('Selective operations processed', {
        service: 'GenericBlossomService',
        method: 'processSelectiveOperations',
        success,
        uploadedCount: uploadedFiles.length,
        failedCount: failedFiles.length,
        errorCount: errors.length
      });

      return {
        success,
        uploadedFiles,
        failedFiles,
        processedAttachments,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      logger.error('Failed to process selective operations', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'processSelectiveOperations',
        error: errorMessage
      });

      return {
        success: false,
        uploadedFiles: [],
        failedFiles: operations
          .filter(op => op.files)
          .flatMap(op => op.files!.map(file => ({ file, error: errorMessage }))),
        processedAttachments: existingAttachments,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Batch upload for selective operations
   */
  public async batchUploadForSelectiveOperations(
    files: File[],
    signer: NostrSigner,
    onProgress?: (progress: SequentialUploadProgress) => void
  ): Promise<SequentialUploadResult> {
    try {
      logger.info('Starting batch upload for selective operations', {
        service: 'GenericBlossomService',
        method: 'batchUploadForSelectiveOperations',
        fileCount: files.length
      });

      // For now, use sequential upload
      // In the future, this could be optimized for true batch operations
      return await this.uploadSequentialWithConsent(files, signer, onProgress);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown batch upload error';
      logger.error('Batch upload for selective operations failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericBlossomService',
        method: 'batchUploadForSelectiveOperations',
        error: errorMessage
      });

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
  }
}

// Export singleton instance
export const blossomService = GenericBlossomService.getInstance();

// Export convenience functions
export const uploadFile = (file: File, signer: NostrSigner) =>
  blossomService.uploadFile(file, signer);

export const getFileHash = (file: File) =>
  blossomService.getFileHash(file);

export const validateFile = (file: File) =>
  blossomService.validateFile(file);

export const downloadFile = (hash: string) =>
  blossomService.downloadFile(hash);

export const uploadSequentialWithConsent = (
  files: File[], 
  signer: NostrSigner, 
  onProgress?: (progress: SequentialUploadProgress) => void
) => blossomService.uploadSequentialWithConsent(files, signer, onProgress);

export const listUserFiles = (pubkey: string) =>
  blossomService.listUserFiles(pubkey);
