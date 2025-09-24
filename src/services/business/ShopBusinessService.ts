import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent } from '../../types/nostr';
import { blossomService, BlossomFileMetadata } from '../generic/GenericBlossomService';
import { nostrEventService, ProductEventData } from '../nostr/NostrEventService';
import { productStore } from '../../stores/ProductStore';

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
