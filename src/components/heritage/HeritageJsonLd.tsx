'use client';

import Script from 'next/script';
import type { ContentDetail } from '@/types/content-detail';
import type { HeritageCustomFields } from '@/types/heritage-content';

interface HeritageJsonLdProps {
  detail: ContentDetail<HeritageCustomFields>;
}

const getSiteUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return 'https://culturebridge.vercel.app';
};

export function HeritageJsonLd({ detail }: HeritageJsonLdProps) {
  const siteUrl = getSiteUrl();
  const heritageUrl = `${siteUrl}/heritage/${detail.id}`;
  const images = detail.media
    ?.map(media => media.source.url)
    .filter((url): url is string => Boolean(url));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: detail.title,
    description: detail.summary ?? detail.description,
    image: images && images.length > 0 ? images : undefined,
    author: {
      '@type': 'Person',
      name: detail.author.displayName ?? detail.author.npub ?? detail.author.pubkey,
      url: detail.author.profileUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Culture Bridge',
      url: siteUrl,
    },
    datePublished: detail.publishedAt ? new Date(detail.publishedAt * 1000).toISOString() : undefined,
    dateModified: detail.updatedAt ? new Date(detail.updatedAt * 1000).toISOString() : undefined,
    url: heritageUrl,
    inLanguage: detail.customFields.language ?? undefined,
    about: detail.customFields.category
      ? {
          '@type': 'Thing',
          name: detail.customFields.category,
        }
      : undefined,
    spatialCoverage: detail.customFields.regionOrigin
      ? {
          '@type': 'Place',
          name: detail.customFields.regionOrigin,
          address: detail.customFields.country
            ? {
                '@type': 'PostalAddress',
                addressCountry: detail.customFields.country,
              }
            : undefined,
        }
      : undefined,
    temporal: detail.customFields.timePeriod ?? undefined,
    additionalType: detail.customFields.heritageType
      ? `https://culturebridge.vercel.app/heritage-types/${encodeURIComponent(detail.customFields.heritageType.toLowerCase())}`
      : undefined,
  };

  const jsonString = JSON.stringify(jsonLd, (_key, value) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      return undefined;
    }
    return value;
  });

  return (
    <Script id={`heritage-jsonld-${detail.id}`} type="application/ld+json" strategy="afterInteractive">
      {jsonString}
    </Script>
  );
}
