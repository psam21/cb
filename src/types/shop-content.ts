import type { ContentDetail } from './content-detail';

export interface ShopCustomFields extends Record<string, unknown> {
  price: number;
  currency: string;
  category: string;
  condition: 'new' | 'used' | 'refurbished' | string;
  contactLabel?: string;
  contactHref?: string;
  inventoryStatus?: string;
  additionalMeta?: Array<{ label: string; value: string }>;
}

export type ShopContentDetail = ContentDetail<ShopCustomFields>;
