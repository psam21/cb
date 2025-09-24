import { ShopProduct } from '@/services/business/ShopBusinessService';
import { logger } from '@/services/core/LoggingService';

/**
 * Simple in-memory store for products
 * This replaces the mock listProducts() method with real functionality
 */
class ProductStore {
  private static instance: ProductStore;
  private products: Map<string, ShopProduct> = new Map();

  private constructor() {}

  public static getInstance(): ProductStore {
    if (!ProductStore.instance) {
      ProductStore.instance = new ProductStore();
    }
    return ProductStore.instance;
  }

  /**
   * Add a product to the store
   */
  public addProduct(product: ShopProduct): void {
    logger.info('Adding product to store', {
      service: 'ProductStore',
      method: 'addProduct',
      productId: product.id,
      title: product.title,
    });
    
    this.products.set(product.id, product);
  }

  /**
   * Get a product by ID
   */
  public getProduct(productId: string): ShopProduct | null {
    const product = this.products.get(productId);
    
    if (product) {
      logger.info('Product retrieved from store', {
        service: 'ProductStore',
        method: 'getProduct',
        productId,
        title: product.title,
      });
    } else {
      logger.warn('Product not found in store', {
        service: 'ProductStore',
        method: 'getProduct',
        productId,
      });
    }
    
    return product || null;
  }

  /**
   * Get all products
   */
  public getAllProducts(): ShopProduct[] {
    const products = Array.from(this.products.values());
    
    logger.info('Retrieved all products from store', {
      service: 'ProductStore',
      method: 'getAllProducts',
      count: products.length,
    });
    
    return products;
  }

  /**
   * Remove a product from the store
   */
  public removeProduct(productId: string): boolean {
    const existed = this.products.has(productId);
    this.products.delete(productId);
    
    logger.info('Product removed from store', {
      service: 'ProductStore',
      method: 'removeProduct',
      productId,
      existed,
    });
    
    return existed;
  }

  /**
   * Get products by category
   */
  public getProductsByCategory(category: string): ShopProduct[] {
    const products = Array.from(this.products.values())
      .filter(product => product.category.toLowerCase() === category.toLowerCase());
    
    logger.info('Retrieved products by category', {
      service: 'ProductStore',
      method: 'getProductsByCategory',
      category,
      count: products.length,
    });
    
    return products;
  }

  /**
   * Search products
   */
  public searchProducts(query: string): ShopProduct[] {
    const lowercaseQuery = query.toLowerCase();
    const products = Array.from(this.products.values())
      .filter(product => 
        product.title.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
        product.category.toLowerCase().includes(lowercaseQuery)
      );
    
    logger.info('Searched products', {
      service: 'ProductStore',
      method: 'searchProducts',
      query: query.substring(0, 50),
      count: products.length,
    });
    
    return products;
  }

  /**
   * Get product count
   */
  public getProductCount(): number {
    return this.products.size;
  }

  /**
   * Clear all products (for testing)
   */
  public clearAll(): void {
    logger.info('Clearing all products from store', {
      service: 'ProductStore',
      method: 'clearAll',
      previousCount: this.products.size,
    });
    
    this.products.clear();
  }
}

// Export singleton instance
export const productStore = ProductStore.getInstance();

// Export convenience functions
export const addProduct = (product: ShopProduct) => productStore.addProduct(product);
export const getProduct = (productId: string) => productStore.getProduct(productId);
export const getAllProducts = () => productStore.getAllProducts();
export const removeProduct = (productId: string) => productStore.removeProduct(productId);
export const getProductsByCategory = (category: string) => productStore.getProductsByCategory(category);
export const searchProducts = (query: string) => productStore.searchProducts(query);
export const getProductCount = () => productStore.getProductCount();
export const clearAllProducts = () => productStore.clearAll();
