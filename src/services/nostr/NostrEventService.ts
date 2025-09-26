import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent, NIP23Event, NIP23Content } from '../../types/nostr';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
import { createNIP23Event, signEvent as genericSignEvent } from '../generic/GenericEventService';
import { publishEvent as genericPublishEvent } from '../generic/GenericRelayService';

export interface ProductEventData {
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  imageHash?: string;
  imageFile?: File;
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
        file_id: productData.imageHash,
        file_type: 'image',
        file_size: productData.imageFile?.size || 0,
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
          ['t', 'culture-bridge-shop'], // Shop identifier tag
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
  ): Promise<PublishingResult> {
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

      const publishingResult: PublishingResult = {
        success: result.success,
        eventId: result.eventId,
        publishedRelays: result.publishedRelays,
        failedRelays: result.failedRelays,
        error: result.error,
      };

      if (result.success) {
        logger.info('Event publishing completed successfully', {
          service: 'NostrEventService',
          method: 'publishEvent',
          eventId: event.id,
          publishedCount: result.publishedRelays.length,
          failedCount: result.failedRelays.length,
          successRate: `${result.successRate.toFixed(1)}%`,
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

      return publishingResult;
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

      logger.info('Product data extracted successfully', {
        service: 'NostrEventService',
        method: 'extractProductData',
        eventId: event.id,
        title: productData.title,
        category: productData.category,
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
