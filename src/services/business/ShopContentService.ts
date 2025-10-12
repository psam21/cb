import { contentDetailService } from './ContentDetailService';
import { BaseContentProvider } from './BaseContentProvider';
import { fetchProductById, type ShopProduct, type ProductAttachment } from './ShopBusinessService';
import type { ContentDetailResult, ContentMeta } from '@/types/content-detail';
import type { ShopCustomFields } from '@/types/shop-content';
import type { ContentMediaItem } from '@/types/content-media';
import { logger } from '@/services/core/LoggingService';

function createMediaItems(product: ShopProduct): ContentMediaItem[] {
  const items: ContentMediaItem[] = [];

  const appendAttachment = (attachment: ProductAttachment) => {
    if (!attachment.url) {
      return;
    }
    items.push({
      id: attachment.id,
      type: attachment.type ?? 'image',
      title: attachment.name,
      source: {
        url: attachment.url,
        mimeType: attachment.mimeType,
        size: attachment.size,
        hash: attachment.hash,
        name: attachment.name,
        dimensions: attachment.metadata?.dimensions,
        duration: attachment.metadata?.duration,
      },
      metadata: attachment.metadata,
    });
  };

  if (product.attachments && product.attachments.length > 0) {
    product.attachments.forEach(appendAttachment);
  } else if (product.imageUrl) {
    items.push({
      id: product.imageHash ? `legacy-${product.imageHash}` : `legacy-${product.id}`,
      type: 'image',
      source: {
        url: product.imageUrl,
        mimeType: 'image/jpeg',
        hash: product.imageHash,
        name: 'Primary Image',
      },
    });
  }

  return items;
}

function formatPrice(price: number, currency: string): string {
  if (currency === 'BTC') {
    return `${price.toFixed(8)} BTC`;
  }
  const upperCurrency = currency?.toUpperCase();
  if (upperCurrency === 'SATS' || upperCurrency === 'SAT' || upperCurrency === 'SATOSHIS') {
    return `${price.toFixed(0)} sats`;
  }
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  } catch (error) {
    logger.warn('Failed to format price, falling back to basic format', {
      service: 'ShopContentService',
      method: 'formatPrice',
      price,
      currency,
    });
    return `${currency} ${price}`;
  }
}

function buildMeta(product: ShopProduct, formattedPrice: string): ContentMeta[] {
  const meta: ContentMeta[] = [];

  if (formattedPrice) {
    meta.push({
      label: 'Price',
      value: formattedPrice,
    });
  }

  if (product.category) {
    meta.push({
      label: 'Category',
      value: product.category,
    });
  }

  if (product.condition) {
    meta.push({
      label: 'Condition',
      value: product.condition,
    });
  }

  if (product.location) {
    meta.push({
      label: 'Location',
      value: product.location,
    });
  }

  if (product.publishedRelays?.length) {
    meta.push({
      label: 'Relays',
      value: `${product.publishedRelays.length}`,
      tooltip: product.publishedRelays.join(', '),
    });
  }

  return meta;
}

class ShopContentService extends BaseContentProvider<ShopCustomFields> {
  private static instance: ShopContentService;

  private constructor() {
    super();
  }

  protected getServiceName(): string {
    return 'ShopContentService';
  }

  public static getInstance(): ShopContentService {
    if (!ShopContentService.instance) {
      ShopContentService.instance = new ShopContentService();
    }
    return ShopContentService.instance;
  }

  public async getContentDetail(id: string): Promise<ContentDetailResult<ShopCustomFields>> {
    const product = await fetchProductById(id);

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
        status: 404,
      };
    }

    const media = createMediaItems(product);
    const formattedPrice = formatPrice(product.price, product.currency);
    const meta = buildMeta(product, formattedPrice);

    const npub = product.author ? this.tryGetNpub(product.author) : undefined;
    const displayName = product.author ? await this.tryGetAuthorDisplayName(product.author) : undefined;

    // For messaging, we use the author's pubkey (seller)
    // If there's a separate contact npub, we'd need to decode it
    // For now, messaging goes to the product author
    const sellerPubkey = product.author;
    const productImageUrl = product.attachments?.[0]?.url || product.imageUrl;
    
    const contactHref = product.contact
      ? product.contact.startsWith('npub')
        ? `nostr:${product.contact}`
        : product.contact.startsWith('mailto:') || product.contact.startsWith('http')
          ? product.contact
          : undefined
      : undefined;

    const description = product.description || 'Description coming soon.';
    const summary = description.length > 160 ? `${description.slice(0, 157)}…` : description;

    // Old contact field removed - now using contact-seller action for messaging
    // const contactInfo = product.contact
    //   ? {
    //       label: 'Contact Seller',
    //       value: product.contact,
    //       href: contactHref,
    //     }
    //   : undefined;

    const actions = [
      ...(sellerPubkey
        ? [
            {
              id: 'contact-seller',
              label: 'Contact Seller',
              type: 'primary' as const,
              // Store seller pubkey and product info for messaging
              metadata: {
                sellerPubkey,
                productId: product.id,
                productTitle: product.title,
                productImageUrl,
              },
            },
          ]
        : []),
      {
        id: 'share',
        label: 'Share',
        type: 'secondary' as const,
      },
    ];

    return {
      success: true,
      content: {
        contentType: 'shop',
        id: product.id,
        dTag: product.dTag,
        title: product.title,
        summary,
        description,
        publishedAt: product.publishedAt,
        updatedAt: product.publishedAt,
        author: {
          pubkey: product.author,
          npub,
          displayName,
        },
        tags: product.tags,
        media,
        // contact field removed - using contact-seller action for messaging
        location: product.location,
        relays: product.publishedRelays,
        bookmarkable: true,
        shareable: true,
        customFields: {
          price: product.price,
          currency: product.currency,
          category: product.category,
          condition: product.condition,
          contactLabel: 'Contact Seller',
          contactHref,
        },
        meta,
        actions,
      },
    };
  }
}

export const shopContentService = ShopContentService.getInstance();

contentDetailService.registerProvider('shop', shopContentService);
