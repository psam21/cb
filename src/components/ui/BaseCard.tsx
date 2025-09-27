'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { filterVisibleTags } from '@/utils/tagFilter';

export interface BaseCardData {
  id: string;
  title: string;
  description: string;
  image?: string;
  imageUrl?: string; // Support both image and imageUrl
  tags?: string[];
  publishedAt: number;
  author?: string | {
    name?: string;
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
}

export const BaseCard = ({
  data,
  variant = 'shop',
  children,
  actionsClassName = '',
  onContact,
  onEdit,
  onDelete,
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
    } else if (currency === 'SATS') {
      return `${price.toFixed(0)} sats`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(price);
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


  const handleContact = () => {
    onContact?.(data);
  };

  const handleEdit = () => {
    onEdit?.(data);
  };

  const handleDelete = () => {
    onDelete?.(data);
  };


  const imageUrl = data.image || data.imageUrl;

  return (
    <div className="card overflow-hidden hover:shadow-xl transition-all duration-300 group">
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
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-serif font-bold text-primary-800 line-clamp-2 flex-1 mr-3">
            {data.title}
          </h3>
          {data.price && data.currency && (
            <div className="text-right">
              <p className="text-2xl font-bold text-accent-600">
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
                {data.category}
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

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (() => {
          const visibleTags = filterVisibleTags(data.tags);
          return visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {visibleTags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-accent-50 text-accent-700 text-xs rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
              {visibleTags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{visibleTags.length - 3} more
                </span>
              )}
            </div>
          );
        })()}

        {/* Contact and Published Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          <span>Published {formatDate(data.publishedAt)}</span>
          {data.publishedRelays && (
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {data.publishedRelays.length} relays
            </span>
          )}
        </div>

        {/* Dynamic Actions based on variant */}
        <div className="flex gap-2">
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

          {data.eventId && data.eventId !== 'undefined' && data.eventId.length === 64 && (
            <a
              href={`https://njump.me/${data.eventId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-sm flex items-center justify-center px-3"
              title="View on njump.me"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
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
