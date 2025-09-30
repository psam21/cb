'use client';

import { useMemo, useState } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { ContentMetaInfo } from '@/components/generic/ContentMetaInfo';
import { getCategoryById } from '@/config/categories';
import type { ShopContentDetail } from '@/types/shop-content';
import type { InfoItem } from '@/components/generic/ContentDetailInfo';

interface ShopProductDetailProps {
  detail: ShopContentDetail;
  backHref?: string;
}

const formatPrice = (price: number, currency: string): string => {
  if (currency === 'BTC') {
    return `${price.toFixed(8)} BTC`;
  }
  if (currency?.toUpperCase() === 'SATS' || currency?.toUpperCase() === 'SAT') {
    return `${price.toFixed(0)} sats`;
  }
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
};

export function ShopProductDetail({ detail, backHref = '/shop' }: ShopProductDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const priceLabel = useMemo(() => {
    if (typeof detail.customFields.price !== 'number' || !detail.customFields.currency) {
      return undefined;
    }
    return formatPrice(detail.customFields.price, detail.customFields.currency);
  }, [detail.customFields.price, detail.customFields.currency]);

  const actions = useMemo(() => {
    const filtered = detail.actions.filter(action => action.id !== 'report' && action.id !== 'contact-seller');
    return filtered.map(action => {
      // Update share button label
      if (action.id === 'share') {
        return { ...action, label: 'Share Product' };
      }
      return action;
    }).sort((a, b) => {
      if (a.id === 'share') {
        return 1;
      }
      if (b.id === 'share') {
        return -1;
      }
      return 0;
    });
  }, [detail.actions]);

  const contactAction = useMemo(() => {
    return detail.actions.find(action => action.id === 'contact-seller');
  }, [detail.actions]);

  const metadata: InfoItem[] = useMemo(() => {
    const items: InfoItem[] = [];

    if (detail.customFields.category) {
      const categoryName = getCategoryById(detail.customFields.category)?.name || detail.customFields.category;
      items.push({
        label: 'Category',
        value: categoryName,
      });
    }

    if (detail.customFields.condition) {
      items.push({
        label: 'Condition',
        value: detail.customFields.condition,
      });
    }

    if (detail.location) {
      items.push({
        label: 'Location',
        value: detail.location,
      });
    }

    return items;
  }, [detail.customFields.category, detail.customFields.condition, detail.location]);

  const supplementalMeta = useMemo(() => {
    const hiddenLabels = new Set(['Price', 'Category', 'Condition', 'Location', 'Relays']);
    return (detail.meta ?? []).filter(meta => !hiddenLabels.has(meta.label));
  }, [detail.meta]);

  const tags = useMemo(() => {
    return (detail.tags ?? []).filter(tag => tag.toLowerCase() !== 'culture-bridge-shop');
  }, [detail.tags]);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <ContentDetailHeader
          title={detail.title}
          actions={actions}
          backHref={backHref}
          backLabel="Back to products"
        />
        
        {/* Like and Bookmark buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsLiked(!isLiked)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              isLiked
                ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label={isLiked ? 'Unlike product' : 'Like product'}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{isLiked ? 'Liked' : 'Like'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              isBookmarked
                ? 'border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark product'}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-primary-500 text-primary-500' : ''}`} />
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      <ContentDetailLayout
        media={<ContentMediaGallery items={detail.media} />}
        main={
          <section
            aria-labelledby="shop-product-key-details"
            className="space-y-5 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-primary-100"
          >
            <div>
              <h2
                id="shop-product-key-details"
                className="text-sm font-semibold uppercase tracking-wide text-gray-500"
              >
                Key details
              </h2>
              {priceLabel ? (
                <p className="mt-3 text-3xl font-semibold text-primary-900">{priceLabel}</p>
              ) : (
                <p className="mt-3 text-base text-gray-600">Price available on request</p>
              )}
            </div>

            {metadata.length > 0 && (
              <dl className="grid grid-cols-1 gap-4 rounded-2xl bg-white/70 p-4 shadow-inner ring-1 ring-primary-100 md:grid-cols-2">
                {metadata.map(item => (
                  <div key={item.label}>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">{item.label}</dt>
                    <dd className="mt-1 text-base font-medium text-primary-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {supplementalMeta.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {supplementalMeta.map(meta => (
                  <span
                    key={`${meta.label}-${meta.value}`}
                    className="rounded-full border border-primary-100 bg-white px-3 py-1 text-xs font-medium text-primary-700"
                    title={meta.tooltip}
                  >
                    {meta.label}: {meta.value}
                  </span>
                ))}
              </div>
            )}
          </section>
        }
        sidebar={
          <div className="space-y-4">
            <ContentMetaInfo
              publishedAt={detail.publishedAt}
              updatedAt={detail.updatedAt}
              author={detail.author}
              relays={detail.relays}
            />
            {contactAction && (
              <button
                type="button"
                onClick={contactAction.onClick}
                className="btn-primary-sm w-full"
                aria-label={contactAction.ariaLabel ?? contactAction.label}
                disabled={contactAction.disabled}
              >
                {contactAction.label}
              </button>
            )}
          </div>
        }
        footer={
          <ContentDetailInfo
            title="About this product"
            description={detail.description}
            tags={tags}
          />
        }
      />
    </div>
  );
}
