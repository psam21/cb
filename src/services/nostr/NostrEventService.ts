import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent, NIP23Event, NIP23Content } from '../../types/nostr';
import { NOSTR_RELAYS } from '../../config/relays';

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
   * Create a new Kind 23 product event
   */
  public async createProductEvent(
    productData: ProductEventData,
    signer: NostrSigner
  ): Promise<NIP23Event> {
    try {
      logger.info('Creating Kind 23 product event', {
        service: 'NostrEventService',
        method: 'createProductEvent',
        title: productData.title,
        category: productData.category,
      });

      const now = Math.floor(Date.now() / 1000);
      const pubkey = await signer.getPublicKey();
      const uniqueId = `product-${now}-${Math.random().toString(36).substr(2, 9)}`;

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

      // Create event with tags
      const event: Omit<NIP23Event, 'id' | 'sig'> = {
        kind: 23,
        pubkey,
        created_at: now,
        tags: [
          ['d', uniqueId], // Required for replaceable events (NIP-33)
          ['r', '0'], // Revision number
          ['title', productData.title],
          ['lang', 'en'],
          ['author', pubkey],
          ['region', productData.location],
          ['published_at', now.toString()],
          // Product-specific tags
          ['price', productData.price.toString()],
          ['currency', productData.currency],
          ['category', productData.category],
          ['condition', productData.condition],
          ['contact', productData.contact],
          // File tags (if image provided)
          ...(productData.imageHash ? [
            ['f', productData.imageHash],
            ['type', 'image'],
            ['size', (productData.imageFile?.size || 0).toString()],
          ] : []),
          // Custom tags
          ...productData.tags.map(tag => ['t', tag]),
        ],
        content: JSON.stringify(nip23Content),
      };

      // Sign the event
      const signedEvent = await signer.signEvent(event);

      logger.info('Product event created and signed', {
        service: 'NostrEventService',
        method: 'createProductEvent',
        eventId: signedEvent.id,
        title: productData.title,
      });

      return signedEvent as NIP23Event;
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
        relayCount: NOSTR_RELAYS.length,
      });

      const publishedRelays: string[] = [];
      const failedRelays: string[] = [];

      // Publish to all relays in parallel
      const publishPromises = NOSTR_RELAYS.map(async (relay) => {
        try {
          logger.info('Publishing to relay', {
            service: 'NostrEventService',
            method: 'publishEvent',
            relayUrl: relay.url,
            eventId: event.id,
          });

          onProgress?.(relay.url, 'publishing');

          // Create WebSocket connection to relay
          const ws = new WebSocket(relay.url);
          
          return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              ws.close();
              reject(new Error('Publish timeout'));
            }, 10000); // 10 second timeout

            ws.onopen = () => {
              // Send REQ message to publish event
              const message = ['EVENT', event];
              ws.send(JSON.stringify(message));
              
              // Wait for OK response
              ws.onmessage = (msg) => {
                try {
                  const data = JSON.parse(msg.data);
                  if (data[0] === 'OK' && data[1] === event.id) {
                    clearTimeout(timeout);
                    ws.close();
                    
                    if (data[2] === true) {
                      publishedRelays.push(relay.url);
                      onProgress?.(relay.url, 'success');
                      logger.info('Event published successfully to relay', {
                        service: 'NostrEventService',
                        method: 'publishEvent',
                        relayUrl: relay.url,
                        eventId: event.id,
                      });
                      resolve();
                    } else {
                      failedRelays.push(relay.url);
                      onProgress?.(relay.url, 'failed');
                      logger.warn('Event rejected by relay', {
                        service: 'NostrEventService',
                        method: 'publishEvent',
                        relayUrl: relay.url,
                        eventId: event.id,
                        reason: data[3] || 'Unknown reason',
                      });
                      reject(new Error(data[3] || 'Event rejected'));
                    }
                  }
                } catch (parseError) {
                  logger.warn('Failed to parse relay response', {
                    service: 'NostrEventService',
                    method: 'publishEvent',
                    relayUrl: relay.url,
                    error: parseError instanceof Error ? parseError.message : 'Unknown error',
                  });
                }
              };
            };

            ws.onerror = (error) => {
              clearTimeout(timeout);
              ws.close();
              failedRelays.push(relay.url);
              onProgress?.(relay.url, 'failed');
              logger.error('WebSocket error during publish', new Error('WebSocket error'), {
                service: 'NostrEventService',
                method: 'publishEvent',
                relayUrl: relay.url,
              });
              reject(error);
            };
          });
        } catch (error) {
          failedRelays.push(relay.url);
          onProgress?.(relay.url, 'failed');
          logger.error('Failed to publish to relay', error instanceof Error ? error : new Error('Unknown error'), {
            service: 'NostrEventService',
            method: 'publishEvent',
            relayUrl: relay.url,
            eventId: event.id,
          });
        }
      });

      // Wait for all publish attempts to complete
      await Promise.allSettled(publishPromises);

      const success = publishedRelays.length > 0;
      const result: PublishingResult = {
        success,
        eventId: event.id,
        publishedRelays,
        failedRelays,
        error: success ? undefined : 'Failed to publish to any relay',
      };

      logger.info('Event publishing completed', {
        service: 'NostrEventService',
        method: 'publishEvent',
        eventId: event.id,
        publishedCount: publishedRelays.length,
        failedCount: failedRelays.length,
        success,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Event publishing failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'NostrEventService',
        method: 'publishEvent',
        eventId: event.id,
        error: errorMessage,
      });

      return {
        success: false,
        eventId: event.id,
        publishedRelays: [],
        failedRelays: NOSTR_RELAYS.map(r => r.url),
        error: errorMessage,
      };
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

      if (event.kind !== 23) {
        return {
          valid: false,
          error: 'Event must be Kind 23 for products',
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
