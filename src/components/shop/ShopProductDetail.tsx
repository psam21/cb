'use client';

import { useMemo } from 'react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { ContentContactSection } from '@/components/generic/ContentContactSection';
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

  const reportAction = detail.actions.find(action => action.id === 'report');

  const handleReport = () => {
    if (!reportAction) {
      return;
    }
    if (reportAction.onClick) {
      reportAction.onClick();
      return;
    }
    if (reportAction.href) {
      const target = reportAction.external ? '_blank' : '_self';
      window.open(reportAction.href, target, reportAction.external ? 'noopener,noreferrer' : undefined);
    } else {
      alert('Report functionality is coming soon.');
    }
  };

  return (
    <div className="space-y-10">
      <ContentDetailHeader
        title={detail.title}
        subtitle={detail.summary}
        actions={detail.actions}
        backHref={backHref}
        backLabel="Back to shop"
      />

      <ContentDetailLayout
        media={<ContentMediaGallery items={detail.media} />}
        main={
          <ContentDetailInfo
            title={detail.title}
            price={priceLabel}
            summary={detail.summary}
            description={detail.description}
            metadata={metadata}
            tags={detail.tags}
            metaBadges={detail.meta}
          />
        }
        sidebar={
          <div className="space-y-6">
            <ContentContactSection contact={detail.contact} onReport={handleReport} />
            <ContentMetaInfo
              publishedAt={detail.publishedAt}
              updatedAt={detail.updatedAt}
              author={detail.author}
              relays={detail.relays}
            />
          </div>
        }
      />
    </div>
  );
}
