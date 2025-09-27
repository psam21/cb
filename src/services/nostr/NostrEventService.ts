import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent, NIP23Event, NIP23Content } from '../../types/nostr';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
import { createNIP23Event, signEvent as genericSignEvent } from '../generic/GenericEventService';
import { publishEvent as genericPublishEvent, RelayPublishingResult } from '../generic/GenericRelayService';

export interface ProductEventData {
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  imageHash?: string;
  imageFile?: File;
  // NEW: Multiple attachments support
  attachments?: import('../business/ShopBusinessService').ProductAttachment[];
  tags: string[];
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  location: string;
  contact: string;
}

export interface PublishingResult {
  success: boolean;
  eventId?: string;
  publishedRelays: string[];
  failedRelays: string[];
  error?: string;
}

export class NostrEventService {
  private static instance: NostrEventService;

  private constructor() {}

  public static getInstance(): NostrEventService {
    if (!NostrEventService.instance) {
      NostrEventService.instance = new NostrEventService();
    }
    return NostrEventService.instance;
  }

  /**
   * Create a new Kind 30023 parameterized replaceable product event
   */
  public async createProductEvent(
    productData: ProductEventData,
    signer: NostrSigner,
    dTag?: string
  ): Promise<NIP23Event> {
    try {
      logger.info('Creating Kind 30023 product event', {
        service: 'NostrEventService',
        method: 'createProductEvent',
        title: productData.title,
        category: productData.category,
        dTag,
      });

      const now = Math.floor(Date.now() / 1000);
      const pubkey = await signer.getPublicKey();

      // Create NIP-23 content
      const nip23Content: NIP23Content = {
        title: productData.title,
        content: productData.description,
        summary: productData.description.substring(0, 200) + '...',
        published_at: now,
        tags: productData.tags,
        language: 'en',
        region: productData.location,
        permissions: 'public',
        // For backward compatibility, use primary image if available
        file_id: productData.imageHash || (productData.attachments?.find(a => a.type === 'image')?.hash),
        file_type: 'image',
        file_size: productData.imageFile?.size || (productData.attachments?.find(a => a.type === 'image')?.size) || 0,
      };

      // Create event using GenericEventService
      const eventResult = createNIP23Event(nip23Content, pubkey, {
        dTag, // Pass custom d tag if provided
        fileMetadata: productData.imageHash ? {
          fileId: productData.imageHash,
          fileType: 'image',
          fileSize: productData.imageFile?.size || 0,
        } : undefined,
        tags: [
          ['price', productData.price.toString()],
          ['currency', productData.currency],
          ['category', productData.category],
          ['condition', productData.condition],
          ['contact', productData.contact],
          ...productData.tags.map(tag => ['t', tag]),
          // Only add culture-bridge-shop tag if not already present
          ...(productData.tags.includes('culture-bridge-shop') ? [] : [['t', 'culture-bridge-shop']]),
          // NEW: Multiple attachment tags
          ...this.createAttachmentTags(productData.attachments || []),
        ],
      });

      if (!eventResult.success || !eventResult.event) {
        throw new AppError(
          'Failed to create product event',
          ErrorCode.NOSTR_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCategory.EXTERNAL_SERVICE,
          ErrorSeverity.HIGH,
          { error: eventResult.error }
        );
      }

      // Sign the event
      const signingResult = await genericSignEvent(eventResult.event, signer);

      if (!signingResult.success || !signingResult.signedEvent) {
        throw new AppError(
          'Failed to sign product event',
          ErrorCode.NOSTR_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCategory.EXTERNAL_SERVICE,
          ErrorSeverity.HIGH,
          { error: signingResult.error }
        );
      }

      logger.info('Product event created and signed', {
        service: 'NostrEventService',
        method: 'createProductEvent',
        eventId: signingResult.signedEvent.id,
        title: productData.title,
      });

      return signingResult.signedEvent as NIP23Event;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create product event', error instanceof Error ? error : new Error(errorMessage), {
        service: 'NostrEventService',
        method: 'createProductEvent',
        title: productData.title,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Publish event to multiple relays
   */
  public async publishEvent(
    event: NostrEvent,
    signer: NostrSigner,
    onProgress?: (relay: string, status: 'publishing' | 'success' | 'failed') => void
  ): Promise<RelayPublishingResult> {
    try {
      logger.info('Publishing event to relays', {
        service: 'NostrEventService',
        method: 'publishEvent',
        eventId: event.id,
      });

      // Use GenericRelayService for publishing
      const result = await genericPublishEvent(event, signer, (progress) => {
        // Convert GenericRelayService progress to NostrEventService format
        if (progress.currentRelay) {
          if (progress.step === 'publishing') {
            onProgress?.(progress.currentRelay, 'publishing');
          } else if (progress.step === 'complete') {
            progress.publishedRelays.forEach(relay => onProgress?.(relay, 'success'));
            progress.failedRelays.forEach(relay => onProgress?.(relay, 'failed'));
          }
        }
      });

      // Return the full RelayPublishingResult with analytics data
      if (result.success) {
        logger.info('Event publishing completed successfully', {
          service: 'NostrEventService',
          method: 'publishEvent',
          eventId: event.id,
          publishedCount: result.publishedRelays.length,
          failedCount: result.failedRelays.length,
          successRate: `${result.successRate.toFixed(1)}%`,
          processingDuration: result.processingDuration,
          averageResponseTime: result.averageResponseTime,
        });
      } else {
        logger.error('Event publishing failed', new Error(result.error), {
          service: 'NostrEventService',
          method: 'publishEvent',
          eventId: event.id,
          failedRelays: result.failedRelays,
          error: result.error,
        });
      }

      return result; // Return the full RelayPublishingResult with analytics
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error during event publishing workflow', error instanceof Error ? error : new Error(errorMessage), {
        service: 'NostrEventService',
        method: 'publishEvent',
        eventId: event.id,
        error: errorMessage,
      });
      throw new AppError('Error during event publishing', ErrorCode.NOSTR_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCategory.EXTERNAL_SERVICE, ErrorSeverity.HIGH, { originalError: errorMessage });
    }
  }

  /**
   * Parse NIP-23 content from event
   */
  public parseEventContent(event: NIP23Event): NIP23Content | null {
    try {
      logger.info('Parsing NIP-23 event content', {
        service: 'NostrEventService',
        method: 'parseEventContent',
        eventId: event.id,
      });

      const content = JSON.parse(event.content) as NIP23Content;
      
      logger.info('NIP-23 content parsed successfully', {
        service: 'NostrEventService',
        method: 'parseEventContent',
        eventId: event.id,
        title: content.title,
      });

      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to parse NIP-23 content', error instanceof Error ? error : new Error(errorMessage), {
        service: 'NostrEventService',
        method: 'parseEventContent',
        eventId: event.id,
        error: errorMessage,
      });
      return null;
    }
  }

  /**
   * Extract product data from event tags
   */
  public extractProductData(event: NIP23Event): Partial<ProductEventData> {
    try {
      logger.info('Extracting product data from event', {
        service: 'NostrEventService',
        method: 'extractProductData',
        eventId: event.id,
      });

      const productData: Partial<ProductEventData> = {};
      
      // Extract data from tags
      for (const tag of event.tags) {
        switch (tag[0]) {
          case 'title':
            productData.title = tag[1];
            break;
          case 'price':
            productData.price = parseFloat(tag[1]);
            break;
          case 'currency':
            productData.currency = tag[1];
            break;
          case 'category':
            productData.category = tag[1];
            break;
          case 'condition':
            productData.condition = tag[1] as 'new' | 'used' | 'refurbished';
            break;
          case 'contact':
            productData.contact = tag[1];
            break;
          case 'region':
            productData.location = tag[1];
            break;
          case 'f':
            productData.imageHash = tag[1];
            break;
          case 't':
            if (!productData.tags) productData.tags = [];
            productData.tags.push(tag[1]);
            break;
        }
      }

      // Parse content for description
      const content = this.parseEventContent(event);
      if (content) {
        productData.description = content.content;
      }

      // NEW: Extract multiple attachments from event tags
      productData.attachments = this.extractAttachmentsFromEvent(event);

      logger.info('Product data extracted successfully', {
        service: 'NostrEventService',
        method: 'extractProductData',
        eventId: event.id,
        title: productData.title,
        category: productData.category,
        attachmentCount: productData.attachments?.length || 0,
      });

      return productData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to extract product data', error instanceof Error ? error : new Error(errorMessage), {
        service: 'NostrEventService',
        method: 'extractProductData',
        eventId: event.id,
        error: errorMessage,
      });
      return {};
    }
  }

  /**
   * Extract multiple attachments from event tags
   */
  private extractAttachmentsFromEvent(event: NIP23Event): import('../business/ShopBusinessService').ProductAttachment[] {
    const attachments: import('../business/ShopBusinessService').ProductAttachment[] = [];
    
    // Group tags by attachment ID to reconstruct attachments
    const attachmentMap = new Map<string, {
      id: string;
      hash?: string;
      type?: 'image' | 'video' | 'audio';
      size?: number;
      name?: string;
      mimeType?: string;
    }>();
    
    for (const tag of event.tags) {
      if (tag[0] === 'attachment_id' && tag[1]) {
        const attachmentId = tag[1];
        if (!attachmentMap.has(attachmentId)) {
          attachmentMap.set(attachmentId, { id: attachmentId });
        }
      }
    }
    
    // Extract data for each attachment
    for (const tag of event.tags) {
      if (tag[0] === 'attachment_id' && tag[1]) {
        const attachmentId = tag[1];
        const attachment = attachmentMap.get(attachmentId);
        
        // Find the next tags that belong to this attachment
        const attachmentIndex = event.tags.findIndex(t => t[0] === 'attachment_id' && t[1] === attachmentId);
        
        // Look for the corresponding f, file_type, file_size, file_name, mime_type tags
        for (let i = attachmentIndex + 1; i < event.tags.length; i++) {
          const nextTag = event.tags[i];
          
          // Stop if we hit another attachment_id
          if (nextTag[0] === 'attachment_id') break;
          
          if (attachment) {
            switch (nextTag[0]) {
              case 'f':
                attachment.hash = nextTag[1];
                break;
              case 'file_type':
                attachment.type = nextTag[1] as 'image' | 'video' | 'audio';
                break;
              case 'file_size':
                attachment.size = parseInt(nextTag[1]) || 0;
                break;
              case 'file_name':
                attachment.name = nextTag[1];
                break;
              case 'mime_type':
                attachment.mimeType = nextTag[1];
                break;
            }
          }
        }
      }
    }
    
    // Convert to ProductAttachment objects
    for (const [, data] of attachmentMap) {
      if (data.hash && data.type && data.mimeType) {
        attachments.push({
          id: data.id,
          hash: data.hash,
          url: '', // Will be constructed by business layer
          type: data.type,
          name: data.name || 'unknown',
          size: data.size || 0,
          mimeType: data.mimeType,
        });
      }
    }
    
    // Fallback: If no attachments found but we have legacy imageHash, create one
    if (attachments.length === 0) {
      const legacyImageHash = event.tags.find(tag => tag[0] === 'f')?.[1];
      if (legacyImageHash) {
        attachments.push({
          id: `legacy-${legacyImageHash}`,
          hash: legacyImageHash,
          url: '', // Will be constructed by business layer
          type: 'image',
          name: 'legacy-image',
          size: 0,
          mimeType: 'image/jpeg',
        });
      }
    }
    
    return attachments;
  }

  /**
   * Create attachment tags for multiple attachments
   */
  private createAttachmentTags(attachments: import('../business/ShopBusinessService').ProductAttachment[]): string[][] {
    const tags: string[][] = [];
    
    for (const attachment of attachments) {
      // Add file hash tag
      tags.push(['f', attachment.hash]);
      
      // Add file type tag
      tags.push(['file_type', attachment.type]);
      
      // Add file size tag
      tags.push(['file_size', attachment.size.toString()]);
      
      // Add file name tag (if available)
      if (attachment.name && attachment.name !== 'legacy-image') {
        tags.push(['file_name', attachment.name]);
      }
      
      // Add MIME type tag
      tags.push(['mime_type', attachment.mimeType]);
      
      // Add attachment ID for reference
      tags.push(['attachment_id', attachment.id]);
    }
    
    return tags;
  }

  /**
   * Validate event before publishing
   */
  public validateEvent(event: NostrEvent): { valid: boolean; error?: string } {
    try {
      logger.info('Validating event', {
        service: 'NostrEventService',
        method: 'validateEvent',
        eventId: event.id,
        kind: event.kind,
      });

      // Basic validation
      if (!event.id || !event.pubkey || !event.sig) {
        return {
          valid: false,
          error: 'Missing required event fields',
        };
      }

      if (event.kind !== 30023) {
        return {
          valid: false,
          error: 'Event must be Kind 30023 for products',
        };
      }

      // Validate content is valid JSON
      try {
        JSON.parse(event.content);
      } catch {
        return {
          valid: false,
          error: 'Event content must be valid JSON',
        };
      }

      logger.info('Event validation successful', {
        service: 'NostrEventService',
        method: 'validateEvent',
        eventId: event.id,
      });

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Event validation failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'NostrEventService',
        method: 'validateEvent',
        eventId: event.id,
        error: errorMessage,
      });

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }
}

// Export singleton instance
export const nostrEventService = NostrEventService.getInstance();

// Export convenience functions
export const createProductEvent = (productData: ProductEventData, signer: NostrSigner) =>
  nostrEventService.createProductEvent(productData, signer);

export const publishEvent = (event: NostrEvent, signer: NostrSigner, onProgress?: (relay: string, status: 'publishing' | 'success' | 'failed') => void) =>
  nostrEventService.publishEvent(event, signer, onProgress);

export const parseEventContent = (event: NIP23Event) =>
  nostrEventService.parseEventContent(event);

export const extractProductData = (event: NIP23Event) =>
  nostrEventService.extractProductData(event);

export const validateEvent = (event: NostrEvent) =>
  nostrEventService.validateEvent(event);
