'use client';

import { ShoppingBag, Plus, Minus } from 'lucide-react';
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
  // Subscribe to cart items to get current quantity for this product
  const items = useCartStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  
  // Find if this product is already in cart
  const cartItem = items.find(item => item.productId === productId);
  const currentQuantity = cartItem?.quantity || 0;

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

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (!cartItem) return;
    
    const newQuantity = currentQuantity + 1;
    
    // Check max quantity
    if (maxQuantity && newQuantity > maxQuantity) {
      logger.warn('Cannot increment: max quantity reached', {
        service: 'AddToCartButton',
        method: 'handleIncrement',
        productId,
        currentQuantity,
        maxQuantity,
      });
      return;
    }
    
    updateQuantity(cartItem.id, newQuantity);
  };

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (!cartItem) return;
    
    const newQuantity = currentQuantity - 1;
    
    if (newQuantity < 1) {
      // Remove item from cart
      removeItem(cartItem.id);
      logger.info('Item removed from cart', {
        service: 'AddToCartButton',
        method: 'handleDecrement',
        productId,
      });
    } else {
      updateQuantity(cartItem.id, newQuantity);
    }
  };

  // If item is not in cart, show "Add to Cart" button
  if (!cartItem) {
    return (
      <button
        onClick={handleAddToCart}
        className={`
          inline-flex items-center justify-center gap-2 px-4 py-2 
          bg-accent-600 hover:bg-accent-700 
          text-white font-medium rounded-default text-sm
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2
          ${className}
        `}
      >
        <ShoppingBag className="w-4 h-4" />
        <span>Add to Cart</span>
      </button>
    );
  }

  // If item is in cart, show quantity controls (Amazon-style)
  return (
    <div 
      className={`inline-flex items-center bg-white border-2 border-accent-600 rounded-default ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleDecrement}
        className="px-3 py-2 text-accent-600 hover:bg-accent-50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 rounded-l-default"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>
      
      <div className="px-4 py-2 text-sm font-medium text-accent-600 border-x border-accent-600 min-w-[3rem] text-center">
        {currentQuantity}
      </div>
      
      <button
        onClick={handleIncrement}
        disabled={maxQuantity ? currentQuantity >= maxQuantity : false}
        className="px-3 py-2 text-accent-600 hover:bg-accent-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-500 rounded-r-default"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
