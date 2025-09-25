'use client';

import { logger } from '@/services/core/LoggingService';
import { ShopProduct } from '@/services/business/ShopBusinessService';
import { BaseGrid, BaseGridData } from '@/components/ui/BaseGrid';
import { ProductCardV2 } from './ProductCardV2';

interface ProductGridV2Props {
  products: ShopProduct[];
  onContact?: (product: ShopProduct) => void;
  onEdit?: (product: ShopProduct) => void;
  onDelete?: (product: ShopProduct) => void;
  variant?: 'shop' | 'my-shop';
}

export const ProductGridV2 = ({ 
  products, 
  onContact
}: ProductGridV2Props) => {
  // Convert ShopProduct to BaseGridData
  const gridData: BaseGridData[] = products.map(product => ({
    id: product.id,
    title: product.title,
    description: product.description,
    category: product.category,
    tags: product.tags,
    publishedAt: product.publishedAt,
    // Include all product data for filtering
    price: product.price,
    currency: product.currency,
    condition: product.condition,
    location: product.location,
    author: product.author,
    contact: product.contact,
    eventId: product.eventId,
  }));

  const renderProduct = (item: BaseGridData) => {
    // Convert back to ShopProduct for the card
    const product: ShopProduct = {
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image as string | undefined,
      price: item.price as number,
      currency: item.currency as string,
      category: item.category as string,
      tags: item.tags || [],
      condition: item.condition as 'new' | 'used' | 'refurbished',
      location: item.location as string,
      contact: item.contact as string,
      author: item.author as string,
      publishedAt: item.publishedAt,
      eventId: item.eventId as string,
      publishedRelays: [], // This would need to be passed through
    };

    return (
      <ProductCardV2
        key={product.id}
        product={product}
        onContact={onContact}
      />
    );
  };

  const searchFields = [
    { key: 'title', label: 'Title', weight: 3 },
    { key: 'description', label: 'Description', weight: 2 },
    { key: 'tags', label: 'Tags', weight: 1 },
    { key: 'category', label: 'Category', weight: 1 },
  ];

  const filterFields = [
    { key: 'category', label: 'Category', type: 'select' as const },
    { key: 'condition', label: 'Condition', type: 'select' as const },
    { key: 'currency', label: 'Currency', type: 'select' as const },
  ];

  const sortOptions = [
    { key: 'publishedAt', label: 'Newest First', direction: 'desc' as const },
    { key: 'publishedAt', label: 'Oldest First', direction: 'asc' as const },
    { key: 'price', label: 'Price: Low to High', direction: 'asc' as const },
    { key: 'price', label: 'Price: High to Low', direction: 'desc' as const },
  ];

  const emptyState = {
    title: 'No products found',
    description: 'No products have been created yet',
    action: {
      label: 'Create First Product',
      onClick: () => {
        logger.info('Create first product clicked', {
          service: 'ProductGridV2',
          method: 'emptyState.action.onClick',
        });
        // This would need to be passed as a prop or handled by parent
      },
    },
  };

  return (
    <BaseGrid
      data={gridData}
      renderItem={renderProduct}
      searchFields={searchFields}
      filterFields={filterFields}
      sortOptions={sortOptions}
      emptyState={emptyState}
      searchPlaceholder="Search products..."
      gridClassName="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
    />
  );
};
