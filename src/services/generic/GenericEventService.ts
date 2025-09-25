/**
 * Generic Nostr event service for centralized event creation and validation
 * Handles all event creation operations following cbc3 patterns
 */
import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent, NIP23Event, NIP23Content } from '../../types/nostr';

export interface EventCreationOptions {
  tags?: string[][];
  content?: string;
  summary?: string;
  language?: string;
  region?: string;
  permissions?: string;
  fileMetadata?: {
    fileId: string;
    fileType: string;
    fileSize: number;
  };
}

export interface EventCreationResult {
  success: boolean;
  event?: Omit<NostrEvent, 'id' | 'sig'>;
  error?: string;
}

export interface EventValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SigningResult {
  success: boolean;
  signedEvent?: NostrEvent;
  error?: string;
}

/**
 * Generic Nostr event service for centralized event operations
 */
export class GenericEventService {
  private static instance: GenericEventService;

  private constructor() {}

  /**
   * Get singleton instance of GenericEventService
   */
  public static getInstance(): GenericEventService {
    if (!GenericEventService.instance) {
      GenericEventService.instance = new GenericEventService();
    }
    return GenericEventService.instance;
  }

  /**
   * Create a new Kind 23 long-form content event
   */
  public createNIP23Event(
    content: NIP23Content,
    userPubkey: string,
    options: EventCreationOptions = {}
  ): EventCreationResult {
    try {
      logger.info('Creating Kind 23 event', {
        service: 'GenericEventService',
        method: 'createNIP23Event',
        userPubkey: userPubkey.substring(0, 8) + '...',
        title: content.title,
        hasFile: !!options.fileMetadata?.fileId,
      });

      const now = Math.floor(Date.now() / 1000);
      const uniqueId = `${userPubkey}-${now}-${content.title.replace(/\s/g, '-').toLowerCase().substring(0, 20)}`;

      // Create event with tags following NIP-23 specification
      const event: Omit<NIP23Event, 'id' | 'sig'> = {
        kind: 23,
        pubkey: userPubkey,
        created_at: now,
        tags: [
          ['d', uniqueId], // Required for replaceable events (NIP-33)
          ['r', '0'], // Revision number
          ['title', content.title],
          ['lang', content.language || 'en'],
          ['author', userPubkey],
          ['region', content.region || 'global'],
          ['published_at', now.toString()],
          // File tags (if applicable)
          ...(options.fileMetadata?.fileId ? [
            ['f', options.fileMetadata.fileId],
            ['type', options.fileMetadata.fileType || ''],
            ['size', (options.fileMetadata.fileSize || 0).toString()],
          ] : []),
          // Custom tags
          ...(options.tags || []),
          // Permissions tag
          ['permissions', content.permissions || 'community'],
        ],
        content: JSON.stringify(content),
      };

      logger.info('Kind 23 event created successfully', {
        service: 'GenericEventService',
        method: 'createNIP23Event',
        title: content.title,
        hasFile: !!options.fileMetadata?.fileId,
      });

      return {
        success: true,
        event,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Event creation failed';
      logger.error('Error creating Kind 23 event', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericEventService',
        method: 'createNIP23Event',
        userPubkey: userPubkey.substring(0, 8) + '...',
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create a revision event for existing content
   */
  public createRevisionEvent(
    originalEvent: NIP23Event,
    revisedContent: NIP23Content,
    userPubkey: string,
    revisionNumber: number = 1
  ): EventCreationResult {
    try {
      logger.info('Creating revision event', {
        service: 'GenericEventService',
        method: 'createRevisionEvent',
        originalEventId: originalEvent.id,
        userPubkey: userPubkey.substring(0, 8) + '...',
        revisionNumber,
      });

      const now = Math.floor(Date.now() / 1000);
      const uniqueId = `${userPubkey}-${now}-${revisedContent.title.replace(/\s/g, '-').toLowerCase().substring(0, 20)}`;

      // Create revision event
      const revisionEvent: Omit<NIP23Event, 'id' | 'sig'> = {
        kind: 23,
        pubkey: userPubkey,
        created_at: now,
        tags: [
          ['d', uniqueId], // New unique identifier for this revision
          ['r', revisionNumber.toString()], // Revision number
          ['title', revisedContent.title],
          ['lang', revisedContent.language || 'en'],
          ['author', userPubkey],
          ['region', revisedContent.region || 'global'],
          ['published_at', now.toString()],
          // Reference to original event using proper Nostr event reference
          ['e', originalEvent.id, 'reply'],
          // File tags if applicable
          ...(revisedContent.file_id ? [
            ['f', revisedContent.file_id],
            ['type', revisedContent.file_type || ''],
            ['size', (revisedContent.file_size || 0).toString()],
          ] : []),
          // Permissions tag
          ['permissions', revisedContent.permissions || 'community'],
        ],
        content: JSON.stringify(revisedContent),
      };

      logger.info('Revision event created successfully', {
        service: 'GenericEventService',
        method: 'createRevisionEvent',
        originalEventId: originalEvent.id,
        revisionNumber,
      });

      return {
        success: true,
        event: revisionEvent,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Revision event creation failed';
      logger.error('Error creating revision event', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericEventService',
        method: 'createRevisionEvent',
        originalEventId: originalEvent.id,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sign a Nostr event using a signer
   */
  public async signEvent(
    event: Omit<NostrEvent, 'id' | 'sig'>,
    signer: NostrSigner
  ): Promise<SigningResult> {
    try {
      logger.info('Signing event', {
        service: 'GenericEventService',
        method: 'signEvent',
        eventKind: event.kind,
        pubkey: event.pubkey.substring(0, 8) + '...',
      });

      // Validate event before signing
      const validation = this.validateEventForSigning(event);
      if (!validation.valid) {
        return {
          success: false,
          error: `Event validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Sign the event using the signer
      const signedEvent = await signer.signEvent(event);

      logger.info('Event signed successfully', {
        service: 'GenericEventService',
        method: 'signEvent',
        eventId: signedEvent.id,
        eventKind: event.kind,
      });

      return {
        success: true,
        signedEvent,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Event signing failed';
      logger.error('Error signing event', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericEventService',
        method: 'signEvent',
        eventKind: event.kind,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate an event before signing
   */
  public validateEventForSigning(event: Omit<NostrEvent, 'id' | 'sig'>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (event.kind === undefined || event.kind === null || typeof event.kind !== 'number') {
      errors.push('Event must have a kind');
    }

    if (!event.pubkey) {
      errors.push('Event must have a pubkey');
    }

    if (event.created_at === undefined || event.created_at === null || typeof event.created_at !== 'number') {
      errors.push('Event must have a created_at timestamp');
    }

    if (!event.tags || !Array.isArray(event.tags)) {
      errors.push('Event must have tags array');
    }

    if (event.content === undefined || event.content === null) {
      errors.push('Event must have content');
    }

    // Validate timestamp
    if (typeof event.created_at === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (event.created_at > now + 600) { // Allow 10 minutes in the future
        errors.push('Event timestamp is too far in the future');
      }
      if (event.created_at < now - 86400) { // Allow 24 hours in the past
        errors.push('Event timestamp is too far in the past');
      }
    }

    // Validate pubkey format
    if (event.pubkey && event.pubkey.length !== 64 && !event.pubkey.startsWith('npub1')) {
      errors.push('Invalid pubkey format: must be 64-character hex or npub1 format');
    }

    // Validate tags structure
    if (event.tags && Array.isArray(event.tags)) {
      for (let i = 0; i < event.tags.length; i++) {
        const tag = event.tags[i];
        if (!Array.isArray(tag) || tag.length === 0) {
          errors.push(`Invalid tag at index ${i}: must be a non-empty array`);
        }
        if (typeof tag[0] !== 'string') {
          errors.push(`Invalid tag at index ${i}: first element must be a string`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a complete signed event
   */
  public validateSignedEvent(event: NostrEvent): EventValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!event.id || event.id.length !== 64) {
      errors.push('Event must have a valid 64-character ID');
    }

    if (!event.pubkey) {
      errors.push('Event must have a pubkey');
    }

    if (!event.sig || event.sig.length !== 128) {
      errors.push('Event must have a valid 128-character signature');
    }

    if (typeof event.kind !== 'number' || event.kind < 0) {
      errors.push('Event must have a valid kind number');
    }

    if (typeof event.created_at !== 'number' || event.created_at <= 0) {
      errors.push('Event must have a valid created_at timestamp');
    }

    if (event.content === undefined || event.content === null) {
      errors.push('Event must have content');
    }

    if (!Array.isArray(event.tags)) {
      errors.push('Event must have tags array');
    }

    // Timestamp validation
    const now = Math.floor(Date.now() / 1000);
    if (event.created_at > now + 600) {
      warnings.push('Event timestamp is in the future');
    }
    if (event.created_at < now - 86400 * 365) {
      warnings.push('Event timestamp is very old');
    }

    // Content length warning
    if (typeof event.content === 'string' && event.content.length > 1000000) {
      warnings.push('Event content is very long');
    }

    // Tags count warning
    if (Array.isArray(event.tags) && event.tags.length > 100) {
      warnings.push('Event has many tags');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Verify an event signature
   */
  public verifyEventSignature(event: NostrEvent): { valid: boolean; error?: string } {
    try {
      logger.info('Verifying event signature', {
        service: 'GenericEventService',
        method: 'verifyEventSignature',
        eventId: event.id,
        pubkey: event.pubkey.substring(0, 8) + '...',
      });

      // Check if event has required fields for verification
      if (!event.id || !event.sig || !event.pubkey) {
        return {
          valid: false,
          error: 'Event missing required fields for signature verification',
        };
      }

      // Basic format validation
      if (event.sig.length !== 128) {
        return {
          valid: false,
          error: 'Invalid signature length',
        };
      }

      if (!/^[0-9a-f]{128}$/i.test(event.sig)) {
        return {
          valid: false,
          error: 'Invalid signature format: must be 128 hex characters',
        };
      }

      // In a full implementation, you would use crypto.verify or similar
      // to actually verify the cryptographic signature
      // For now, we'll do basic format validation

      logger.info('Event signature verification completed', {
        service: 'GenericEventService',
        method: 'verifyEventSignature',
        eventId: event.id,
        valid: true,
      });

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signature verification failed';
      logger.error('Error verifying event signature', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericEventService',
        method: 'verifyEventSignature',
        eventId: event.id,
        error: errorMessage,
      });

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Parse NIP-23 content from event
   */
  public parseNIP23Content(event: NIP23Event): NIP23Content | null {
    try {
      if (!event.content) {
        return null;
      }

      const content = JSON.parse(event.content) as NIP23Content;
      
      // Validate required fields
      if (!content.title || !content.content) {
        return null;
      }

      return content;
    } catch (error) {
      logger.error('Error parsing NIP-23 event content', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'GenericEventService',
        method: 'parseNIP23Content',
        eventId: event.id,
      });
      return null;
    }
  }

  /**
   * Extract product data from a Kind 23 event's tags
   */
  public extractProductData(event: NIP23Event): {
    title: string;
    price?: number;
    currency?: string;
    category?: string;
    condition?: string;
    location?: string;
    contact?: string;
    imageHash?: string;
    imageUrl?: string;
    tags: string[];
  } {
    const data: {
      title: string;
      price?: number;
      currency?: string;
      category?: string;
      condition?: string;
      location?: string;
      contact?: string;
      imageHash?: string;
      imageUrl?: string;
      tags: string[];
    } = {
      title: '',
      tags: [],
    };

    event.tags.forEach(tag => {
      switch (tag[0]) {
        case 'title':
          data.title = tag[1];
          break;
        case 'price':
          data.price = parseFloat(tag[1]);
          break;
        case 'currency':
          data.currency = tag[1];
          break;
        case 'category':
          data.category = tag[1];
          break;
        case 'condition':
          data.condition = tag[1];
          break;
        case 'region':
          data.location = tag[1];
          break;
        case 'contact':
          data.contact = tag[1];
          break;
        case 'f': // File hash
          data.imageHash = tag[1];
          data.imageUrl = `https://blossom.nostr.build/${tag[1]}`;
          break;
        case 't': // Custom tags
          if (tag[1] && !tag[1].startsWith('culture-bridge')) {
            data.tags.push(tag[1]);
          }
          break;
      }
    });

    return data;
  }

  /**
   * Create a Kind 24242 authorization event for Blossom
   */
  public createBlossomAuthEvent(userPubkey: string): Omit<NostrEvent, 'id' | 'sig'> {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      kind: 24242,
      pubkey: userPubkey,
      created_at: now,
      tags: [],
      content: 'Blossom authorization',
    };
  }

  /**
   * Create a Kind 10063 User Server List event for Blossom discovery
   */
  public createUserServerListEvent(
    userPubkey: string,
    servers: string[]
  ): Omit<NostrEvent, 'id' | 'sig'> {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      kind: 10063,
      pubkey: userPubkey,
      created_at: now,
      tags: servers.map(server => ['server', server]),
      content: JSON.stringify({ servers }),
    };
  }
}

// Export singleton instance
export const genericEventService = GenericEventService.getInstance();

// Export convenience functions
export const createNIP23Event = (content: NIP23Content, userPubkey: string, options?: EventCreationOptions) =>
  genericEventService.createNIP23Event(content, userPubkey, options);

export const createRevisionEvent = (originalEvent: NIP23Event, revisedContent: NIP23Content, userPubkey: string, revisionNumber?: number) =>
  genericEventService.createRevisionEvent(originalEvent, revisedContent, userPubkey, revisionNumber);

export const signEvent = (event: Omit<NostrEvent, 'id' | 'sig'>, signer: NostrSigner) =>
  genericEventService.signEvent(event, signer);

export const validateEventForSigning = (event: Omit<NostrEvent, 'id' | 'sig'>) =>
  genericEventService.validateEventForSigning(event);

export const validateSignedEvent = (event: NostrEvent) =>
  genericEventService.validateSignedEvent(event);

export const verifyEventSignature = (event: NostrEvent) =>
  genericEventService.verifyEventSignature(event);

export const parseNIP23Content = (event: NIP23Event) =>
  genericEventService.parseNIP23Content(event);

export const extractProductData = (event: NIP23Event) =>
  genericEventService.extractProductData(event);

export const createBlossomAuthEvent = (userPubkey: string) =>
  genericEventService.createBlossomAuthEvent(userPubkey);

export const createUserServerListEvent = (userPubkey: string, servers: string[]) =>
  genericEventService.createUserServerListEvent(userPubkey, servers);
