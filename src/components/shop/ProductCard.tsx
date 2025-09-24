'use client';

import { useState } from 'react';
import Image from 'next/image';
import { logger } from '@/services/core/LoggingService';
import { ShopProduct } from '@/services/business/ShopBusinessService';

interface ProductCardProps {
  product: ShopProduct;
  onContact?: (product: ShopProduct) => void;
}

export const ProductCard = ({ product, onContact }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    logger.warn('Product image failed to load', {
      service: 'ProductCard',
      method: 'handleImageError',
      productId: product.id,
      imageUrl: product.imageUrl,
    });
    setImageError(true);
  };

  const handleContact = () => {
    logger.info('Contact button clicked', {
      service: 'ProductCard',
      method: 'handleContact',
      productId: product.id,
      title: product.title,
    });
    onContact?.(product);
  };

  const formatPrice = (price: number, currency: string): string => {
    if (currency === 'BTC' || currency === 'SATS') {
      return `${price} ${currency}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getConditionColor = (condition: string): string => {
    switch (condition) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-yellow-100 text-yellow-800';
      case 'refurbished':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div className="relative aspect-video bg-gray-100">
        {product.imageUrl && !imageError ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <div className="text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">No Image</p>
            </div>
          </div>
        )}
        
        {/* Condition Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(product.condition)}`}>
            {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
            {product.title}
          </h3>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">
              {formatPrice(product.price, product.currency)}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {product.description}
        </p>

        {/* Category and Location */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="bg-gray-100 px-2 py-1 rounded-full">
            {product.category}
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {product.location}
          </span>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{product.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Contact and Published Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span>Published {formatDate(product.publishedAt)}</span>
          <span>{product.publishedRelays.length} relays</span>
        </div>

        {/* Contact Button */}
        <button
          onClick={handleContact}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Contact Seller
        </button>

        {/* Event ID (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500">
            <p>Event ID: {product.eventId}</p>
            <p>Author: {product.author.substring(0, 16)}...</p>
          </div>
        )}
      </div>
    </div>
  );
};
