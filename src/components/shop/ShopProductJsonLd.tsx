'use client';

import Script from 'next/script';
import type { ShopContentDetail } from '@/types/shop-content';

interface ShopProductJsonLdProps {
  detail: ShopContentDetail;
}

const getSiteUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return 'https://culturebridge.org';
};

export function ShopProductJsonLd({ detail }: ShopProductJsonLdProps) {
  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/shop/${detail.id}`;
  const images = detail.media
    ?.map(media => media.source.url)
    .filter((url): url is string => Boolean(url));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: detail.title,
    description: detail.summary ?? detail.description,
    image: images && images.length > 0 ? images : undefined,
    sku: detail.dTag ?? detail.id,
    category: detail.customFields.category,
    brand: detail.author.displayName ?? detail.author.npub ?? detail.author.pubkey,
    offers:
      detail.customFields.price && detail.customFields.currency
        ? {
            '@type': 'Offer',
            priceCurrency: detail.customFields.currency,
            price: detail.customFields.price,
            availability: 'https://schema.org/InStock',
            url: productUrl,
          }
        : undefined,
    url: productUrl,
    productionDate: detail.publishedAt ? new Date(detail.publishedAt * 1000).toISOString() : undefined,
  };

  const jsonString = JSON.stringify(jsonLd, (_key, value) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      return undefined;
    }
    return value;
  });

  return (
    <Script id={`product-jsonld-${detail.id}`} type="application/ld+json" strategy="afterInteractive">
      {jsonString}
    </Script>
  );
}
