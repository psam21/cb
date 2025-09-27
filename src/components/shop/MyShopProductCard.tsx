import React from 'react';
import Image from 'next/image';
import { ShopProduct } from '@/services/business/ShopBusinessService';
import { logger } from '@/services/core/LoggingService';
import { filterVisibleTags } from '@/utils/tagFilter';

interface MyShopProductCardProps {
  product: ShopProduct;
  onEdit: (product: ShopProduct) => void;
  onDelete: (product: ShopProduct) => void;
}

export const MyShopProductCard: React.FC<MyShopProductCardProps> = ({ 
  product, 
  onEdit, 
  onDelete
}) => {
  const formatPrice = (price: number, currency: string) => {
    if (currency === 'BTC' || currency === 'SATS') {
      return `${price} ${currency}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'bg-accent-100 text-accent-700';
      case 'used':
        return 'bg-primary-100 text-primary-700';
      case 'refurbished':
        return 'bg-earth-100 text-earth-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleEdit = () => {
    logger.info('Edit product clicked', {
      service: 'MyShopProductCard',
      method: 'handleEdit',
      productId: product.id,
      title: product.title,
    });
    onEdit(product);
  };

  const handleDelete = () => {
    logger.info('Delete product clicked', {
      service: 'MyShopProductCard',
      method: 'handleDelete',
      productId: product.id,
      title: product.title,
    });
    onDelete(product);
  };


  return (
    <div className="card overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Product Image */}
      <div className="relative aspect-[4/3] bg-primary-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              logger.warn('Product image failed to load', {
                service: 'MyShopProductCard',
                method: 'handleImageError',
                productId: product.id,
                imageUrl: product.imageUrl,
              });
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-primary-100">
                    <svg class="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-100">
            <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Condition Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(product.condition)}`}>
            {product.condition}
          </span>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-primary-800 mb-2 line-clamp-2">
          {product.title}
        </h3>
        <p className="text-2xl font-bold text-accent-600 mb-4">
          {formatPrice(product.price, product.currency)}
        </p>
        
        <p className="text-base mb-4 line-clamp-3 leading-relaxed text-primary-600">
          {product.description}
        </p>
        
        {/* Category and Location */}
        <div className="flex items-center justify-between mb-4">
          <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium text-sm">
            {product.category}
          </span>
          <span className="text-gray-600 text-sm">
            📍 {product.location}
          </span>
        </div>
        
        {/* Tags */}
        {product.tags.length > 0 && (() => {
          const visibleTags = filterVisibleTags(product.tags);
          return visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {visibleTags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="bg-accent-50 text-accent-700 text-xs rounded-full font-medium px-2 py-1"
                >
                  #{tag}
                </span>
              ))}
              {visibleTags.length > 3 && (
                <span className="text-gray-500 text-xs">
                  +{visibleTags.length - 3} more
                </span>
              )}
            </div>
          );
        })()}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <a
            href={`https://njump.me/${product.eventId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-sm flex items-center justify-center px-3"
            title="View on njump.me"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button 
            onClick={handleEdit} 
            className="btn-primary-sm flex-1"
          >
            Edit
          </button>
          <button 
            onClick={handleDelete} 
            className="btn-danger-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
