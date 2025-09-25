import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent, NIP23Event, NIP23Content } from '../../types/nostr';
import { blossomService, BlossomFileMetadata } from '../generic/GenericBlossomService';
import { nostrEventService, ProductEventData } from '../nostr/NostrEventService';
import { productStore } from '../../stores/ProductStore';
import { createRevisionEvent, signEvent } from '../generic/GenericEventService';
import { publishEvent, queryEvents } from '../generic/GenericRelayService';

export interface ShopProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
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
  originalEventId?: string; // For tracking revisions
  isDeleted?: boolean; // Soft delete flag
  deletedAt?: number; // Deletion timestamp
  lastModified?: number; // Last modification timestamp
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
}

export class ShopBusinessService {
  private static instance: ShopBusinessService;

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
      const product: ShopProduct = {
        id: event.id,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        currency: productData.currency,
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
   * Update an existing product by creating a revision event
   */
  public async updateProduct(
    originalEventId: string,
    updatedData: Partial<ProductEventData>,
    imageFile: File | null,
    signer: NostrSigner,
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

      const now = Math.floor(Date.now() / 1000);
      const pubkey = await signer.getPublicKey();

      // Create NIP-23 content for revision
      const nip23Content: NIP23Content = {
        title: mergedData.title,
        content: mergedData.description,
        summary: mergedData.description.substring(0, 200) + '...',
        published_at: now,
        tags: mergedData.tags,
        language: 'en',
        region: mergedData.location,
        permissions: 'public',
        file_id: mergedData.imageHash,
        file_type: 'image',
        file_size: mergedData.imageFile?.size || 0,
      };

      // Create revision event using GenericEventService
      const revisionResult = createRevisionEvent(
        {
          id: originalEventId,
          pubkey,
          created_at: originalProduct.publishedAt,
          kind: 23,
          tags: [], // This will be filled by the revision creation
          content: '',
          sig: '',
        } as NIP23Event,
        nip23Content,
        pubkey,
        1 // revision number
      );

      if (!revisionResult.success || !revisionResult.event) {
        return {
          success: false,
          error: `Failed to create revision event: ${revisionResult.error}`,
          publishedRelays: [],
          failedRelays: [],
        };
      }

      // Sign the revision event
      const signingResult = await signEvent(revisionResult.event, signer);
      if (!signingResult.success || !signingResult.signedEvent) {
        return {
          success: false,
          error: `Failed to sign revision event: ${signingResult.error}`,
          publishedRelays: [],
          failedRelays: [],
        };
      }

      onProgress?.({
        step: 'publishing',
        progress: 80,
        message: 'Publishing revision to relays...',
      });

      // Publish the revision event
      const publishResult = await publishEvent(signingResult.signedEvent, signer, (progress) => {
        onProgress?.({
          step: 'publishing',
          progress: 80 + (progress.progress * 0.2), // Map 0-100 to 80-100
          message: progress.message,
        });
      });

      if (!publishResult.success) {
        return {
          success: false,
          error: `Failed to publish revision: ${publishResult.error}`,
          publishedRelays: publishResult.publishedRelays,
          failedRelays: publishResult.failedRelays,
        };
      }

      // Create updated product object
      const updatedProduct: ShopProduct = {
        id: signingResult.signedEvent.id,
        title: mergedData.title,
        description: mergedData.description,
        price: mergedData.price,
        currency: mergedData.currency,
        imageUrl: mergedData.imageUrl,
        imageHash: mergedData.imageHash,
        tags: mergedData.tags,
        category: mergedData.category,
        condition: mergedData.condition,
        location: mergedData.location,
        contact: mergedData.contact,
        author: pubkey,
        publishedAt: now,
        eventId: signingResult.signedEvent.id,
        publishedRelays: publishResult.publishedRelays,
        originalEventId: originalEventId,
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
        newEventId: signingResult.signedEvent.id,
        publishedRelays: publishResult.publishedRelays.length,
      });

      return {
        success: true,
        product: updatedProduct,
        eventId: signingResult.signedEvent.id,
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
    showDeleted: boolean = false
  ): Promise<{ success: boolean; products: ShopProduct[]; queriedRelays: string[]; failedRelays: string[]; error?: string }> {
    try {
      logger.info('Starting product query from relays', {
        service: 'ShopBusinessService',
        method: 'queryProductsFromRelays',
      });

      // Create filters for Kind 23 events with shop tag
      const filters = [
        {
          kinds: [23], // Long-form content events
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

      // Parse events into products and group them for soft delete filtering
      const allProducts: ShopProduct[] = [];
      const eventGroups = new Map<string, { original?: ShopProduct; revisions: ShopProduct[]; deletions: ShopProduct[] }>();
      const deletedOriginalIds = new Set<string>();

      for (const event of queryResult.events) {
        // Check if this is a deletion event BEFORE parsing as product
        // Parse the JSON content to check for deletion patterns
        let isDeletedTitle = false;
        let hasDeletedDescription = false;
        
        try {
          const parsedContent = JSON.parse(event.content || '{}');
          isDeletedTitle = parsedContent.title?.includes('[DELETED]') || false;
          hasDeletedDescription = parsedContent.content?.includes('deleted by the author') || false;
        } catch (error) {
          // If JSON parsing fails, fall back to raw content check
          isDeletedTitle = event.content?.includes('[DELETED]') || false;
          hasDeletedDescription = event.content?.includes('deleted by the author') || false;
        }
        
        if (isDeletedTitle || hasDeletedDescription) {
          // This is a deletion event - find the original event ID
          const eventRefTag = event.tags.find(tag => tag[0] === 'e' && tag[2] === 'reply');
          if (eventRefTag) {
            const originalEventId = eventRefTag[1];
            deletedOriginalIds.add(originalEventId);
            logger.info('Found deletion event', {
              service: 'ShopBusinessService',
              method: 'queryProductsFromRelays',
              deletionEventId: event.id,
              originalEventId,
            });
          }
          continue; // Skip processing deletion events as products
        }
        
        const product = this.parseProductFromEvent(event);
        if (product) {
          allProducts.push(product);
          
          // This is a regular product event
          const groupKey = product.eventId;
          if (!eventGroups.has(groupKey)) {
            eventGroups.set(groupKey, { revisions: [], deletions: [] });
          }
          
          const group = eventGroups.get(groupKey)!;
          if (event.tags.some(tag => tag[0] === 'r')) {
            // This is a revision
            group.revisions.push(product);
          } else {
            // This is the original
            group.original = product;
          }
        }
      }

      // Filter out products that have deletion events (unless showDeleted is true)
      const products: ShopProduct[] = [];
      
      logger.info('Starting soft delete filtering for all products', {
        service: 'ShopBusinessService',
        method: 'queryProductsFromRelays',
        deletedOriginalIds: Array.from(deletedOriginalIds),
        eventGroupsCount: eventGroups.size,
        showDeleted,
      });
      
      for (const [eventId, group] of eventGroups) {
        const isDeleted = deletedOriginalIds.has(eventId);
        
        if (!isDeleted || showDeleted) {
          // Use the most recent revision or the original
          if (group.revisions.length > 0) {
            // Sort revisions by publishedAt and take the latest
            const latestRevision = group.revisions.sort((a, b) => b.publishedAt - a.publishedAt)[0];
            products.push(latestRevision);
            // Also add to local store for caching
            productStore.addProduct(latestRevision);
          } else if (group.original) {
            products.push(group.original);
            // Also add to local store for caching
            productStore.addProduct(group.original);
          }
        }
      }

      logger.info('Product query completed with soft delete filtering', {
        service: 'ShopBusinessService',
        method: 'queryProductsFromRelays',
        totalEvents: queryResult.events.length,
        eventGroups: eventGroups.size,
        deletedOriginalIds: deletedOriginalIds.size,
        activeProducts: products.length,
        showDeleted,
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
  public parseProductFromEvent(event: NostrEvent): ShopProduct | null {
    try {
      logger.info('Parsing product from event', {
        service: 'ShopBusinessService',
        method: 'parseProductFromEvent',
        eventId: event.id,
        kind: event.kind,
      });

      if (event.kind !== 23) {
        logger.warn('Event is not Kind 23', {
          service: 'ShopBusinessService',
          method: 'parseProductFromEvent',
          eventId: event.id,
          kind: event.kind,
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

      const product: ShopProduct = {
        id: event.id,
        title: productData.title,
        description: content.content,
        price: productData.price || 0,
        currency: productData.currency || 'USD',
        imageUrl: productData.imageHash ? `https://blossom.nostr.build/${productData.imageHash}` : undefined,
        imageHash: productData.imageHash,
        tags: productData.tags || [],
        category: productData.category || 'general',
        condition: productData.condition || 'new',
        location: productData.location || 'Unknown',
        contact: productData.contact || '',
        publishedAt: event.created_at,
        eventId: event.id,
        publishedRelays: [], // Will be populated when we have relay info
        author: event.pubkey,
      };

      logger.info('Product parsed successfully', {
        service: 'ShopBusinessService',
        method: 'parseProductFromEvent',
        productId: product.id,
        title: product.title,
        category: product.category,
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

      if (!productData.currency || productData.currency.length !== 3) {
        return {
          valid: false,
          error: 'Currency must be a 3-letter code (e.g., USD, EUR)',
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
    showDeleted: boolean = false
  ): Promise<{ success: boolean; products: ShopProduct[]; queriedRelays: string[]; failedRelays: string[]; error?: string }> {
    try {
      logger.info('Starting product query by author', {
        service: 'ShopBusinessService',
        method: 'queryProductsByAuthor',
        authorPubkey: authorPubkey.substring(0, 8) + '...',
      });

      // Create filters for Kind 23 events with shop tag and specific author
      // Also include events that might be deletion events (with [DELETED] in title)
      const filters = [
        {
          kinds: [23], // Long-form content events
          authors: [authorPubkey], // Filter by specific author
          '#t': ['culture-bridge-shop'], // Shop identifier tag
        },
        {
          kinds: [23], // Long-form content events
          authors: [authorPubkey], // Filter by specific author
          // No tag filter to catch deletion events that might not have the shop tag
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

      // Group events by their original event ID (for revisions) or event ID (for originals)
      const eventGroups = new Map<string, { original?: ShopProduct; revisions: ShopProduct[]; deletions: ShopProduct[] }>();
      const deletedOriginalIds = new Set<string>();

      for (const event of queryResult.events) {
        // Only process events that are shop-related (have culture-bridge-shop tag) or are deletion events
        const hasShopTag = event.tags.some(tag => tag[0] === 't' && tag[1] === 'culture-bridge-shop');
        const isDeletionEvent = event.content.includes('[DELETED]') || event.content.includes('deleted by the author');
        
        if (!hasShopTag && !isDeletionEvent) {
          // Skip non-shop events that aren't deletion events
          continue;
        }
        
        // Check if this is a deletion event BEFORE parsing as product
        // Parse the JSON content to check for deletion patterns
        let isDeletedTitle = false;
        let hasDeletedDescription = false;
        
        try {
          const parsedContent = JSON.parse(event.content || '{}');
          isDeletedTitle = parsedContent.title?.includes('[DELETED]') || false;
          hasDeletedDescription = parsedContent.content?.includes('deleted by the author') || false;
        } catch (error) {
          // If JSON parsing fails, fall back to raw content check
          isDeletedTitle = event.content?.includes('[DELETED]') || false;
          hasDeletedDescription = event.content?.includes('deleted by the author') || false;
        }
        
        if (isDeletedTitle || hasDeletedDescription) {
          // This is a deletion event - find the original event ID it references
          const eventRefTag = event.tags.find(tag => tag[0] === 'e' && tag[2] === 'reply');
          if (eventRefTag && eventRefTag[1]) {
            deletedOriginalIds.add(eventRefTag[1]);
            logger.info('Found deletion event', {
              service: 'ShopBusinessService',
              method: 'queryProductsByAuthor',
              deletionEventId: event.id,
              originalEventId: eventRefTag[1],
            });
          } else {
            logger.warn('Deletion event found but no event reference tag', {
              service: 'ShopBusinessService',
              method: 'queryProductsByAuthor',
              deletionEventId: event.id,
              eventTags: event.tags,
            });
          }
          // Skip processing deletion events as products - they should only be used for filtering
          continue;
        }

        const product = this.parseProductFromEvent(event);
        if (product) {
          
          // This is a regular product event
          const groupKey = product.eventId;
          if (!eventGroups.has(groupKey)) {
            eventGroups.set(groupKey, { revisions: [], deletions: [] });
          }
          
          const group = eventGroups.get(groupKey)!;
          if (event.tags.some(tag => tag[0] === 'r')) {
            // This is a revision
            group.revisions.push(product);
          } else {
            // This is the original
            group.original = product;
          }
        }
      }

      // Filter out products that have deletion events
      const activeProducts: ShopProduct[] = [];
      
      logger.info('Starting soft delete filtering', {
        service: 'ShopBusinessService',
        method: 'queryProductsByAuthor',
        deletedOriginalIds: Array.from(deletedOriginalIds),
        eventGroupsCount: eventGroups.size,
        eventGroupKeys: Array.from(eventGroups.keys()),
      });
      
      for (const [eventId, group] of eventGroups) {
        const isDeleted = deletedOriginalIds.has(eventId);
        logger.info('Processing event group for filtering', {
          service: 'ShopBusinessService',
          method: 'queryProductsByAuthor',
          eventId,
          isDeleted,
          hasOriginal: !!group.original,
          revisionsCount: group.revisions.length,
        });
        
        if (!isDeleted || showDeleted) {
          // Use the most recent revision or the original
          if (group.revisions.length > 0) {
            // Sort revisions by publishedAt and take the latest
            const latestRevision = group.revisions.sort((a, b) => b.publishedAt - a.publishedAt)[0];
            activeProducts.push(latestRevision);
          } else if (group.original) {
            activeProducts.push(group.original);
          }
        }
      }

      logger.info('Author product query completed with soft delete filtering', {
        service: 'ShopBusinessService',
        method: 'queryProductsByAuthor',
        authorPubkey: authorPubkey.substring(0, 8) + '...',
        totalEvents: queryResult.events.length,
        eventGroups: eventGroups.size,
        deletedOriginalIds: deletedOriginalIds.size,
        activeProducts: activeProducts.length,
        relayCount: queryResult.relayCount,
      });

      // Add active products to local store for caching
      for (const product of activeProducts) {
        productStore.addProduct(product);
      }

      return {
        success: true,
        products: activeProducts,
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

      // Create deletion event (Kind 23 with deletion tags)
      onProgress?.({
        step: 'creating_event',
        progress: 30,
        message: 'Creating deletion event...',
        details: 'Preparing product deletion for Nostr network',
      });

      const now = Math.floor(Date.now() / 1000);
      
      // Create NIP-23 content for deletion
      const nip23Content: NIP23Content = {
        title: `[DELETED] ${product.title}`,
        content: 'This product has been deleted by the author.',
        summary: 'Product deleted',
        published_at: now,
        tags: ['culture-bridge-shop', 'product-deletion'],
        language: 'en',
        region: product.location,
        permissions: 'public',
      };

      // Create deletion event using GenericEventService
      const deletionResult = createRevisionEvent(
        {
          id: productId,
          pubkey: userPubkey,
          created_at: product.publishedAt,
          kind: 23,
          tags: [], // This will be filled by the revision creation
          content: '',
          sig: '',
        } as NIP23Event,
        nip23Content,
        userPubkey,
        1 // revision number
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

      if (!publishResult.success) {
        return {
          success: false,
          error: `Failed to publish deletion: ${publishResult.error}`,
          publishedRelays: publishResult.publishedRelays,
          failedRelays: publishResult.failedRelays,
        };
      }

      // Don't add deletion events to ProductStore - they should only exist on relays
      // The soft delete filtering will handle this during query

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Product deleted successfully!',
        details: `Published to ${publishResult.publishedRelays.length} relays`,
      });

      logger.info('Product deleted successfully', {
        service: 'ShopBusinessService',
        method: 'deleteProduct',
        productId,
        deletionEventId: signingResult.signedEvent.id,
        publishedRelays: publishResult.publishedRelays.length,
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

export const parseProductFromEvent = (event: NostrEvent) =>
  shopBusinessService.parseProductFromEvent(event);

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
  productId: string,
  signer: NostrSigner,
  userPubkey: string,
  onProgress?: (progress: ShopPublishingProgress) => void
) => shopBusinessService.deleteProduct(productId, signer, userPubkey, onProgress);

