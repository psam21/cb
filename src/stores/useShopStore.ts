/**
 * Zustand store for shop state management
 * Centralized state for products, publishing, and UI state
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ShopProduct, ShopPublishingProgress } from '@/services/business/ShopBusinessService';

export interface ShopState {
  // Products
  products: ShopProduct[];
  isLoadingProducts: boolean;
  productsError: string | null;
  
  // Publishing
  isPublishing: boolean;
  publishingProgress: ShopPublishingProgress | null;
  lastPublishingResult: {
    success: boolean;
    eventId?: string;
    publishedRelays: string[];
    failedRelays: string[];
    error?: string;
  } | null;
  
  // UI State
  showCreateForm: boolean;
  selectedProduct: ShopProduct | null;
  searchQuery: string;
  selectedCategory: string;
  sortBy: 'newest' | 'oldest' | 'price-low' | 'price-high';
  
  // Actions
  setProducts: (products: ShopProduct[]) => void;
  addProduct: (product: ShopProduct) => void;
  updateProduct: (productId: string, updates: Partial<ShopProduct>) => void;
  removeProduct: (productId: string) => void;
  setLoadingProducts: (loading: boolean) => void;
  setProductsError: (error: string | null) => void;
  
  setPublishing: (publishing: boolean) => void;
  setPublishingProgress: (progress: ShopPublishingProgress | null) => void;
  setLastPublishingResult: (result: {
    success: boolean;
    eventId?: string;
    publishedRelays: string[];
    failedRelays: string[];
    error?: string;
  } | null) => void;
  
  setShowCreateForm: (show: boolean) => void;
  setSelectedProduct: (product: ShopProduct | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sortBy: 'newest' | 'oldest' | 'price-low' | 'price-high') => void;
  
  // Computed getters
  getFilteredProducts: () => ShopProduct[];
  getProductById: (id: string) => ShopProduct | undefined;
  getProductsByCategory: (category: string) => ShopProduct[];
  getProductsByTag: (tag: string) => ShopProduct[];
  searchProducts: (query: string) => ShopProduct[];
  
  // Utility actions
  clearFilters: () => void;
  reset: () => void;
}

export const useShopStore = create<ShopState>()(
  devtools(
    (set, get) => ({
      // Initial state
      products: [],
      isLoadingProducts: false,
      productsError: null,
      
      isPublishing: false,
      publishingProgress: null,
      lastPublishingResult: null,
      
      showCreateForm: false,
      selectedProduct: null,
      searchQuery: '',
      selectedCategory: '',
      sortBy: 'newest',
      
      // Product actions
      setProducts: (products) => set({ products }),
      
      addProduct: (product) => set((state) => ({
        products: [product, ...state.products]
      })),
      
      updateProduct: (productId, updates) => set((state) => ({
        products: state.products.map(product =>
          product.id === productId ? { ...product, ...updates } : product
        )
      })),
      
      removeProduct: (productId) => set((state) => ({
        products: state.products.filter(product => product.id !== productId)
      })),
      
      setLoadingProducts: (loading) => set({ isLoadingProducts: loading }),
      
      setProductsError: (error) => set({ productsError: error }),
      
      // Publishing actions
      setPublishing: (publishing) => set({ isPublishing: publishing }),
      
      setPublishingProgress: (progress) => set({ publishingProgress: progress }),
      
      setLastPublishingResult: (result) => set({ lastPublishingResult: result }),
      
      // UI actions
      setShowCreateForm: (show) => set({ showCreateForm: show }),
      
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      // Computed getters
      getFilteredProducts: () => {
        const state = get();
        let filtered = [...state.products];
        
        // Filter by search query
        if (state.searchQuery.trim()) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(product =>
            product.title.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.tags.some(tag => tag.toLowerCase().includes(query)) ||
            product.category.toLowerCase().includes(query) ||
            product.location.toLowerCase().includes(query)
          );
        }
        
        // Filter by category
        if (state.selectedCategory) {
          filtered = filtered.filter(product => product.category === state.selectedCategory);
        }
        
        // Sort products
        filtered.sort((a, b) => {
          switch (state.sortBy) {
            case 'newest':
              return b.publishedAt - a.publishedAt;
            case 'oldest':
              return a.publishedAt - b.publishedAt;
            case 'price-low':
              return a.price - b.price;
            case 'price-high':
              return b.price - a.price;
            default:
              return 0;
          }
        });
        
        return filtered;
      },
      
      getProductById: (id) => {
        const state = get();
        return state.products.find(product => product.id === id);
      },
      
      getProductsByCategory: (category) => {
        const state = get();
        return state.products.filter(product => 
          product.category.toLowerCase() === category.toLowerCase()
        );
      },
      
      getProductsByTag: (tag) => {
        const state = get();
        return state.products.filter(product =>
          product.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
        );
      },
      
      searchProducts: (query) => {
        const state = get();
        const lowercaseQuery = query.toLowerCase();
        return state.products.filter(product =>
          product.title.toLowerCase().includes(lowercaseQuery) ||
          product.description.toLowerCase().includes(lowercaseQuery) ||
          product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
          product.category.toLowerCase().includes(lowercaseQuery) ||
          product.location.toLowerCase().includes(lowercaseQuery)
        );
      },
      
      // Utility actions
      clearFilters: () => set({
        searchQuery: '',
        selectedCategory: '',
        sortBy: 'newest'
      }),
      
      reset: () => set({
        products: [],
        isLoadingProducts: false,
        productsError: null,
        isPublishing: false,
        publishingProgress: null,
        lastPublishingResult: null,
        showCreateForm: false,
        selectedProduct: null,
        searchQuery: '',
        selectedCategory: '',
        sortBy: 'newest'
      })
    }),
    {
      name: 'shop-store',
      partialize: (state: ShopState) => ({
        // Only persist UI state, not products or publishing state
        searchQuery: state.searchQuery,
        selectedCategory: state.selectedCategory,
        sortBy: state.sortBy,
      })
    }
  )
);
