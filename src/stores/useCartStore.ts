/**
 * Zustand store for shopping cart state management
 * Client-side cart with persistence across sessions
 * 
 * Note: Relay synchronization handled by useCartSync hook (SOA compliance)
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CartItem, AddToCartParams } from '@/types/cart';
import { logger } from '@/services/core/LoggingService';

// Currency conversion rates (approximate, for total calculation)
const CURRENCY_TO_SATS: Record<string, number> = {
  'BTC': 100_000_000, // 1 BTC = 100M sats
  'SATS': 1,
  'SAT': 1,
  'SATOSHIS': 1,
  'USD': 3_000, // Approximate: $30k per BTC
  'EUR': 3_200,
  'GBP': 3_500,
};



export interface CartState {
  // Cart state
  items: CartItem[];
  
  // Computed values (derived from items)
  itemCount: number;
  totalSats: number;
  
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  
  // Actions
  addItem: (params: AddToCartParams) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => boolean;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  
  // Internal helpers
  _computeItemCount: () => number;
  _computeTotalSats: () => number;
  _updateComputedValues: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        items: [],
        itemCount: 0,
        totalSats: 0,
        
        // Hydration state
        _hasHydrated: false,
        
        // Actions
        setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
        
        addItem: (params: AddToCartParams) => {
          const { productId, title, price, currency, imageUrl, sellerPubkey, maxQuantity, quantity = 1 } = params;
          
          // Check if item already exists
          const existingItem = get().items.find(item => item.productId === productId);
          
          if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;
            
            // Check max quantity
            if (maxQuantity && newQuantity > maxQuantity) {
              logger.warn('Cannot add to cart: exceeds max quantity', {
                service: 'useCartStore',
                method: 'addItem',
                productId,
                currentQuantity: existingItem.quantity,
                requestedQuantity: quantity,
                maxQuantity,
              });
              return false;
            }
            
            set({
              items: get().items.map(item => 
                item.productId === productId 
                  ? { ...item, quantity: newQuantity } 
                  : item
              )
            });
            
            get()._updateComputedValues();
            
            logger.info('Updated cart item quantity', {
              service: 'useCartStore',
              method: 'addItem',
              productId,
              newQuantity,
            });
            
            return true;
          }
          
          // Check quantity is valid
          if (maxQuantity && quantity > maxQuantity) {
            logger.warn('Cannot add to cart: quantity exceeds max', {
              service: 'useCartStore',
              method: 'addItem',
              productId,
              quantity,
              maxQuantity,
            });
            return false;
          }
          
          // Add new item
          const newItem: CartItem = {
            id: `${productId}-${Date.now()}`,
            productId,
            title,
            price,
            currency,
            quantity,
            imageUrl,
            sellerPubkey,
            maxQuantity,
            addedAt: Date.now(),
          };
          
          set({
            items: [...get().items, newItem]
          });
          
          get()._updateComputedValues();
          
          logger.info('Added item to cart', {
            service: 'useCartStore',
            method: 'addItem',
            productId,
            title,
            quantity,
          });
          
          return true;
        },
        
        removeItem: (itemId: string) => {
          set({
            items: get().items.filter(item => item.id !== itemId)
          });
          
          get()._updateComputedValues();
          
          logger.info('Removed item from cart', {
            service: 'useCartStore',
            method: 'removeItem',
            itemId,
          });
        },
        
        updateQuantity: (itemId: string, quantity: number) => {
          const item = get().items.find(i => i.id === itemId);
          
          if (!item) {
            logger.warn('Item not found in cart', {
              service: 'useCartStore',
              method: 'updateQuantity',
              itemId,
            });
            return false;
          }
          
          // Check quantity is valid
          if (quantity < 1) {
            get().removeItem(itemId);
            return true;
          }
          
          if (item.maxQuantity && quantity > item.maxQuantity) {
            logger.warn('Cannot update quantity: exceeds max', {
              service: 'useCartStore',
              method: 'updateQuantity',
              itemId,
              quantity,
              maxQuantity: item.maxQuantity,
            });
            return false;
          }
          
          set({
            items: get().items.map(item => 
              item.id === itemId 
                ? { ...item, quantity } 
                : item
            )
          });
          
          get()._updateComputedValues();
          
          logger.info('Updated cart item quantity', {
            service: 'useCartStore',
            method: 'updateQuantity',
            itemId,
            quantity,
          });
          
          return true;
        },
        
        clearCart: () => {
          set({
            items: [],
            itemCount: 0,
            totalSats: 0,
          });
          
          logger.info('Cleared cart', {
            service: 'useCartStore',
            method: 'clearCart',
          });
        },
        
        getTotal: () => {
          return get().totalSats;
        },
        
        getItemCount: () => {
          return get().itemCount;
        },
        
        // Internal helpers
        _computeItemCount: () => {
          return get().items.reduce((total, item) => total + item.quantity, 0);
        },
        
        _computeTotalSats: () => {
          return get().items.reduce((total, item) => {
            const currencyUpper = item.currency.toUpperCase();
            const conversionRate = CURRENCY_TO_SATS[currencyUpper] || CURRENCY_TO_SATS['USD'];
            const itemTotalSats = item.price * item.quantity * conversionRate;
            return total + itemTotalSats;
          }, 0);
        },
        
        _updateComputedValues: () => {
          const itemCount = get()._computeItemCount();
          const totalSats = get()._computeTotalSats();
          
          set({
            itemCount,
            totalSats,
          });
        },
      }),
      {
        name: 'cart-store',
        partialize: (state: CartState) => ({
          // Persist only cart items
          items: state.items,
        }),
        onRehydrateStorage: () => (state) => {
          // Recompute derived values after rehydration
          state?._updateComputedValues();
          state?.setHasHydrated(true);
        },
      }
    ),
    {
      name: 'cart-store-devtools'
    }
  )
);
