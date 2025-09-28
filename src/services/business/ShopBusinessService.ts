import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent } from '../../types/nostr';
import { blossomService, BlossomFileMetadata, uploadSequentialWithConsent, type SequentialUploadResult, type SequentialUploadProgress } from '../generic/GenericBlossomService';
import { validateBatchFiles, type MediaValidationResult } from '../generic/GenericMediaService';
import { nostrEventService, ProductEventData } from '../nostr/NostrEventService';
import { productStore } from '../../stores/ProductStore';
import { signEvent, createDeletionEvent } from '../generic/GenericEventService';
import { publishEvent, queryEvents } from '../generic/GenericRelayService';
import { constructUserBlossomUrl, getSharedBlossomUrl, BLOSSOM_CONFIG } from '../../config/blossom';
import { 
  AttachmentOperation, 
  AttachmentOperationType,
  AttachmentValidationResult
} from '../../types/attachments';
import { mediaBusinessService } from './MediaBusinessService';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
// eventLoggingService removed - now handled automatically in GenericRelayService

// Multiple attachment support interface
export interface ProductAttachment {
  id: string; // unique identifier for this attachment
  hash: string; // Blossom file hash
  url: string; // Full URL to the file
  type: 'image' | 'video' | 'audio';
  name: string; // Original filename
  size: number; // File size in bytes
  mimeType: string;
  metadata?: {
    dimensions?: { width: number; height: number };
    duration?: number; // for video/audio in seconds
  };
}

export interface ShopProduct {
  id: string;
  dTag: string; // NIP-33 d tag identifier for parameterized replaceable events
  title: string;
  description: string;
  price: number;
  currency: string;
  
  // Multiple attachments support (NEW)
  attachments: ProductAttachment[];
  
  // Legacy single image support (DEPRECATED - for backward compatibility)
  imageUrl?: string;
  imageHash?: string;
  
  tags: string[];
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  location: string;
  contact: string;
  publishedAt: number;
  eventId: string;
  publishedRelays: string[];
  author: string;
  isDeleted: boolean; // Track if this is a deleted product
  // Note: Removed revision tracking fields - Kind 30023 handles this automatically
}

export interface CreateProductResult {
  success: boolean;
  product?: ShopProduct;
  error?: string;
  eventId?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
}

export interface ShopPublishingProgress {
  step: 'uploading' | 'creating_event' | 'publishing' | 'complete';
  progress: number;
  message: string;
  details?: string;
  // Enhanced for multiple attachments
  attachmentProgress?: {
    currentFile: number;
    totalFiles: number;
    currentFileName: string;
    uploadedFiles: string[];
    failedFiles: string[];
  };
}

// New interfaces for multiple attachment support
export interface CreateProductWithAttachmentsResult extends CreateProductResult {
  attachmentResults?: {
    successful: ProductAttachment[];
    failed: { file: File; error: string }[];
    partialSuccess: boolean;
  };
}

export interface AttachmentBusinessRules {
  maxAttachments: number;
  maxTotalSize: number; // bytes
  allowedTypes: ('image' | 'video' | 'audio')[];
  requireAtLeastOneImage: boolean;
}

export class ShopBusinessService {
  private static instance: ShopBusinessService;

  // Business rules for attachments
  private readonly attachmentRules: AttachmentBusinessRules = {
    maxAttachments: 5,
    maxTotalSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['image', 'video', 'audio'],
    requireAtLeastOneImage: true // Business rule: products should have at least one image
  };

  private constructor() {}

  public static getInstance(): ShopBusinessService {
    if (!ShopBusinessService.instance) {
      ShopBusinessService.instance = new ShopBusinessService();
    }
    return ShopBusinessService.instance;
  }

  /**
   * Create a new product with image upload and event publishing
   */
  public async createProduct(
    productData: ProductEventData,
    imageFile: File | null,
    signer: NostrSigner,
    onProgress?: (progress: ShopPublishingProgress) => void
  ): Promise<CreateProductResult> {
    try {
      logger.info('Starting product creation', {
        service: 'ShopBusinessService',
        method: 'createProduct',
        title: productData.title,
        hasImage: !!imageFile,
      });

      let imageMetadata: BlossomFileMetadata | null = null;

      // Step 1: Upload image if provided
      if (imageFile) {
        onProgress?.({
          step: 'uploading',
          progress: 10,
          message: 'Uploading image to Blossom...',
          details: `Uploading ${imageFile.name} (${(imageFile.size / 1024 / 1024).toFixed(2)} MB)`,
        });

        logger.info('Uploading image to Blossom', {
          service: 'ShopBusinessService',
          method: 'createProduct',
          fileName: imageFile.name,
          fileSize: imageFile.size,
        });

        const uploadResult = await blossomService.uploadFile(imageFile, signer);
        if (!uploadResult.success) {
          return {
            success: false,
            error: `Image upload failed: ${uploadResult.error}`,
          };
        }

        imageMetadata = uploadResult.metadata!;
        productData.imageUrl = imageMetadata.url;
        productData.imageHash = imageMetadata.hash;
        productData.imageFile = imageFile;

        logger.info('Image uploaded successfully', {
          service: 'ShopBusinessService',
          method: 'createProduct',
          imageUrl: imageMetadata.url,
          imageHash: imageMetadata.hash,
        });
      }

      // Step 2: Create Nostr event
      onProgress?.({
        step: 'creating_event',
        progress: 50,
        message: 'Creating product event...',
        details: 'Signing event with your Nostr key',
      });

      logger.info('Creating product event', {
        service: 'ShopBusinessService',
        method: 'createProduct',
        title: productData.title,
        hasImage: !!imageMetadata,
      });

      const event = await nostrEventService.createProductEvent(productData, signer);

      // Step 3: Publish to relays
      onProgress?.({
        step: 'publishing',
        progress: 70,
        message: 'Publishing to Nostr relays...',
        details: 'Broadcasting to decentralized network',
      });

      logger.info('Publishing event to relays', {
        service: 'ShopBusinessService',
        method: 'createProduct',
        eventId: event.id,
        title: productData.title,
      });

      const publishResult = await nostrEventService.publishEvent(
        event,
        signer,
        (relay, status) => {
          logger.info('Relay publishing status', {
            service: 'ShopBusinessService',
            method: 'createProduct',
            relay,
            status,
            eventId: event.id,
          });
        }
      );

      // Event logging now handled automatically in GenericRelayService

      if (!publishResult.success) {
        return {
          success: false,
          error: `Failed to publish to any relay: ${publishResult.error}`,
          eventId: event.id,
          publishedRelays: publishResult.publishedRelays,
          failedRelays: publishResult.failedRelays,
        };
      }

      // Step 4: Create product object
      // Extract dTag from event
      const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
      if (!dTag) {
        throw new Error('Created event missing required d tag');
      }

      // Create backward-compatible attachments from single image
      const attachments: ProductAttachment[] = [];
      if (productData.imageHash && productData.imageUrl) {
        attachments.push({
          id: `legacy-${productData.imageHash}`,
          hash: productData.imageHash,
          url: productData.imageUrl,
          type: 'image',
          name: imageFile?.name || 'legacy-image',
          size: imageFile?.size || 0,
          mimeType: imageFile?.type || 'image/jpeg',
        });
      }

      const product: ShopProduct = {
        id: event.id,
        dTag, // NIP-33 d tag identifier
        title: productData.title,
        description: productData.description,
        price: productData.price,
        currency: productData.currency,
        
        // NEW: Multiple attachments support
        attachments,
        
        // LEGACY: Backward compatibility
        imageUrl: productData.imageUrl,
        imageHash: productData.imageHash,
        
        tags: productData.tags,
        category: productData.category,
        condition: productData.condition,
        location: productData.location,
        contact: productData.contact,
        publishedAt: event.created_at,
        eventId: event.id,
        publishedRelays: publishResult.publishedRelays,
        author: event.pubkey,
        isDeleted: false, // New products are never deleted
      };

      // Store the product in the local store
      productStore.addProduct(product);

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Product created successfully!',
        details: `Published to ${publishResult.publishedRelays.length} relays`,
      });

      logger.info('Product created and stored successfully', {
        service: 'ShopBusinessService',
        method: 'createProduct',
        productId: product.id,
        title: product.title,
        publishedRelays: publishResult.publishedRelays.length,
        eventId: event.id,
      });

      return {
        success: true,
        product,
        eventId: event.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product creation failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'createProduct',
        title: productData.title,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 🎯 NEW: Create a product with multiple attachments using Enhanced Sequential Upload
   * This is the main method for the multiple attachments feature
   */
  public async createProductWithAttachments(
    productData: ProductEventData,
    attachmentFiles: File[],
    signer: NostrSigner,
    onProgress?: (progress: ShopPublishingProgress) => void
  ): Promise<CreateProductWithAttachmentsResult> {
    try {
      logger.info('Starting product creation with multiple attachments', {
        service: 'ShopBusinessService',
        method: 'createProductWithAttachments',
        title: productData.title,
        attachmentCount: attachmentFiles.length,
        totalSize: attachmentFiles.reduce((sum, f) => sum + f.size, 0)
      });

      // Step 1: Validate attachments against business rules
      const validationResult = await this.validateAttachments(attachmentFiles, 0);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Attachment validation failed: ${validationResult.errors.join(', ')}`,
          attachmentResults: {
            successful: [],
            failed: validationResult.invalidFiles.map(f => ({ file: f.file, error: f.error })),
            partialSuccess: false
          }
        };
      }

      onProgress?.({
        step: 'uploading',
        progress: 5,
        message: 'Starting attachment uploads...',
        details: `Uploading ${attachmentFiles.length} files with Enhanced Sequential Upload`,
        attachmentProgress: {
          currentFile: 0,
          totalFiles: attachmentFiles.length,
          currentFileName: '',
          uploadedFiles: [],
          failedFiles: []
        }
      });

      // Step 2: Upload attachments using Enhanced Sequential Upload
      const uploadResult = await this.uploadAttachmentsSequentially(
        attachmentFiles, 
        signer,
        (progress) => {
          // Map Sequential Upload progress to Shop Publishing progress
          onProgress?.({
            step: 'uploading',
            progress: 5 + (progress.overallProgress * 0.6), // 5% to 65%
            message: progress.nextAction,
            details: `File ${progress.currentFileIndex + 1} of ${progress.totalFiles}`,
            attachmentProgress: {
              currentFile: progress.currentFileIndex + 1,
              totalFiles: progress.totalFiles,
              currentFileName: progress.currentFile.name,
              uploadedFiles: progress.completedFiles.map(f => f.fileId),
              failedFiles: progress.failedFiles.map(f => f.name)
            }
          });
        }
      );

      // Check if we have at least some successful uploads
      if (uploadResult.successCount === 0) {
        return {
          success: false,
          error: 'All attachment uploads failed',
          attachmentResults: {
            successful: [],
            failed: uploadResult.failedFiles.map(f => ({ file: f.file, error: f.error })),
            partialSuccess: false
          }
        };
      }

      // Step 3: Convert successful uploads to ProductAttachments
      const attachments = await this.createProductAttachments(uploadResult.uploadedFiles, signer);

      // Step 4: Update product data with attachments
      productData.attachments = attachments;
      
      // Set primary image from first image attachment for legacy support
      const primaryImage = attachments.find(a => a.type === 'image');
      if (primaryImage) {
        productData.imageUrl = primaryImage.url;
        productData.imageHash = primaryImage.hash;
      }

      // Step 5: Create and publish Nostr event
      onProgress?.({
        step: 'creating_event',
        progress: 70,
        message: 'Creating product event...',
        details: `Event with ${attachments.length} attachments`,
      });

      const event = await nostrEventService.createProductEvent(productData, signer);

      // Step 6: Publish to relays
      onProgress?.({
        step: 'publishing',
        progress: 85,
        message: 'Publishing to Nostr relays...',
        details: 'Broadcasting to decentralized network',
      });

      const publishResult = await nostrEventService.publishEvent(event, signer);

      if (!publishResult.success) {
        return {
          success: false,
          error: `Failed to publish to any relay: ${publishResult.error}`,
          eventId: event.id,
          publishedRelays: publishResult.publishedRelays,
          failedRelays: publishResult.failedRelays,
          attachmentResults: {
            successful: attachments,
            failed: uploadResult.failedFiles.map(f => ({ file: f.file, error: f.error })),
            partialSuccess: uploadResult.partialSuccess
          }
        };
      }

      // Step 7: Create product object
      const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
      if (!dTag) {
        throw new Error('Created event missing required d tag');
      }

      const product: ShopProduct = {
        id: event.id,
        dTag,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        currency: productData.currency,
        attachments, // NEW: Multiple attachments
        imageUrl: productData.imageUrl, // Backward compatibility
        imageHash: productData.imageHash, // Backward compatibility
        tags: productData.tags,
        category: productData.category,
        condition: productData.condition,
        location: productData.location,
        contact: productData.contact,
        publishedAt: event.created_at,
        eventId: event.id,
        publishedRelays: publishResult.publishedRelays,
        author: event.pubkey,
        isDeleted: false,
      };

      // Store the product in the local store
      productStore.addProduct(product);

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Product created successfully!',
        details: `Published with ${attachments.length} attachments to ${publishResult.publishedRelays.length} relays`,
      });

      logger.info('Product with attachments created successfully', {
        service: 'ShopBusinessService',
        method: 'createProductWithAttachments',
        eventId: event.id,
        attachmentCount: attachments.length,
        publishedRelays: publishResult.publishedRelays.length,
      });

      return {
        success: true,
        product,
        eventId: event.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
        attachmentResults: {
          successful: attachments,
          failed: uploadResult.failedFiles.map(f => ({ file: f.file, error: f.error })),
          partialSuccess: uploadResult.partialSuccess
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in createProductWithAttachments';
      logger.error('Product creation with attachments failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'createProductWithAttachments',
        title: productData.title,
        attachmentCount: attachmentFiles.length,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        attachmentResults: {
          successful: [],
          failed: attachmentFiles.map(file => ({ file, error: errorMessage })),
          partialSuccess: false
        }
      };
    }
  }

  /**
   * 🎯 NEW: Update a product with multiple attachments using Enhanced Sequential Upload
   * This allows users to add, remove, or replace attachments when editing products
   */
  public async updateProductWithAttachments(
    originalEventId: string,
    updatedData: Partial<ProductEventData>,
    attachmentFiles: File[],
    signer: NostrSigner,
    userPubkey: string,
    onProgress?: (progress: ShopPublishingProgress) => void,
    selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
  ): Promise<CreateProductWithAttachmentsResult> {
    try {
      logger.info('Starting product update with multiple attachments', {
        service: 'ShopBusinessService',
        method: 'updateProductWithAttachments',
        originalEventId,
        attachmentCount: attachmentFiles.length,
        totalSize: attachmentFiles.reduce((sum, f) => sum + f.size, 0),
        hasSelectiveOps: !!selectiveOps,
        selectiveOps: selectiveOps ? {
          removedCount: selectiveOps.removedAttachments.length,
          keptCount: selectiveOps.keptAttachments.length,
          removedIds: selectiveOps.removedAttachments,
          keptIds: selectiveOps.keptAttachments
        } : null
      });

      // Step 1: Get the original product
      const originalProduct = productStore.getProduct(originalEventId);
      if (!originalProduct) {
        return {
          success: false,
          error: 'Original product not found',
          attachmentResults: {
            successful: [],
            failed: attachmentFiles.map(file => ({ file, error: 'Original product not found' })),
            partialSuccess: false
          }
        };
      }

      // Track original state for comparison
      logger.info('Original product state before update', {
        service: 'ShopBusinessService',
        method: 'updateProductWithAttachments',
        originalEventId,
        originalState: {
          title: originalProduct.title,
          description: originalProduct.description,
          price: originalProduct.price,
          currency: originalProduct.currency,
          category: originalProduct.category,
          condition: originalProduct.condition,
          location: originalProduct.location,
          contact: originalProduct.contact,
          attachmentCount: originalProduct.attachments?.length || 0,
          attachments: originalProduct.attachments?.map(att => ({ 
            id: att.id, 
            name: att.name, 
            type: att.type,
            hash: att.hash 
          })) || []
        }
      });

      // Step 2: Validate attachments against business rules (only if new files provided)
      if (attachmentFiles.length > 0) {
        const existingAttachmentCount = originalProduct.attachments?.length || 0;
        const validationResult = await this.validateAttachments(attachmentFiles, existingAttachmentCount);
        if (!validationResult.valid) {
          return {
            success: false,
            error: `Attachment validation failed: ${validationResult.errors.join(', ')}`,
            attachmentResults: {
              successful: [],
              failed: validationResult.invalidFiles.map(f => ({ file: f.file, error: f.error })),
              partialSuccess: false
            }
          };
        }
      }

      // Step 3: Handle new attachments if provided
      let newAttachments: ProductAttachment[] = [];
      let uploadResult: SequentialUploadResult = {
        success: true,
        uploadedFiles: [],
        failedFiles: [],
        partialSuccess: false,
        userCancelled: false,
        totalFiles: 0,
        successCount: 0,
        failureCount: 0
      };
      
      if (attachmentFiles.length > 0) {
        onProgress?.({
          step: 'uploading',
          progress: 5,
          message: 'Starting attachment uploads...',
          details: `Uploading ${attachmentFiles.length} files with Enhanced Sequential Upload`,
          attachmentProgress: {
            currentFile: 0,
            totalFiles: attachmentFiles.length,
            currentFileName: '',
            uploadedFiles: [],
            failedFiles: []
          }
        });

        // Upload new attachments using Enhanced Sequential Upload
        uploadResult = await this.uploadAttachmentsSequentially(
          attachmentFiles, 
          signer,
          (progress) => {
            // Map Sequential Upload progress to Shop Publishing progress
            onProgress?.({
              step: 'uploading',
              progress: 5 + (progress.overallProgress * 0.6), // 5% to 65%
              message: progress.nextAction,
              details: `File ${progress.currentFileIndex + 1} of ${progress.totalFiles}`,
              attachmentProgress: {
                currentFile: progress.currentFileIndex + 1,
                totalFiles: progress.totalFiles,
                currentFileName: progress.currentFile.name,
                uploadedFiles: progress.completedFiles.map(f => f.fileId),
                failedFiles: progress.failedFiles.map(f => f.name)
              }
            });
          }
        );

        // Check if we have at least some successful uploads
        if (uploadResult.successCount === 0) {
          return {
            success: false,
            error: 'All attachment uploads failed',
            attachmentResults: {
              successful: [],
              failed: uploadResult.failedFiles.map(f => ({ file: f.file, error: f.error })),
              partialSuccess: false
            }
          };
        }

        // Convert successful uploads to ProductAttachments
        newAttachments = await this.createProductAttachments(uploadResult.uploadedFiles, signer);
      }

      // Step 4: Merge with existing attachments using selective operations
      let allAttachments: ProductAttachment[] = [];
      
      if (selectiveOps) {
        // Selective management: user explicitly chose what to keep/remove
        const keptAttachments = (originalProduct.attachments || []).filter(att => 
          selectiveOps.keptAttachments.includes(att.id)
        );
        allAttachments = [...keptAttachments, ...newAttachments];
        
        logger.info('Selective attachment merge', {
          service: 'ShopBusinessService',
          method: 'updateProductWithAttachments',
          originalCount: originalProduct.attachments?.length || 0,
          keptCount: keptAttachments.length,
          removedCount: selectiveOps.removedAttachments.length,
          newCount: newAttachments.length,
          finalCount: allAttachments.length
        });
      } else {
        // Legacy behavior: keep all existing and add new ones
        allAttachments = newAttachments.length > 0 
          ? [...(originalProduct.attachments || []), ...newAttachments]
          : originalProduct.attachments || [];
      }

      // Step 6: Update product data with new attachments
      const mergedData = {
        ...updatedData,
        attachments: allAttachments,
        // Set primary image from first image attachment for legacy support
        imageUrl: allAttachments.find(a => a.type === 'image')?.url || originalProduct.imageUrl,
        imageHash: allAttachments.find(a => a.type === 'image')?.hash || originalProduct.imageHash,
      };

      // Check if there are actually any changes to avoid unnecessary updates
      const hasContentChanges = Object.keys(updatedData).some(key => {
        const originalValue = originalProduct[key as keyof ShopProduct];
        const newValue = mergedData[key as keyof typeof mergedData];
        return originalValue !== newValue;
      });

      const hasAttachmentChanges = newAttachments.length > 0 || (selectiveOps && selectiveOps.removedAttachments.length > 0);

      if (!hasContentChanges && !hasAttachmentChanges) {
        logger.info('No changes detected, skipping update', {
          service: 'ShopBusinessService',
          method: 'updateProductWithAttachments',
          originalEventId,
          reason: 'No content or attachment changes detected'
        });

        return {
          success: true,
          product: originalProduct,
          eventId: originalEventId,
          attachmentResults: {
            successful: [],
            failed: [],
            partialSuccess: false
          }
        };
      }

      // Track final state after merge
      logger.info('Final merged state after attachment processing', {
        service: 'ShopBusinessService',
        method: 'updateProductWithAttachments',
        originalEventId,
        finalState: {
          title: mergedData.title || originalProduct.title,
          description: mergedData.description || originalProduct.description,
          price: mergedData.price || originalProduct.price,
          currency: mergedData.currency || originalProduct.currency,
          category: mergedData.category || originalProduct.category,
          condition: mergedData.condition || originalProduct.condition,
          location: mergedData.location || originalProduct.location,
          contact: mergedData.contact || originalProduct.contact,
          attachmentCount: allAttachments.length,
          attachments: allAttachments.map(att => ({ 
            id: att.id, 
            name: att.name, 
            type: att.type,
            hash: att.hash,
            isNew: newAttachments.some(newAtt => newAtt.id === att.id)
          }))
        },
        changes: {
          contentChanges: {
            title: { before: originalProduct.title, after: mergedData.title, changed: originalProduct.title !== mergedData.title },
            description: { before: originalProduct.description, after: mergedData.description, changed: originalProduct.description !== mergedData.description },
            price: { before: originalProduct.price, after: mergedData.price, changed: originalProduct.price !== mergedData.price },
            currency: { before: originalProduct.currency, after: mergedData.currency, changed: originalProduct.currency !== mergedData.currency },
            category: { before: originalProduct.category, after: mergedData.category, changed: originalProduct.category !== mergedData.category },
            condition: { before: originalProduct.condition, after: mergedData.condition, changed: originalProduct.condition !== mergedData.condition },
            location: { before: originalProduct.location, after: mergedData.location, changed: originalProduct.location !== mergedData.location },
            contact: { before: originalProduct.contact, after: mergedData.contact, changed: originalProduct.contact !== mergedData.contact }
          },
          attachmentChanges: {
            originalCount: originalProduct.attachments?.length || 0,
            finalCount: allAttachments.length,
            newCount: newAttachments.length,
            removedCount: selectiveOps?.removedAttachments.length || 0,
            keptCount: selectiveOps ? (originalProduct.attachments?.length || 0) - (selectiveOps.removedAttachments.length || 0) : (originalProduct.attachments?.length || 0)
          }
        }
      });

      // Step 7: Create revision event
      onProgress?.({
        step: 'creating_event',
        progress: 70,
        message: 'Creating product revision...',
        details: `Revision with ${allAttachments.length} attachments`,
      });

      const updatedEvent = await nostrEventService.createProductEvent(mergedData as ProductEventData, signer, originalProduct.dTag);

      // Step 8: Publish to relays
      onProgress?.({
        step: 'publishing',
        progress: 85,
        message: 'Publishing revision to Nostr relays...',
        details: 'Broadcasting to decentralized network',
      });

      const publishResult = await nostrEventService.publishEvent(updatedEvent, signer);

      if (!publishResult.success) {
        return {
          success: false,
          error: `Failed to publish revision: ${publishResult.error}`,
          eventId: updatedEvent.id,
          publishedRelays: publishResult.publishedRelays,
          failedRelays: publishResult.failedRelays,
          attachmentResults: {
            successful: allAttachments,
            failed: uploadResult.failedFiles.map(f => ({ file: f.file, error: f.error })),
            partialSuccess: uploadResult.partialSuccess
          }
        };
      }

      // Step 9: Create updated product object
      const updatedProduct: ShopProduct = {
        id: updatedEvent.id,
        dTag: originalProduct.dTag, // Keep same dTag for revisions
        title: mergedData.title || originalProduct.title,
        description: mergedData.description || originalProduct.description,
        price: mergedData.price || originalProduct.price,
        currency: mergedData.currency || originalProduct.currency,
        
        // NEW: Multiple attachments support
        attachments: allAttachments,
        
        // LEGACY: Backward compatibility
        imageUrl: mergedData.imageUrl,
        imageHash: mergedData.imageHash,
        
        tags: mergedData.tags || originalProduct.tags,
        category: mergedData.category || originalProduct.category,
        condition: mergedData.condition || originalProduct.condition,
        location: mergedData.location || originalProduct.location,
        contact: mergedData.contact || originalProduct.contact,
        author: userPubkey,
        publishedAt: updatedEvent.created_at,
        eventId: updatedEvent.id,
        publishedRelays: publishResult.publishedRelays,
        isDeleted: false, // Updated products are not deleted
      };

      // Update the product in the store
      productStore.addProduct(updatedProduct);

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Product updated successfully!',
        details: `Updated with ${allAttachments.length} attachments to ${publishResult.publishedRelays.length} relays`,
      });

      logger.info('Product with attachments updated successfully', {
        service: 'ShopBusinessService',
        method: 'updateProductWithAttachments',
        originalEventId,
        newEventId: updatedEvent.id,
        attachmentCount: allAttachments.length,
        publishedRelays: publishResult.publishedRelays.length,
      });

      return {
        success: true,
        product: updatedProduct,
        eventId: updatedEvent.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
        attachmentResults: {
          successful: allAttachments,
          failed: uploadResult.failedFiles.map(f => ({ file: f.file, error: f.error })),
          partialSuccess: uploadResult.partialSuccess
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in updateProductWithAttachments';
      logger.error('Product update with attachments failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'updateProductWithAttachments',
        originalEventId,
        attachmentCount: attachmentFiles.length,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        attachmentResults: {
          successful: [],
          failed: attachmentFiles.map(file => ({ file, error: errorMessage })),
          partialSuccess: false
        }
      };
    }
  }

  /**
   * Update an existing product by creating a revision event
   */
  public async updateProduct(
    originalEventId: string,
    updatedData: Partial<ProductEventData>,
    imageFile: File | null,
    signer: NostrSigner,
    userPubkey: string, // Add pubkey parameter to avoid extra signer call
    onProgress?: (progress: ShopPublishingProgress) => void
  ): Promise<CreateProductResult> {
    try {
      logger.info('Starting product update', {
        service: 'ShopBusinessService',
        method: 'updateProduct',
        originalEventId,
        title: updatedData.title,
      });

      // Get the original product
      const originalProduct = productStore.getProduct(originalEventId);
      if (!originalProduct) {
        return {
          success: false,
          error: 'Original product not found',
          publishedRelays: [],
          failedRelays: [],
        };
      }

      // Merge updated data with original product data
      const mergedData: ProductEventData = {
        title: updatedData.title || originalProduct.title,
        description: updatedData.description || originalProduct.description,
        price: updatedData.price !== undefined ? updatedData.price : originalProduct.price,
        currency: updatedData.currency || originalProduct.currency,
        tags: updatedData.tags || originalProduct.tags,
        category: updatedData.category || originalProduct.category,
        condition: updatedData.condition || originalProduct.condition,
        location: updatedData.location || originalProduct.location,
        contact: updatedData.contact || originalProduct.contact,
        imageUrl: originalProduct.imageUrl,
        imageHash: originalProduct.imageHash,
        imageFile: imageFile || undefined,
      };

      // Handle image upload if new image provided
      let imageMetadata: BlossomFileMetadata | null = null;
      if (imageFile) {
        onProgress?.({
          step: 'uploading',
          progress: 10,
          message: 'Uploading new image...',
        });

        const uploadResult = await blossomService.uploadFile(imageFile, signer);
        if (!uploadResult.success) {
          return {
            success: false,
            error: `Image upload failed: ${uploadResult.error}`,
            publishedRelays: [],
            failedRelays: [],
          };
        }

        imageMetadata = uploadResult.metadata || null;
        if (imageMetadata) {
          mergedData.imageUrl = imageMetadata.url;
          mergedData.imageHash = imageMetadata.hash;
        }

        onProgress?.({
          step: 'uploading',
          progress: 50,
          message: 'Image uploaded successfully',
        });
      }

      // Create revision event
      onProgress?.({
        step: 'creating_event',
        progress: 60,
        message: 'Creating revision event...',
      });

      // Use provided pubkey instead of calling signer.getPublicKey() to avoid extra prompt

      // For Kind 30023, we create a new event with the same dTag to replace the original
      const updatedProductData: ProductEventData = {
        title: mergedData.title,
        description: mergedData.description,
        price: mergedData.price,
        currency: mergedData.currency,
        tags: mergedData.tags,
        category: mergedData.category,
        condition: mergedData.condition,
        location: mergedData.location,
        contact: mergedData.contact,
        imageUrl: mergedData.imageUrl,
        imageHash: mergedData.imageHash,
        imageFile: mergedData.imageFile,
      };

      // Create updated product event with the same dTag (this will replace the original)
      const updatedEvent = await nostrEventService.createProductEvent(
        updatedProductData,
        signer,
        originalProduct.dTag // Use same dTag to replace original
      );

      // The event is already signed by createProductEvent, so we can publish directly

      onProgress?.({
        step: 'publishing',
        progress: 80,
        message: 'Publishing revision to relays...',
      });

      // Publish the updated event
      const publishResult = await nostrEventService.publishEvent(
        updatedEvent,
        signer,
        (relay, status) => {
          logger.info('Relay publishing status for product update', {
            service: 'ShopBusinessService',
            method: 'updateProduct',
            relay,
            status,
            eventId: updatedEvent.id,
          });
        }
      );

      // Event logging now handled automatically in GenericRelayService

      if (!publishResult.success) {
        return {
          success: false,
          error: `Failed to publish revision: ${publishResult.error}`,
          publishedRelays: publishResult.publishedRelays,
          failedRelays: publishResult.failedRelays,
        };
      }

      // Create backward-compatible attachments for updated product
      const attachments: ProductAttachment[] = [];
      if (mergedData.imageHash && mergedData.imageUrl) {
        attachments.push({
          id: `legacy-${mergedData.imageHash}`,
          hash: mergedData.imageHash,
          url: mergedData.imageUrl,
          type: 'image',
          name: imageFile?.name || originalProduct.attachments[0]?.name || 'legacy-image',
          size: imageFile?.size || originalProduct.attachments[0]?.size || 0,
          mimeType: imageFile?.type || originalProduct.attachments[0]?.mimeType || 'image/jpeg',
        });
      }

      // Create updated product object
      const updatedProduct: ShopProduct = {
        id: updatedEvent.id,
        dTag: originalProduct.dTag, // Keep same dTag
        title: mergedData.title,
        description: mergedData.description,
        price: mergedData.price,
        currency: mergedData.currency,
        
        // NEW: Multiple attachments support
        attachments,
        
        // LEGACY: Backward compatibility
        imageUrl: mergedData.imageUrl,
        imageHash: mergedData.imageHash,
        
        tags: mergedData.tags,
        category: mergedData.category,
        condition: mergedData.condition,
        location: mergedData.location,
        contact: mergedData.contact,
        author: userPubkey,
        publishedAt: updatedEvent.created_at,
        eventId: updatedEvent.id,
        publishedRelays: publishResult.publishedRelays,
        isDeleted: false, // Updated products are not deleted
      };

      // Update the product in the store
      productStore.addProduct(updatedProduct);

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Product updated successfully!',
      });

      logger.info('Product updated successfully', {
        service: 'ShopBusinessService',
        method: 'updateProduct',
        originalEventId,
        newEventId: updatedEvent.id,
        publishedRelays: publishResult.publishedRelays.length,
      });

      return {
        success: true,
        product: updatedProduct,
        eventId: updatedEvent.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product update failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'updateProduct',
        originalEventId,
        error: errorMessage,
      });
      return {
        success: false,
        error: errorMessage,
        publishedRelays: [],
        failedRelays: [],
      };
    }
  }

  /**
   * Query products from Nostr relays
   */
  public async queryProductsFromRelays(
    onProgress?: (relay: string, status: 'querying' | 'success' | 'failed', count?: number) => void,
    showDeleted: boolean = false // Show deleted products or not
  ): Promise<{ success: boolean; products: ShopProduct[]; queriedRelays: string[]; failedRelays: string[]; error?: string }> {
    try {
      logger.info('Starting product query from relays', {
        service: 'ShopBusinessService',
        method: 'queryProductsFromRelays',
      });

      // Create filters for Kind 30023 events with shop tag
      const filters = [
        {
          kinds: [30023], // Parameterized replaceable long-form content events
          '#t': ['culture-bridge-shop'], // Shop identifier tag
        }
      ];

      const queryResult = await queryEvents(filters, (progress) => {
        // Convert GenericRelayService progress to ShopBusinessService format
        if (progress.step === 'querying' && progress.message.includes('Querying')) {
          const relayName = progress.message.replace('Querying ', '').replace('...', '');
          onProgress?.(relayName, 'querying');
        } else if (progress.step === 'complete') {
          // This would need to be handled differently in a real implementation
          // For now, we'll just log the completion
          logger.info('Query completed', {
            service: 'ShopBusinessService',
            method: 'queryProductsFromRelays',
            progress: progress.progress,
            message: progress.message,
          });
        }
      });

      if (!queryResult.success) {
        return {
          success: false,
          products: [],
          queriedRelays: [],
          failedRelays: [],
          error: queryResult.error,
        };
      }

        // Parse events into products - Kind 30023 handles revisions automatically
        const products: ShopProduct[] = [];

        for (const event of queryResult.events) {
          // Get relay information for this event
          const eventRelays = queryResult.eventRelayMap?.get(event.id) || [];
          const product = await this.parseProductFromEvent(event, eventRelays);
          if (product) {
            // Filter deleted products unless explicitly requested
            if (showDeleted || !product.isDeleted) {
              products.push(product);
            }
            // Always add to store for caching (even deleted ones)
            productStore.addProduct(product);
          }
        }

      logger.info('Product query completed', {
        service: 'ShopBusinessService',
        method: 'queryProductsFromRelays',
        totalEvents: queryResult.events.length,
        activeProducts: products.length,
        relayCount: queryResult.relayCount,
      });

      return {
        success: true,
        products,
        queriedRelays: [], // Will be populated in real implementation
        failedRelays: [], // Will be populated in real implementation
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product query from relays failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'queryProductsFromRelays',
        error: errorMessage,
      });

      return {
        success: false,
        products: [],
        queriedRelays: [],
        failedRelays: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Parse product from Nostr event
   */
  public async parseProductFromEvent(event: NostrEvent, publishedRelays: string[] = []): Promise<ShopProduct | null> {
    try {
      logger.info('Parsing product from event', {
        service: 'ShopBusinessService',
        method: 'parseProductFromEvent',
        eventId: event.id,
        kind: event.kind,
      });

      if (event.kind !== 30023) {
        logger.warn('Event is not Kind 30023', {
          service: 'ShopBusinessService',
          method: 'parseProductFromEvent',
          eventId: event.id,
          kind: event.kind,
        });
        return null;
      }

      // Extract d tag for NIP-33 parameterized replaceable events
      const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
      if (!dTag) {
        logger.warn('Event missing required d tag', {
          service: 'ShopBusinessService',
          method: 'parseProductFromEvent',
          eventId: event.id,
        });
        return null;
      }

      const productData = nostrEventService.extractProductData(event as import('../../types/nostr').NIP23Event);
      const content = nostrEventService.parseEventContent(event as import('../../types/nostr').NIP23Event);

      if (!productData.title || !content) {
        logger.warn('Invalid product event data', {
          service: 'ShopBusinessService',
          method: 'parseProductFromEvent',
          eventId: event.id,
          hasTitle: !!productData.title,
          hasContent: !!content,
        });
        return null;
      }

      // Check if this is a deleted product (title starts with [DELETED])
      const isDeleted = productData.title.startsWith('[DELETED]');

      // Parse attachments from event (NEW - Phase 3)
      const attachments = await this.parseAttachmentsFromEvent(event, productData);

      const product: ShopProduct = {
        id: event.id,
        dTag, // NIP-33 d tag identifier
        title: productData.title,
        description: productData.description || content.content, // Use extracted description, fallback to full content
        price: productData.price || 0,
        currency: productData.currency || 'USD',
        
        // NEW: Multiple attachments support
        attachments,
        
        // LEGACY: Backward compatibility - single image
        imageUrl: productData.imageHash ? this.constructUserBlossomUrl(event.pubkey, productData.imageHash) : undefined,
        imageHash: productData.imageHash,
        
        tags: productData.tags || [],
        category: productData.category || 'general',
        condition: productData.condition || 'new',
        location: productData.location || 'Unknown',
        contact: productData.contact || '',
        publishedAt: event.created_at,
        eventId: event.id,
        publishedRelays: publishedRelays, // Use actual relay information
        author: event.pubkey,
        isDeleted, // Track deletion status
      };

      logger.info('Product parsed successfully', {
        service: 'ShopBusinessService',
        method: 'parseProductFromEvent',
        productId: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        condition: product.condition,
        location: product.location,
        contact: product.contact,
        tags: product.tags,
        attachmentCount: product.attachments?.length || 0,
        isDeleted: product.isDeleted,
        parsedProduct: product
      });

      return product;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to parse product from event', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'parseProductFromEvent',
        eventId: event.id,
        error: errorMessage,
      });
      return null;
    }
  }

  /**
   * Construct user-specific Blossom URL following Nostr decentralization ethos
   * Uses centralized configuration from blossom.ts
   */
  private constructUserBlossomUrl(userPubkey: string, imageHash: string): string {
    try {
      // Import profileService to convert pubkey to npub
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { profileService } = require('../business/ProfileBusinessService');
      const userNpub = profileService.pubkeyToNpub(userPubkey);
      
      // Use configuration-based URL construction
      if (BLOSSOM_CONFIG.preferUserOwned) {
        return constructUserBlossomUrl(userNpub, imageHash);
      } else {
        return getSharedBlossomUrl(imageHash);
      }
    } catch (error) {
      logger.warn('Failed to construct user-specific Blossom URL, falling back to shared server', {
        service: 'ShopBusinessService',
        method: 'constructUserBlossomUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Fallback to configured shared server
      return getSharedBlossomUrl(imageHash);
    }
  }

  /**
   * Validate product data before creation
   */
  public validateProductData(productData: ProductEventData): { valid: boolean; error?: string } {
    try {
      logger.info('Validating product data', {
        service: 'ShopBusinessService',
        method: 'validateProductData',
        title: productData.title,
        category: productData.category,
      });

      if (!productData.title || productData.title.trim().length === 0) {
        return {
          valid: false,
          error: 'Product title is required',
        };
      }

      if (productData.title.length > 100) {
        return {
          valid: false,
          error: 'Product title must be 100 characters or less',
        };
      }

      if (!productData.description || productData.description.trim().length === 0) {
        return {
          valid: false,
          error: 'Product description is required',
        };
      }

      if (productData.description.length > 2000) {
        return {
          valid: false,
          error: 'Product description must be 2000 characters or less',
        };
      }

      if (productData.price < 0) {
        return {
          valid: false,
          error: 'Product price must be 0 or greater',
        };
      }

      if (!productData.currency || productData.currency.trim().length === 0) {
        return {
          valid: false,
          error: 'Currency is required',
        };
      }

      if (!productData.category || productData.category.trim().length === 0) {
        return {
          valid: false,
          error: 'Product category is required',
        };
      }

      if (!['new', 'used', 'refurbished'].includes(productData.condition)) {
        return {
          valid: false,
          error: 'Product condition must be new, used, or refurbished',
        };
      }

      if (!productData.location || productData.location.trim().length === 0) {
        return {
          valid: false,
          error: 'Product location is required',
        };
      }

      if (!productData.contact || productData.contact.trim().length === 0) {
        return {
          valid: false,
          error: 'Contact information is required',
        };
      }

      logger.info('Product data validation successful', {
        service: 'ShopBusinessService',
        method: 'validateProductData',
        title: productData.title,
      });

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product data validation failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'validateProductData',
        title: productData.title,
        error: errorMessage,
      });

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get product by event ID from the local store
   */
  public async getProduct(eventId: string): Promise<ShopProduct | null> {
    try {
      logger.info('Getting product by event ID', {
        service: 'ShopBusinessService',
        method: 'getProduct',
        eventId,
      });

      const product = productStore.getProduct(eventId);
      
      if (product) {
        logger.info('Product retrieved successfully', {
          service: 'ShopBusinessService',
          method: 'getProduct',
          eventId,
          title: product.title,
        });
      } else {
        logger.warn('Product not found', {
          service: 'ShopBusinessService',
          method: 'getProduct',
          eventId,
        });
      }

      return product;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get product', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'getProduct',
        eventId,
        error: errorMessage,
      });
      return null;
    }
  }

  /**
   * List all products from the local store
   */
  public async listProducts(): Promise<ShopProduct[]> {
    try {
      logger.info('Listing all products', {
        service: 'ShopBusinessService',
        method: 'listProducts',
      });

      const products = productStore.getAllProducts();
      
      logger.info('Products listed successfully', {
        service: 'ShopBusinessService',
        method: 'listProducts',
        productCount: products.length,
      });

      return products;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list products', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'listProducts',
        error: errorMessage,
      });
      return [];
    }
  }

  /**
   * Query products by specific author from Nostr relays with proper soft delete handling
   */
  public async queryProductsByAuthor(
    authorPubkey: string,
    onProgress?: (relay: string, status: 'querying' | 'success' | 'failed', count?: number) => void,
    showDeleted: boolean = false // Show deleted products or not
  ): Promise<{ success: boolean; products: ShopProduct[]; queriedRelays: string[]; failedRelays: string[]; error?: string }> {
    try {
      logger.info('Starting product query by author', {
        service: 'ShopBusinessService',
        method: 'queryProductsByAuthor',
        authorPubkey: authorPubkey.substring(0, 8) + '...',
      });

      // Create filters for Kind 30023 events with shop tag and specific author
      const filters = [
        {
          kinds: [30023], // Parameterized replaceable long-form content events
          authors: [authorPubkey], // Filter by specific author
          '#t': ['culture-bridge-shop'], // Shop identifier tag
        },
      ];

      const queryResult = await queryEvents(filters, (progress) => {
        // Convert GenericRelayService progress to ShopBusinessService format
        if (progress.step === 'querying' && progress.message.includes('Querying')) {
          const relayName = progress.message.replace('Querying ', '').replace('...', '');
          onProgress?.(relayName, 'querying');
        } else if (progress.step === 'complete') {
          logger.info('Author product query completed', {
            service: 'ShopBusinessService',
            method: 'queryProductsByAuthor',
            progress: progress.progress,
            message: progress.message,
          });
        }
      });

      if (!queryResult.success) {
        return {
          success: false,
          products: [],
          queriedRelays: [],
          failedRelays: [],
          error: queryResult.error,
        };
      }

        // Parse events into products - Kind 30023 handles revisions automatically
        const products: ShopProduct[] = [];

        for (const event of queryResult.events) {
          // Get relay information for this event
          const eventRelays = queryResult.eventRelayMap?.get(event.id) || [];
          const product = await this.parseProductFromEvent(event, eventRelays);
          if (product) {
            // Filter deleted products unless explicitly requested
            if (showDeleted || !product.isDeleted) {
              products.push(product);
            }
          }
        }

        logger.info('Author product query completed', {
          service: 'ShopBusinessService',
          method: 'queryProductsByAuthor',
          authorPubkey: authorPubkey.substring(0, 8) + '...',
          totalEvents: queryResult.events.length,
          filteredProducts: products.length,
          showDeleted,
          relayCount: queryResult.relayCount,
        });

        // Add products to local store for caching
        for (const event of queryResult.events) {
          const eventRelays = queryResult.eventRelayMap?.get(event.id) || [];
          const product = await this.parseProductFromEvent(event, eventRelays);
          if (product) {
            productStore.addProduct(product); // Cache all products, even deleted ones
          }
        }

        return {
          success: true,
          products,
          queriedRelays: [], // Will be populated in real implementation
          failedRelays: [], // Will be populated in real implementation
        };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Author product query failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'queryProductsByAuthor',
        authorPubkey: authorPubkey.substring(0, 8) + '...',
        error: errorMessage,
      });

      return {
        success: false,
        products: [],
        queriedRelays: [],
        failedRelays: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Delete a product by creating a deletion event
   */
  public async deleteProduct(
    productId: string,
    signer: NostrSigner,
    userPubkey: string,
    onProgress?: (progress: ShopPublishingProgress) => void
  ): Promise<{ success: boolean; error?: string; eventId?: string; publishedRelays?: string[]; failedRelays?: string[] }> {
    try {
      logger.info('Starting product deletion', {
        service: 'ShopBusinessService',
        method: 'deleteProduct',
        productId,
        userPubkey: userPubkey.substring(0, 8) + '...',
      });
      
      // Get the product to verify ownership
      const product = productStore.getProduct(productId);
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      if (product.author !== userPubkey) {
        return {
          success: false,
          error: 'You can only delete your own products',
        };
      }

      // Create NIP-09 Kind 5 deletion event
      onProgress?.({
        step: 'creating_event',
        progress: 30,
        message: 'Creating deletion event...',
        details: 'Preparing NIP-09 deletion for Nostr network',
      });

      // Create proper NIP-09 Kind 5 deletion event
      const deletionResult = createDeletionEvent(
        [product.eventId], // Event ID to delete
        userPubkey,
        {
          reason: `Product "${product.title}" deleted by author`,
          additionalTags: [
            ['t', 'culture-bridge-shop'], // Help identify this is a shop product deletion
          ],
        }
      );

      if (!deletionResult.success || !deletionResult.event) {
        return {
          success: false,
          error: `Failed to create deletion event: ${deletionResult.error}`,
        };
      }

      // Sign the deletion event
      const signingResult = await signEvent(deletionResult.event, signer);
      if (!signingResult.success || !signingResult.signedEvent) {
        return {
          success: false,
          error: `Failed to sign deletion event: ${signingResult.error}`,
        };
      }

      onProgress?.({
        step: 'publishing',
        progress: 60,
        message: 'Publishing deletion to relays...',
        details: 'Broadcasting deletion to decentralized network',
      });

      // Publish the deletion event
      const publishResult = await publishEvent(signingResult.signedEvent, signer, (progress) => {
        onProgress?.({
          step: 'publishing',
          progress: 60 + (progress.progress * 0.4), // Map 0-100 to 60-100
          message: progress.message,
        });
      });

      // Event logging now handled automatically in GenericRelayService

      if (!publishResult.success) {
        return {
          success: false,
          error: `Failed to publish deletion: ${publishResult.error}`,
          publishedRelays: publishResult.publishedRelays,
          failedRelays: publishResult.failedRelays,
        };
      }

      // Remove the deleted product from local store
      productStore.removeProduct(productId);

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Product deleted successfully!',
        details: `NIP-09 deletion published to ${publishResult.publishedRelays.length} relays`,
      });

      logger.info('Product deleted successfully with NIP-09', {
        service: 'ShopBusinessService',
        method: 'deleteProduct',
        productId,
        originalEventId: product.eventId,
        deletionEventId: signingResult.signedEvent.id,
        publishedRelays: publishResult.publishedRelays.length,
        deletionType: 'NIP-09 Kind 5',
      });

      return {
        success: true,
        eventId: signingResult.signedEvent.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product deletion failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'deleteProduct',
        productId,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate attachments against business rules
   */
  private async validateAttachments(files: File[], existingAttachmentCount: number = 0): Promise<MediaValidationResult> {
    try {
      logger.debug('Validating attachments against business rules', {
        service: 'ShopBusinessService',
        method: 'validateAttachments',
        fileCount: files.length,
        existingAttachmentCount: existingAttachmentCount,
        totalAttachmentCount: files.length + existingAttachmentCount,
        businessRules: this.attachmentRules
      });

      // Use GenericMediaService for technical validation
      const mediaValidation = await validateBatchFiles(files);
      
      // Add business-specific validation
      const errors: string[] = [...mediaValidation.errors];
      
      // Business rule: Check attachment count
      if (files.length > this.attachmentRules.maxAttachments) {
        errors.push(`Too many attachments: ${files.length}. Maximum allowed: ${this.attachmentRules.maxAttachments}`);
      }

      // Business rule: Check total size
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > this.attachmentRules.maxTotalSize) {
        errors.push(`Total size too large: ${(totalSize / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${(this.attachmentRules.maxTotalSize / 1024 / 1024).toFixed(2)}MB`);
      }

      // Business rule: Require at least one image (holistic check)
      if (this.attachmentRules.requireAtLeastOneImage) {
        const totalAttachmentCount = files.length + existingAttachmentCount;
        const hasNewImage = files.some(f => f.type.startsWith('image/'));
        
        // If we have new files, check if any are images
        // If we have no new files but existing attachments, assume they meet requirements
        // If we have no files at all (new or existing), then we need at least one image
        if (totalAttachmentCount === 0) {
          errors.push('At least one image attachment is required for products');
        } else if (files.length > 0 && !hasNewImage && existingAttachmentCount === 0) {
          // Only fail if we're adding new files but none are images AND there are no existing attachments
          errors.push('At least one image attachment is required for products');
        }
      }

      // Business rule: Check allowed types
      const invalidTypes = files.filter(f => {
        const type = f.type.split('/')[0] as 'image' | 'video' | 'audio';
        return !this.attachmentRules.allowedTypes.includes(type);
      });
      
      if (invalidTypes.length > 0) {
        errors.push(`Unsupported file types: ${invalidTypes.map(f => f.name).join(', ')}. Allowed types: ${this.attachmentRules.allowedTypes.join(', ')}`);
      }

      const isValid = errors.length === 0 && mediaValidation.valid;

      logger.info('Attachment validation completed', {
        service: 'ShopBusinessService',
        method: 'validateAttachments',
        valid: isValid,
        errorCount: errors.length,
        validFileCount: mediaValidation.validFiles?.length || 0
      });

      return {
        ...mediaValidation,
        valid: isValid,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      logger.error('Attachment validation failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'validateAttachments',
        fileCount: files.length,
        error: errorMessage
      });

      return {
        valid: false,
        validFiles: [],
        invalidFiles: files.map(file => ({ file, error: errorMessage })),
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        errors: [errorMessage],
        summary: { images: 0, videos: 0, audio: 0, total: 0 }
      };
    }
  }

  /**
   * Upload attachments using Enhanced Sequential Upload from Phase 2
   */
  private async uploadAttachmentsSequentially(
    files: File[],
    signer: NostrSigner,
    onProgress?: (progress: SequentialUploadProgress) => void
  ): Promise<SequentialUploadResult> {
    try {
      logger.info('Starting sequential attachment upload', {
        service: 'ShopBusinessService',
        method: 'uploadAttachmentsSequentially',
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
      });

      // Use the Enhanced Sequential Upload from Phase 2
      const result = await uploadSequentialWithConsent(files, signer, onProgress);

      logger.info('Sequential attachment upload completed', {
        service: 'ShopBusinessService',
        method: 'uploadAttachmentsSequentially',
        success: result.success,
        uploadedCount: result.successCount,
        failedCount: result.failureCount,
        partialSuccess: result.partialSuccess
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      logger.error('Sequential attachment upload failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'uploadAttachmentsSequentially',
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
   * Convert Blossom file metadata to ProductAttachment objects
   */
  private async createProductAttachments(
    blossomFiles: BlossomFileMetadata[],
    signer: NostrSigner
  ): Promise<ProductAttachment[]> {
    try {
      logger.debug('Creating product attachments from Blossom metadata', {
        service: 'ShopBusinessService',
        method: 'createProductAttachments',
        fileCount: blossomFiles.length
      });

      const attachments: ProductAttachment[] = [];

      for (const blossomFile of blossomFiles) {
        try {
          // Determine media type from file type
          const type = this.getMediaTypeFromFileType(blossomFile.fileType);
          
          // Construct user-specific Blossom URL
          const userPubkey = await signer.getPublicKey();
          const url = this.constructAttachmentUrl(userPubkey, blossomFile.hash);

          const attachment: ProductAttachment = {
            id: blossomFile.fileId,
            hash: blossomFile.hash,
            url,
            type,
            name: blossomFile.fileId, // Blossom doesn't preserve original filename
            size: blossomFile.fileSize,
            mimeType: blossomFile.fileType,
            // Note: metadata extraction would require the original file
            // For now, we'll leave this undefined and extract it in Phase 5 if needed
          };

          attachments.push(attachment);

          logger.debug('Created product attachment', {
            service: 'ShopBusinessService',
            method: 'createProductAttachments',
            attachmentId: attachment.id,
            type: attachment.type,
            hash: attachment.hash.substring(0, 8) + '...'
          });

        } catch (error) {
          logger.warn('Failed to create attachment for Blossom file', {
            service: 'ShopBusinessService',
            method: 'createProductAttachments',
            fileId: blossomFile.fileId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Continue with other files - don't fail the entire batch
        }
      }

      logger.info('Product attachments created successfully', {
        service: 'ShopBusinessService',
        method: 'createProductAttachments',
        inputCount: blossomFiles.length,
        outputCount: attachments.length
      });

      return attachments;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating attachments';
      logger.error('Failed to create product attachments', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopBusinessService',
        method: 'createProductAttachments',
        fileCount: blossomFiles.length,
        error: errorMessage
      });

      // Return empty array rather than throwing - let the caller handle it
      return [];
    }
  }

  /**
   * Construct attachment URL using user-specific Blossom configuration
   */
  private constructAttachmentUrl(userPubkey: string, imageHash: string): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { profileService } = require('./ProfileBusinessService');
      const userNpub = profileService.pubkeyToNpub(userPubkey);
      
      if (BLOSSOM_CONFIG.preferUserOwned) {
        return constructUserBlossomUrl(userNpub, imageHash);
      } else {
        return getSharedBlossomUrl(imageHash);
      }
    } catch (error) {
      logger.warn('Failed to construct user-specific attachment URL, falling back to shared server', {
        service: 'ShopBusinessService',
        method: 'constructAttachmentUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return getSharedBlossomUrl(imageHash);
    }
  }

  /**
   * Determine media type from MIME type
   */
  private getMediaTypeFromFileType(mimeType: string): 'image' | 'video' | 'audio' {
    const type = mimeType.split('/')[0];
    switch (type) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio';
      default:
        // Default to image for unknown types (backward compatibility)
        return 'image';
    }
  }

  /**
   * Parse attachments from Nostr event (supports both legacy and new formats)
   */
  private async parseAttachmentsFromEvent(event: NostrEvent, productData: Partial<ProductEventData>): Promise<ProductAttachment[]> {
    try {
      const attachments: ProductAttachment[] = [];

      // NEW: Use the enhanced parsing from NostrEventService
      if (productData.attachments && productData.attachments.length > 0) {
        // Construct URLs for each attachment
        for (const attachment of productData.attachments) {
          const url = this.constructAttachmentUrl(event.pubkey, attachment.hash);
          attachments.push({
            ...attachment,
            url
          });
        }

        logger.debug('Parsed multiple attachments from event', {
          service: 'ShopBusinessService',
          method: 'parseAttachmentsFromEvent',
          eventId: event.id,
          attachmentCount: attachments.length
        });
      }
      // LEGACY: Fallback to single image for backward compatibility
      else if (productData.imageHash) {
        const attachment: ProductAttachment = {
          id: `legacy-${productData.imageHash}`, // Legacy attachment ID
          hash: productData.imageHash,
          url: this.constructUserBlossomUrl(event.pubkey, productData.imageHash),
          type: 'image', // Assume legacy attachments are images
          name: 'legacy-image', // Legacy doesn't preserve filename
          size: 0, // Legacy doesn't have size info
          mimeType: 'image/jpeg', // Assume JPEG for legacy
          // No metadata for legacy attachments
        };

        attachments.push(attachment);

        logger.debug('Parsed legacy image as attachment', {
          service: 'ShopBusinessService',
          method: 'parseAttachmentsFromEvent',
          eventId: event.id,
          imageHash: productData.imageHash.substring(0, 8) + '...'
        });
      }

      return attachments;

    } catch (error) {
      logger.warn('Failed to parse attachments from event', {
        service: 'ShopBusinessService',
        method: 'parseAttachmentsFromEvent',
        eventId: event.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty array on error - don't fail the entire product parsing
      return [];
    }
  }

  /**
   * Get business rules for attachments (for UI display)
   */
  public getAttachmentRules(): AttachmentBusinessRules {
    return { ...this.attachmentRules };
  }

  /**
   * Update product with selective attachment operations
   */
  public async updateProductWithSelectiveOperations(
    originalEventId: string,
    updatedData: Partial<ProductEventData>,
    operations: AttachmentOperation[],
    signer: NostrSigner,
    userPubkey: string,
    onProgress?: (progress: ShopPublishingProgress) => void
  ): Promise<CreateProductResult> {
    try {
      logger.info('Starting selective product update', {
        service: 'ShopBusinessService',
        method: 'updateProductWithSelectiveOperations',
        originalEventId,
        operationCount: operations.length
      });

      // Get the original product
      const originalProduct = await this.getProduct(originalEventId);
      if (!originalProduct) {
        throw new AppError(
          'Product not found',
          ErrorCode.NOT_FOUND,
          HttpStatus.NOT_FOUND,
          ErrorCategory.RESOURCE,
          ErrorSeverity.MEDIUM
        );
      }

      // Process selective operations
      const result = await mediaBusinessService.applySelectiveOperations(
        operations,
        originalProduct.attachments || [],
        signer
      );

      if (!result.success) {
        throw new AppError(
          `Selective operations failed: ${result.error}`,
          ErrorCode.ATTACHMENT_PROCESSING_FAILED,
          HttpStatus.BAD_REQUEST,
          ErrorCategory.VALIDATION,
          ErrorSeverity.MEDIUM
        );
      }

      // Convert GenericAttachment[] to ProductAttachment[]
      const productAttachments: ProductAttachment[] = result.attachments.map(att => ({
        id: att.id,
        hash: att.hash || '',
        url: att.url || '',
        type: att.type as 'image' | 'video' | 'audio',
        name: att.name,
        size: att.size,
        mimeType: att.mimeType,
        metadata: att.metadata
      }));

      // Create updated product data with new attachments
      const updatedProductData: ProductEventData = {
        ...originalProduct,
        ...updatedData,
        attachments: productAttachments
      };

      // Create NIP-33 revision event
      const revisionEvent = await nostrEventService.createProductEvent(
        updatedProductData,
        signer,
        originalProduct.dTag
      );

      // Publish to relays
      onProgress?.({
        step: 'publishing',
        progress: 80,
        message: 'Publishing product update to relays...',
        details: `Publishing revision for ${updatedProductData.title}`
      });

      const publishResult = await nostrEventService.publishEvent(revisionEvent, signer);

      // Update product store
      const updatedProduct = await this.parseProductFromEvent(revisionEvent, publishResult.publishedRelays);
      if (updatedProduct) {
        productStore.addProduct(updatedProduct);
      }

      logger.info('Selective product update completed', {
        service: 'ShopBusinessService',
        method: 'updateProductWithSelectiveOperations',
        originalEventId,
        newEventId: revisionEvent.id,
        publishedRelays: publishResult.publishedRelays.length
      });

      return {
        success: true,
        eventId: revisionEvent.id,
        product: updatedProduct || undefined,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays
      };

    } catch (error) {
      logger.error('Selective product update failed', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'ShopBusinessService',
        method: 'updateProductWithSelectiveOperations',
        originalEventId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create attachment operation for products
   */
  public createProductAttachmentOperation(
    type: AttachmentOperationType,
    attachmentId?: string,
    files?: File[],
    fromIndex?: number,
    toIndex?: number
  ): AttachmentOperation {
    return mediaBusinessService.createAttachmentOperation(type, attachmentId, files, fromIndex, toIndex);
  }

  /**
   * Validate attachment operations for products
   */
  public async validateProductAttachmentOperations(
    operations: AttachmentOperation[],
    existingAttachments: ProductAttachment[] = []
  ): Promise<AttachmentValidationResult> {
    const genericAttachments = existingAttachments.map(att => ({
      id: att.id,
      type: att.type,
      size: att.size,
      mimeType: att.mimeType,
      name: att.name,
      hash: att.hash,
      url: att.url,
      metadata: att.metadata || {},
      originalFile: undefined // ProductAttachment doesn't have originalFile
    }));

    // For existing attachments, we can't validate files since they don't have originalFile
    // Just return a basic validation result
    return {
      valid: true,
      errors: [],
      warnings: [],
      validAttachments: [],
      invalidAttachments: [],
      totalSize: genericAttachments.reduce((sum, att) => sum + att.size, 0),
      estimatedUploadTime: 0
    };
  }
}

// Export singleton instance
export const shopBusinessService = ShopBusinessService.getInstance();

// Export convenience functions
export const createProduct = (
  productData: ProductEventData,
  imageFile: File | null,
  signer: NostrSigner,
  onProgress?: (progress: ShopPublishingProgress) => void
) => shopBusinessService.createProduct(productData, imageFile, signer, onProgress);

// NEW: Multiple attachments support
export const createProductWithAttachments = (
  productData: ProductEventData,
  attachmentFiles: File[],
  signer: NostrSigner,
  onProgress?: (progress: ShopPublishingProgress) => void
) => shopBusinessService.createProductWithAttachments(productData, attachmentFiles, signer, onProgress);

export const getAttachmentRules = () =>
  shopBusinessService.getAttachmentRules();

// NEW: Multiple attachments update support
export const updateProductWithAttachments = (
  originalEventId: string,
  updatedData: Partial<ProductEventData>,
  attachmentFiles: File[],
  signer: NostrSigner,
  userPubkey: string,
  onProgress?: (progress: ShopPublishingProgress) => void
) => shopBusinessService.updateProductWithAttachments(originalEventId, updatedData, attachmentFiles, signer, userPubkey, onProgress);

export const parseProductFromEvent = (event: NostrEvent, publishedRelays: string[] = []) =>
  shopBusinessService.parseProductFromEvent(event, publishedRelays);

export const validateProductData = (productData: ProductEventData) =>
  shopBusinessService.validateProductData(productData);

export const getProduct = (eventId: string) =>
  shopBusinessService.getProduct(eventId);

export const listProducts = () =>
  shopBusinessService.listProducts();

export const queryProductsByAuthor = (
  authorPubkey: string,
  onProgress?: (relay: string, status: 'querying' | 'success' | 'failed', count?: number) => void,
  showDeleted: boolean = false
) => shopBusinessService.queryProductsByAuthor(authorPubkey, onProgress, showDeleted);

export const deleteProduct = (
  eventId: string,
  signer: NostrSigner,
  userPubkey: string,
  onProgress?: (progress: ShopPublishingProgress) => void
) => shopBusinessService.deleteProduct(eventId, signer, userPubkey, onProgress);

// NEW: Selective attachment operations support
export const updateProductWithSelectiveOperations = (
  originalEventId: string,
  updatedData: Partial<ProductEventData>,
  operations: AttachmentOperation[],
  signer: NostrSigner,
  userPubkey: string,
  onProgress?: (progress: ShopPublishingProgress) => void
) => shopBusinessService.updateProductWithSelectiveOperations(originalEventId, updatedData, operations, signer, userPubkey, onProgress);

export const createProductAttachmentOperation = (
  type: AttachmentOperationType,
  attachmentId?: string,
  files?: File[],
  fromIndex?: number,
  toIndex?: number
) => shopBusinessService.createProductAttachmentOperation(type, attachmentId, files, fromIndex, toIndex);

export const validateProductAttachmentOperations = (
  operations: AttachmentOperation[],
  existingAttachments: ProductAttachment[] = []
) => shopBusinessService.validateProductAttachmentOperations(operations, existingAttachments);
