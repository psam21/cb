import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent } from '../../types/nostr';
import { BlossomClient } from 'blossom-client-sdk';

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

export interface BlossomServer {
  url: string;
  name: string;
  reliability: 'high' | 'medium' | 'low';
}

export class GenericBlossomService {
  private static instance: GenericBlossomService;
  private readonly servers: BlossomServer[] = [
    { url: 'https://blossom.nostr.build', name: 'Nostr.build Blossom', reliability: 'high' },
    { url: 'https://blosstr.com', name: 'Blosstr', reliability: 'high' },
  ];
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB
  private readonly maxRetries = 3;

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

export const listUserFiles = (pubkey: string) =>
  blossomService.listUserFiles(pubkey);
