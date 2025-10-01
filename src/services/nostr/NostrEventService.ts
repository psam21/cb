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
        attachmentCount: productData.attachments?.length || 0,
        attachments: productData.attachments
      });

      const now = Math.floor(Date.now() / 1000);
      const pubkey = await signer.getPublicKey();

      // Create markdown content with embedded media
      let markdownContent = productData.description;
      
      // Add embedded media to markdown content
      if (productData.attachments && productData.attachments.length > 0) {
        markdownContent += '\n\n## Media\n\n';
        
        for (const attachment of productData.attachments) {
          if (attachment.type === 'image') {
            markdownContent += `![${attachment.name}](${attachment.url})\n\n`;
          } else if (attachment.type === 'video') {
            markdownContent += `[${attachment.name}](${attachment.url})\n\n`;
          } else if (attachment.type === 'audio') {
            markdownContent += `[🎵 ${attachment.name}](${attachment.url})\n\n`;
          }
        }
      }
      
      // Create NIP-23 content
      const nip23Content: NIP23Content = {
        title: productData.title,
        content: markdownContent,
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
   * Create a heritage contribution event (Kind 30023)
   * Uses GenericEventService.createNIP23Event with heritage-specific tags
   */
  public async createHeritageEvent(
    heritageData: {
      title: string;
      category: string;
      heritageType: string;
      timePeriod: string;
      sourceType: string;
      region: string;
      country: string;
      contributorRole: string;
      description: string;
      language?: string;
      community?: string;
      knowledgeKeeperContact?: string;
      tags: string[];
      attachments: Array<{
        url: string;
        type: string;
        hash?: string;
        name: string;
        size?: number;
        mimeType?: string;
        metadata?: {
          width?: number;
          height?: number;
          aspectRatio?: number;
          duration?: number;
          [key: string]: string | number | boolean | undefined;
        };
      }>;
    },
    signer: NostrSigner,
    dTag?: string
  ): Promise<NIP23Event> {
    try {
      logger.info('Creating Kind 30023 heritage contribution event', {
        service: 'NostrEventService',
        method: 'createHeritageEvent',
        title: heritageData.title,
        heritageType: heritageData.heritageType,
        dTag,
        attachmentCount: heritageData.attachments?.length || 0,
      });

      const now = Math.floor(Date.now() / 1000);
      const pubkey = await signer.getPublicKey();

      // Create markdown content with embedded media
      let markdownContent = `# ${heritageData.title}\n\n${heritageData.description}`;
      
      // Add embedded media to markdown content
      if (heritageData.attachments && heritageData.attachments.length > 0) {
        markdownContent += '\n\n## Media\n\n';
        
        for (const attachment of heritageData.attachments) {
          if (attachment.type === 'image') {
            markdownContent += `![${attachment.name}](${attachment.url})\n\n`;
          } else if (attachment.type === 'video') {
            markdownContent += `[📹 ${attachment.name}](${attachment.url})\n\n`;
          } else if (attachment.type === 'audio') {
            markdownContent += `[🎵 ${attachment.name}](${attachment.url})\n\n`;
          }
        }
      }
      
      // Create NIP-23 content
      const nip23Content: NIP23Content = {
        title: heritageData.title,
        content: markdownContent,
        summary: heritageData.description.substring(0, 200),
        published_at: now,
        tags: heritageData.tags,
        language: heritageData.language || 'en',
        region: heritageData.region,
        permissions: 'community',
      };

      // Build heritage-specific tags
      const heritageTags: string[][] = [
        ['t', 'culture-bridge-heritage-contribution'], // Heritage identifier tag
        ['title', heritageData.title],
        ['category', heritageData.category],
        ['heritage-type', heritageData.heritageType],
        ['time-period', heritageData.timePeriod],
        ['source-type', heritageData.sourceType],
        ['region', heritageData.region],
        ['country', heritageData.country],
        ['contributor-role', heritageData.contributorRole],
      ];

      // Add optional fields
      if (heritageData.language) {
        heritageTags.push(['language', heritageData.language]);
      }
      if (heritageData.community) {
        heritageTags.push(['community', heritageData.community]);
      }
      if (heritageData.knowledgeKeeperContact) {
        heritageTags.push(['knowledge-keeper', heritageData.knowledgeKeeperContact]);
      }

      // Add user tags
      heritageData.tags.forEach(tag => {
        if (tag.trim()) {
          heritageTags.push(['t', tag.trim()]);
        }
      });

      // Add media tags with hashes
      heritageData.attachments.forEach(media => {
        heritageTags.push([media.type, media.url]);
        if (media.hash) {
          // Build complete NIP-94 imeta tag with all available metadata
          const imetaParts = [`url ${media.url}`, `x ${media.hash}`];
          
          // Add mime type if available
          if (media.mimeType) {
            imetaParts.push(`m ${media.mimeType}`);
          }
          
          // Add size if available
          if (media.size) {
            imetaParts.push(`size ${media.size}`);
          }
          
          // Add dimensions if available
          if (media.metadata?.width && media.metadata?.height) {
            imetaParts.push(`dim ${media.metadata.width}x${media.metadata.height}`);
          }
          
          heritageTags.push(['imeta', ...imetaParts]);
        }
      });

      // Create event using GenericEventService
      const eventResult = createNIP23Event(nip23Content, pubkey, {
        dTag, // Pass custom d tag if provided
        tags: heritageTags,
      });

      if (!eventResult.success || !eventResult.event) {
        throw new AppError(
          'Failed to create heritage event',
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
          'Failed to sign heritage event',
          ErrorCode.NOSTR_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCategory.EXTERNAL_SERVICE,
          ErrorSeverity.HIGH,
          { error: signingResult.error }
        );
      }

      logger.info('Heritage event created and signed', {
        service: 'NostrEventService',
        method: 'createHeritageEvent',
        eventId: signingResult.signedEvent.id,
        title: heritageData.title,
      });

      return signingResult.signedEvent as NIP23Event;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create heritage event', error instanceof Error ? error : new Error(errorMessage), {
        service: 'NostrEventService',
        method: 'createHeritageEvent',
        title: heritageData.title,
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
        // Extract only the original description, not the markdown with embedded media
        let description = content.content;
        
        // Remove the "## Media" section and everything after it
        const mediaSectionIndex = description.indexOf('\n## Media');
        if (mediaSectionIndex !== -1) {
          description = description.substring(0, mediaSectionIndex).trim();
        }
        
        productData.description = description;
        
        logger.info('Description extracted from content', {
          service: 'NostrEventService',
          method: 'extractProductData',
          eventId: event.id,
          originalContentLength: content.content.length,
          extractedDescriptionLength: description.length,
          hasMediaSection: mediaSectionIndex !== -1
        });
      }

      // NEW: Extract multiple attachments from event tags
      productData.attachments = this.extractAttachmentsFromEvent(event);

      logger.info('Product data extracted successfully', {
        service: 'NostrEventService',
        method: 'extractProductData',
        eventId: event.id,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        currency: productData.currency,
        category: productData.category,
        condition: productData.condition,
        location: productData.location,
        contact: productData.contact,
        tags: productData.tags,
        attachmentCount: productData.attachments?.length || 0,
        extractedData: productData
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
    
    // Debug: Log all event tags to see what we're working with
    logger.debug('Extracting attachments from event tags', {
      service: 'NostrEventService',
      method: 'extractAttachmentsFromEvent',
      eventId: event.id,
      totalTags: event.tags.length,
      allTags: event.tags
    });
    
    // Extract attachments from imeta tags
    for (const tag of event.tags) {
      if (tag[0] === 'imeta' && tag[1]) {
        try {
          const imetaData = JSON.parse(tag[1]);
          
          // Determine media type from MIME type
          let type: 'image' | 'video' | 'audio' = 'image';
          if (imetaData.m) {
            if (imetaData.m.startsWith('video/')) type = 'video';
            else if (imetaData.m.startsWith('audio/')) type = 'audio';
            else if (imetaData.m.startsWith('image/')) type = 'image';
          }
          
          // Parse dimensions if available
          let dimensions: { width: number; height: number } | undefined;
          if (imetaData.dim && typeof imetaData.dim === 'string') {
            const [width, height] = imetaData.dim.split('x').map(Number);
            if (!isNaN(width) && !isNaN(height)) {
              dimensions = { width, height };
            }
          }
          
          const attachment: import('../business/ShopBusinessService').ProductAttachment = {
            id: `imeta-${imetaData.x || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            hash: imetaData.x || '',
            url: imetaData.url || '',
            type,
            name: imetaData.alt || 'Media attachment',
            size: imetaData.size || 0,
            mimeType: imetaData.m || 'image/jpeg',
            metadata: {
              dimensions
            }
          };
          
          attachments.push(attachment);
          
          logger.debug('Extracted attachment from imeta tag', {
            service: 'NostrEventService',
            method: 'extractAttachmentsFromEvent',
            eventId: event.id,
            attachment: attachment
          });
        } catch (error) {
          logger.warn('Failed to parse imeta tag', {
            service: 'NostrEventService',
            method: 'extractAttachmentsFromEvent',
            eventId: event.id,
            tag: tag[1],
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    logger.debug('Found attachments from imeta tags', {
      service: 'NostrEventService',
      method: 'extractAttachmentsFromEvent',
      eventId: event.id,
      attachmentCount: attachments.length,
      attachments: attachments
    });
    
    // Fallback: If no imeta attachments found but we have legacy f tag, create one
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
        
        logger.debug('Found legacy image attachment', {
          service: 'NostrEventService',
          method: 'extractAttachmentsFromEvent',
          eventId: event.id,
          legacyImageHash: legacyImageHash.substring(0, 8) + '...',
          attachmentCount: attachments.length
        });
      }
    }
    
    logger.debug('Final attachments extracted', {
      service: 'NostrEventService',
      method: 'extractAttachmentsFromEvent',
      eventId: event.id,
      finalAttachmentCount: attachments.length,
      finalAttachments: attachments
    });
    
    return attachments;
  }

  /**
   * Create attachment tags for multiple attachments
   */
  private createAttachmentTags(attachments: import('../business/ShopBusinessService').ProductAttachment[]): string[][] {
    const tags: string[][] = [];
    
    logger.debug('Creating attachment tags for multiple attachments', {
      service: 'NostrEventService',
      method: 'createAttachmentTags',
      attachmentCount: attachments.length,
      attachments: attachments
    });
    
    for (const attachment of attachments) {
      // Create imeta tag for each media file with metadata
      const imetaData = {
        url: attachment.url,
        m: attachment.mimeType,
        x: attachment.hash,
        size: attachment.size,
        dim: attachment.metadata?.dimensions ? `${attachment.metadata.dimensions.width}x${attachment.metadata.dimensions.height}` : undefined,
        alt: attachment.name || 'Media attachment'
      };
      
      // Add imeta tag with JSON metadata
      tags.push(['imeta', JSON.stringify(imetaData)]);
    }
    
    logger.debug('Created attachment tags', {
      service: 'NostrEventService',
      method: 'createAttachmentTags',
      tagCount: tags.length,
      tags: tags
    });
    
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
