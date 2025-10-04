import { contentDetailService, type ContentDetailProvider } from './ContentDetailService';
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

function tryGetNpub(pubkey: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { profileService } = require('./ProfileBusinessService');
    return profileService.pubkeyToNpub(pubkey);
  } catch (error) {
    logger.warn('Failed to convert pubkey to npub', {
      service: 'ShopContentService',
      method: 'tryGetNpub',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return undefined;
  }
}

async function tryGetAuthorDisplayName(pubkey: string): Promise<string | undefined> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { profileService } = require('./ProfileBusinessService');
    const profile = await profileService.getUserProfile(pubkey);
    return profile?.display_name || undefined;
  } catch (error) {
    logger.warn('Failed to fetch author display name', {
      service: 'ShopContentService',
      method: 'tryGetAuthorDisplayName',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return undefined;
  }
}

class ShopContentService implements ContentDetailProvider<ShopCustomFields> {
  private static instance: ShopContentService;

  private constructor() {}

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

    const npub = product.author ? tryGetNpub(product.author) : undefined;
    const displayName = product.author ? await tryGetAuthorDisplayName(product.author) : undefined;

    const contactHref = product.contact
      ? product.contact.startsWith('npub')
        ? `nostr:${product.contact}`
        : product.contact.startsWith('mailto:') || product.contact.startsWith('http')
          ? product.contact
          : undefined
      : undefined;

    const description = product.description || 'Description coming soon.';
    const summary = description.length > 160 ? `${description.slice(0, 157)}…` : description;

    const contactInfo = product.contact
      ? {
          label: 'Contact Seller',
          value: product.contact,
          href: contactHref,
        }
      : undefined;

    const actions = [
      ...(product.contact
        ? [
            {
              id: 'contact-seller',
              label: 'Contact Seller',
              href: contactHref,
              type: 'primary' as const,
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
        contact: contactInfo,
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
