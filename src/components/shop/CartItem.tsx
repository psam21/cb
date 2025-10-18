'use client';

import { Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/stores/useCartStore';
import { CartItem as CartItemType } from '@/types/cart';
import { logger } from '@/services/core/LoggingService';

interface CartItemProps {
  item: CartItemType;
}

const formatPrice = (price: number, currency: string): string => {
  if (currency === 'BTC') {
    return `${price.toFixed(8)} BTC`;
  }
  const upperCurrency = currency?.toUpperCase();
  if (upperCurrency === 'SATS' || upperCurrency === 'SAT' || upperCurrency === 'SATOSHIS') {
    return `${price.toFixed(0)} sats`;
  }
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
};

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);

  const handleIncrement = () => {
    const newQuantity = item.quantity + 1;
    
    // Check max quantity
    if (item.maxQuantity && newQuantity > item.maxQuantity) {
      logger.warn('Cannot increment: max quantity reached', {
        service: 'CartItem',
        method: 'handleIncrement',
        productId: item.productId,
        currentQuantity: item.quantity,
        maxQuantity: item.maxQuantity,
      });
      return;
    }
    
    updateQuantity(item.id, newQuantity);
    
    logger.info('Cart item quantity incremented', {
      service: 'CartItem',
      method: 'handleIncrement',
      itemId: item.id,
      newQuantity,
    });
  };

  const handleDecrement = () => {
    const newQuantity = item.quantity - 1;
    
    if (newQuantity < 1) {
      // Remove item if quantity would be 0
      handleRemove();
      return;
    }
    
    updateQuantity(item.id, newQuantity);
    
    logger.info('Cart item quantity decremented', {
      service: 'CartItem',
      method: 'handleDecrement',
      itemId: item.id,
      newQuantity,
    });
  };

  const handleRemove = () => {
    removeItem(item.id);
    
    logger.info('Cart item removed', {
      service: 'CartItem',
      method: 'handleRemove',
      itemId: item.id,
      productId: item.productId,
    });
  };

  const itemTotal = item.price * item.quantity;
  const priceLabel = formatPrice(item.price, item.currency);
  const totalLabel = formatPrice(itemTotal, item.currency);

  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
      {/* Product Image */}
      <Link 
        href={`/shop/${item.productId}`}
        className="flex-shrink-0 w-24 h-24 relative rounded-md overflow-hidden bg-gray-100"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link 
          href={`/shop/${item.productId}`}
          className="block group"
        >
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
            {item.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mt-1">
          {priceLabel} each
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={handleDecrement}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors rounded-l-md"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <div className="px-4 py-1.5 text-sm font-medium text-gray-900 border-x border-gray-300 min-w-[3rem] text-center">
              {item.quantity}
            </div>
            
            <button
              onClick={handleIncrement}
              disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            className="text-red-600 hover:text-red-700 transition-colors text-sm font-medium flex items-center gap-1"
            aria-label="Remove item from cart"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove</span>
          </button>
        </div>

        {item.maxQuantity && (
          <p className="text-xs text-gray-500 mt-2">
            Max available: {item.maxQuantity}
          </p>
        )}
      </div>

      {/* Item Total */}
      <div className="flex-shrink-0 text-right">
        <p className="text-lg font-semibold text-gray-900">
          {totalLabel}
        </p>
        {item.quantity > 1 && (
          <p className="text-xs text-gray-500 mt-1">
            {item.quantity} × {priceLabel}
          </p>
        )}
      </div>
    </div>
  );
}
