'use client';

import { logger } from '@/services/core/LoggingService';
import { ShopProduct } from '@/services/business/ShopBusinessService';
import { BaseCard, BaseCardData } from '@/components/ui/BaseCard';

interface ProductCardV2Props {
  product: ShopProduct;
  onContact?: (product: ShopProduct) => void;
}

export const ProductCardV2 = ({ product, onContact }: ProductCardV2Props) => {
  const formatPrice = (price: number, currency: string) => {
    if (currency === 'BTC') {
      return `${price.toFixed(8)} BTC`;
    } else if (currency === 'SATS') {
      return `${price.toFixed(0)} sats`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(price);
    }
  };

  const handleContact = () => {
    logger.info('Contact seller clicked', {
      service: 'ProductCardV2',
      method: 'handleContact',
      productId: product.id,
      title: product.title,
    });
    
    if (onContact) {
      onContact(product);
    } else {
      // Fallback: show contact information
      alert(`Contact information for "${product.title}":\n\n${product.contact}`);
    }
  };

  const handleNjumpClick = () => {
    logger.info('Njump link clicked', {
      service: 'ProductCardV2',
      method: 'handleNjumpClick',
      productId: product.id,
      eventId: product.eventId,
    });
    
    // Open njump.me link in new tab
    window.open(`https://njump.me/${product.eventId}`, '_blank');
  };

  // Convert ShopProduct to BaseCardData
  const cardData: BaseCardData = {
    id: product.id,
    title: product.title,
    description: product.description,
    image: product.imageUrl,
    tags: product.tags,
    publishedAt: product.publishedAt,
    author: {
      name: 'Anonymous',
      pubkey: product.author,
      npub: '', // Would need to convert from pubkey
    },
    metadata: {
      price: product.price,
      currency: product.currency,
      category: product.category,
      contact: product.contact,
      eventId: product.eventId,
      condition: product.condition,
      location: product.location,
    },
  };

  return (
    <BaseCard
      data={cardData}
      className="h-full flex flex-col"
      contentClassName="flex-1 flex flex-col"
    >
      {/* Price Display */}
      <div className="text-2xl font-bold text-primary-600 mb-4">
        {formatPrice(product.price, product.currency)}
      </div>

      {/* Category */}
      <div className="text-sm text-gray-500 mb-4">
        Category: <span className="font-medium">{product.category}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={handleContact}
          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
        >
          Contact Seller
        </button>
        <button
          onClick={handleNjumpClick}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
          title="View on Nostr"
        >
          📱
        </button>
      </div>
    </BaseCard>
  );
};
