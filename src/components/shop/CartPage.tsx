'use client';

import { useEffect } from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/stores/useCartStore';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { useCartSync } from '@/hooks/useCartSync';
import { CartItem } from '@/components/shop/CartItem';
import { CartSummary } from '@/components/shop/CartSummary';
import { logger } from '@/services/core/LoggingService';

export function CartPage() {
  const items = useCartStore(state => state.items);
  const itemCount = useCartStore(state => state.itemCount);
  
  // Initialize signer for purchase intent workflow
  useNostrSigner();
  
  // Get sync functions from cart sync hook
  const { refreshCartFromRelay, syncCartToRelay } = useCartSync();

  // Refresh cart from relay when cart page is visited (merge with local changes)
  // Then save current state when leaving (on unmount)
  useEffect(() => {
    logger.info('Cart page mounted - refreshing from relay', {
      service: 'CartPage',
      method: 'useEffect[mount]',
      itemCount: items.length,
    });
    
    // Load latest cart from relay (merges intelligently: relay items take precedence, new local items kept)
    refreshCartFromRelay(true);
    
    // Save cart to relay when user leaves cart page
    return () => {
      logger.info('Cart page unmounting - saving to relay', {
        service: 'CartPage',
        method: 'useEffect[unmount]',
      });
      syncCartToRelay();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCartFromRelay, syncCartToRelay]); // Only run when these functions change

  logger.info('CartPage rendered', {
    service: 'CartPage',
    method: 'render',
    itemCount,
    itemsLength: items.length,
  });

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-6">
          <Link 
            href="/shop"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Continue Shopping</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600 mt-1">
                {itemCount === 0 
                  ? 'Your cart is empty'
                  : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        {items.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-100 mb-6">
              <ShoppingCart className="w-12 h-12 text-primary-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Discover unique cultural and heritage products from indigenous communities around the world.
            </p>
            <Link 
              href="/shop"
              className="btn-primary inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Browse Shop</span>
            </Link>
          </div>
        ) : (
          /* Cart Items + Summary */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Cart Summary Sidebar */}
            <div className="lg:col-span-1">
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
