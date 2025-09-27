import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent, NIP23Event, NIP23Content } from '../../types/nostr';
import { blossomService, BlossomFileMetadata } from '../generic/GenericBlossomService';
import { nostrEventService, ProductEventData } from '../nostr/NostrEventService';
import { productStore } from '../../stores/ProductStore';
import { createRevisionEvent, signEvent, createNIP23Event, createDeletionEvent } from '../generic/GenericEventService';
import { publishEvent, queryEvents } from '../generic/GenericRelayService';

export interface ShopProduct {
  id: string;
  dTag: string; // NIP-33 d tag identifier for parameterized replaceable events
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
      // Extract dTag from event
      const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
      if (!dTag) {
        throw new Error('Created event missing required d tag');
      }

      const product: ShopProduct = {
        id: event.id,
        dTag, // NIP-33 d tag identifier
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
        id: updatedEvent.id,
        dTag: originalProduct.dTag, // Keep same dTag
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
          const product = this.parseProductFromEvent(event, eventRelays);
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
  public parseProductFromEvent(event: NostrEvent, publishedRelays: string[] = []): ShopProduct | null {
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

      const product: ShopProduct = {
        id: event.id,
        dTag, // NIP-33 d tag identifier
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
        publishedRelays: publishedRelays, // Use actual relay information
        author: event.pubkey,
        isDeleted, // Track deletion status
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
          const product = this.parseProductFromEvent(event, eventRelays);
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
          const product = this.parseProductFromEvent(event, eventRelays);
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
  productId: string,
  signer: NostrSigner,
  userPubkey: string,
  onProgress?: (progress: ShopPublishingProgress) => void
) => shopBusinessService.deleteProduct(productId, signer, userPubkey, onProgress);

