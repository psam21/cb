'use client';

import { ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/stores/useCartStore';
import { logger } from '@/services/core/LoggingService';

interface AddToCartButtonProps {
  productId: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  sellerPubkey: string;
  maxQuantity?: number;
  className?: string;
}

export function AddToCartButton({
  productId,
  title,
  price,
  currency,
  imageUrl,
  sellerPubkey,
  maxQuantity,
  className = '',
}: AddToCartButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop event from bubbling up to parent card's onClick handler
    e.stopPropagation();
    
    logger.info('Add to cart clicked', {
      service: 'AddToCartButton',
      method: 'handleAddToCart',
      productId,
      title,
    });

    const success = addItem({
      productId,
      title,
      price,
      currency,
      imageUrl,
      sellerPubkey,
      maxQuantity,
      quantity: 1,
    });

    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      logger.info('Item added to cart successfully', {
        service: 'AddToCartButton',
        method: 'handleAddToCart',
        productId,
      });
    } else {
      logger.warn('Failed to add item to cart', {
        service: 'AddToCartButton',
        method: 'handleAddToCart',
        productId,
        maxQuantity,
      });
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 
        bg-accent-600 hover:bg-accent-700 
        text-white font-medium rounded-default text-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2
        ${showSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
        ${className}
      `}
      disabled={showSuccess}
    >
      {showSuccess ? (
        <>
          <Check className="w-4 h-4" />
          <span>Added to Cart</span>
        </>
      ) : (
        <>
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </>
      )}
    </button>
  );
}
