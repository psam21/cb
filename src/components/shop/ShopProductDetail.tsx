'use client';

import { useMemo } from 'react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { ContentMetaInfo } from '@/components/generic/ContentMetaInfo';
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
  const priceLabel = useMemo(() => {
    if (typeof detail.customFields.price !== 'number' || !detail.customFields.currency) {
      return undefined;
    }
    return formatPrice(detail.customFields.price, detail.customFields.currency);
  }, [detail.customFields.price, detail.customFields.currency]);

  const actions = useMemo(() => {
    const filtered = detail.actions.filter(action => action.id !== 'report');
    return filtered.sort((a, b) => {
      if (a.id === 'share') {
        return 1;
      }
      if (b.id === 'share') {
        return -1;
      }
      if (a.id === 'contact-seller') {
        return -1;
      }
      if (b.id === 'contact-seller') {
        return 1;
      }
      return 0;
    });
  }, [detail.actions]);

  const metadata: InfoItem[] = useMemo(() => {
    const items: InfoItem[] = [];

    if (detail.customFields.category) {
      items.push({
        label: 'Category',
        value: detail.customFields.category,
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
    const hiddenLabels = new Set(['Price', 'Category', 'Condition', 'Location']);
    return (detail.meta ?? []).filter(meta => !hiddenLabels.has(meta.label));
  }, [detail.meta]);

  return (
    <div className="space-y-10">
      <ContentDetailHeader
        title={detail.title}
        subtitle={detail.summary}
        actions={actions}
        backHref={backHref}
        backLabel="Back to products"
      />

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
          <ContentMetaInfo
            publishedAt={detail.publishedAt}
            updatedAt={detail.updatedAt}
            author={detail.author}
            relays={detail.relays}
          />
        }
        footer={
          <ContentDetailInfo
            title="About this product"
            summary={detail.summary}
            description={detail.description}
            tags={detail.tags}
          />
        }
      />
    </div>
  );
}
