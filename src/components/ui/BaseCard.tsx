'use client';

import { ReactNode, MouseEvent, KeyboardEvent } from 'react';
import Image from 'next/image';
import { filterVisibleTags } from '@/utils/tagFilter';
import { getCategoryById } from '@/config/categories';
import { AddToCartButton } from '@/components/shop/AddToCartButton';

export interface BaseCardData {
  id: string;
  title: string;
  description: string;
  image?: string;
  imageUrl?: string; // Support both image and imageUrl
  tags?: string[];
  publishedAt: number;
  author?: string | {
    displayName?: string;
    name?: string; // Legacy support
    pubkey?: string;
    npub?: string;
  };
  metadata?: Record<string, unknown>;
  // Product-specific fields
  price?: number;
  currency?: string;
  category?: string;
  condition?: string;
  location?: string;
  contact?: string;
  eventId?: string;
  publishedRelays?: string[];
  // Any other fields
  [key: string]: unknown;
}

export interface BaseCardProps {
  data: BaseCardData;
  variant?: 'shop' | 'my-shop' | 'post' | 'event' | 'exhibition' | 'course' | 'meetup';
  children?: ReactNode;
  actionsClassName?: string;
  onContact?: (data: BaseCardData) => void;
  onEdit?: (data: BaseCardData) => void;
  onDelete?: (data: BaseCardData) => void;
  onSelect?: (data: BaseCardData) => void;
}

export const BaseCard = ({
  data,
  variant = 'shop',
  children,
  actionsClassName = '',
  onContact,
  onEdit,
  onDelete,
  onSelect,
}: BaseCardProps) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'BTC') {
      return `${price.toFixed(8)} BTC`;
    }
    const upperCurrency = currency?.toUpperCase();
    if (upperCurrency === 'SATS' || upperCurrency === 'SAT' || upperCurrency === 'SATOSHIS') {
      return `${price.toFixed(0)} sats`;
    }
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(price);
    } catch {
      return `${currency} ${price}`;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'bg-accent-100 text-accent-800';
      case 'used':
        return 'bg-primary-100 text-primary-800';
      case 'refurbished':
        return 'bg-earth-100 text-earth-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const handleContact = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onContact?.(data);
  };

  const handleEdit = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onEdit?.(data);
  };

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete?.(data);
  };

  const handleSelect = () => {
    onSelect?.(data);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(data);
    }
  };


  const imageUrl = data.image || data.imageUrl;

  return (
    <div
      className={`card overflow-hidden transition-all duration-300 group ${
        onSelect
          ? 'cursor-pointer hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-white'
          : 'hover:shadow-xl'
      }`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? 'link' : undefined}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-primary-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={data.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-primary-100">
            <div className="text-center text-primary-400">
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
              <p className="text-sm font-medium">No Image</p>
            </div>
          </div>
        )}
        
        {/* Condition Badge */}
        {data.condition && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(data.condition)}`}>
              {data.condition.charAt(0).toUpperCase() + data.condition.slice(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title and Price - Fixed height for 2 lines */}
        <div className="flex justify-between items-start mb-3 min-h-[3.5rem]">
          <h3 className="text-xl font-serif font-bold text-primary-800 line-clamp-2 flex-1 mr-3">
            {data.title}
          </h3>
          {data.price && data.currency && (
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-accent-600 whitespace-nowrap">
                {formatPrice(data.price, data.currency)}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-base mb-4 line-clamp-3 leading-relaxed">
          {data.description}
        </p>

        {/* Category and Location */}
        {(data.category || data.location) && (
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            {data.category && (
              <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">
                {getCategoryById(data.category)?.name || data.category}
              </span>
            )}
            {data.location && (
              <span className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {data.location}
              </span>
            )}
          </div>
        )}

        {/* Tags - Fixed height 1 line */}
        <div className="h-[28px] mb-4 flex items-center overflow-hidden">
          {data.tags && data.tags.length > 0 && (() => {
            const visibleTags = filterVisibleTags(data.tags);
            return visibleTags.length > 0 && (
              <div className="flex gap-2 overflow-hidden">
                {visibleTags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-accent-50 text-accent-700 text-xs rounded-full font-medium whitespace-nowrap"
                  >
                    #{tag}
                  </span>
                ))}
                {visibleTags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap">
                    +{visibleTags.length - 3} more
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Published Date and Seller Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          <span>Published {formatDate(data.publishedAt)}</span>
          {data.author && typeof data.author === 'object' && data.author.displayName && (
            <span className="flex items-center text-gray-600">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {data.author.displayName}
            </span>
          )}
        </div>

        {/* Dynamic Actions based on variant */}
        <div className="flex gap-2">
          {variant === 'shop' && data.price && data.currency && (
            <AddToCartButton
              productId={data.id}
              title={data.title}
              price={data.price}
              currency={data.currency}
              imageUrl={imageUrl}
              sellerPubkey={typeof data.author === 'string' ? data.author : data.author?.pubkey || ''}
              maxQuantity={typeof data.quantity === 'number' ? data.quantity : undefined}
              className="flex-1"
            />
          )}
          
          {variant === 'shop' && onContact && (
            <button
              onClick={handleContact}
              className="flex-1 btn-primary-sm"
            >
              Contact Seller
            </button>
          )}
          
          {variant === 'my-shop' && onEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 btn-primary-sm"
            >
              Edit
            </button>
          )}
          
          {variant === 'my-shop' && onDelete && (
            <button
              onClick={handleDelete}
              className="flex-1 btn-danger-sm"
            >
              Delete
            </button>
          )}

          {/* Custom actions */}
          {children && (
            <div className={`flex gap-2 ${actionsClassName}`}>
              {children}
            </div>
          )}
        </div>

        {/* Event ID (for debugging) */}
        {process.env.NODE_ENV === 'development' && data.eventId && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500">
            <p>Event ID: {data.eventId}</p>
            <p>Author: {typeof data.author === 'string' ? data.author.substring(0, 16) + '...' : data.author?.pubkey?.substring(0, 16) + '...'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
