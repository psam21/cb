'use client';

import { useMemo, useState } from 'react';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { ContentMetaInfo } from '@/components/generic/ContentMetaInfo';
import type { HeritageContentDetail } from '@/types/heritage-content';
import type { InfoItem } from '@/components/generic/ContentDetailInfo';

interface HeritageDetailProps {
  detail: HeritageContentDetail;
  backHref?: string;
}

export function HeritageDetail({ detail, backHref = '/heritage' }: HeritageDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const actions = useMemo(() => {
    const filtered = detail.actions.filter(action => 
      action.id !== 'report' && 
      action.id !== 'share' &&
      action.id !== 'contact-author'
    );
    return filtered;
  }, [detail.actions]);

  const shareAction = useMemo(() => {
    return detail.actions.find(action => action.id === 'share');
  }, [detail.actions]);

  const contactAction = useMemo(() => {
    return detail.actions.find(action => action.id === 'contact-author');
  }, [detail.actions]);

  // Key metadata - fields shown in the grid (exclude what's shown prominently)
  const keyMetadata: InfoItem[] = useMemo(() => {
    const items: InfoItem[] = [];

    // Don't include heritage type, time period, category, region (shown prominently above)
    if (detail.customFields.country) {
      items.push({
        label: 'Country',
        value: detail.customFields.country,
      });
    }

    if (detail.customFields.sourceType) {
      items.push({
        label: 'Source Type',
        value: detail.customFields.sourceType,
      });
    }

    if (detail.customFields.language) {
      items.push({
        label: 'Language',
        value: detail.customFields.language,
      });
    }

    if (detail.customFields.communityGroup) {
      items.push({
        label: 'Community',
        value: detail.customFields.communityGroup,
      });
    }

    if (detail.customFields.contributorRole) {
      items.push({
        label: 'Contributor Role',
        value: detail.customFields.contributorRole,
      });
    }

    if (detail.customFields.knowledgeKeeper) {
      items.push({
        label: 'Knowledge Keeper',
        value: detail.customFields.knowledgeKeeper,
      });
    }

    return items;
  }, [detail.customFields]);

  // Supplemental metadata - badges for additional fields from detail.meta
  const supplementalMeta = useMemo(() => {
    const hiddenLabels = new Set([
      'Heritage Type', 'Time Period', 'Category', 'Region of Origin',  // Shown prominently
      'Country', 'Source Type', 'Language', 'Community', 'Contributor Role', 'Knowledge Keeper',  // In key metadata
      'Relays'  // Shown in sidebar
    ]);
    return (detail.meta ?? []).filter(meta => !hiddenLabels.has(meta.label));
  }, [detail.meta]);

  const tags = useMemo(() => {
    return (detail.tags ?? []).filter(tag => tag.toLowerCase() !== 'culture-bridge-heritage-contribution');
  }, [detail.tags]);

  return (
    <div className="space-y-10">
      <ContentDetailHeader
        title={detail.title}
        actions={actions}
        backHref={backHref}
        backLabel="Back to heritage"
        customButtons={
          <>
            <button
              type="button"
              onClick={() => setIsLiked(!isLiked)}
              className={`btn-outline-sm inline-flex items-center justify-center ${
                isLiked ? '!border-red-300 !bg-red-50 !text-red-700 hover:!bg-red-100' : ''
              }`}
              aria-label={isLiked ? 'Unlike contribution' : 'Like contribution'}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            
            <button
              type="button"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`btn-outline-sm inline-flex items-center justify-center ${
                isBookmarked ? '!border-primary-300 !bg-primary-50 !text-primary-700 hover:!bg-primary-100' : ''
              }`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark contribution'}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-primary-500 text-primary-500' : ''}`} />
            </button>
            
            {shareAction && (
              <button
                type="button"
                onClick={shareAction.onClick}
                className="btn-outline-sm inline-flex items-center justify-center"
                aria-label="Share contribution"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
          </>
        }
      />

      <ContentDetailLayout
        media={<ContentMediaGallery items={detail.media} />}
        main={
          <section
            aria-labelledby="heritage-contribution-details"
            className="space-y-5 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-primary-100"
          >
            <div>
              <h2
                id="heritage-contribution-details"
                className="text-sm font-semibold uppercase tracking-wide text-gray-500"
              >
                Heritage Details
              </h2>
              
              {/* Prominent primary info */}
              <div className="mt-3">
                {detail.customFields.heritageType && (
                  <p className="text-2xl font-semibold text-primary-900">
                    {detail.customFields.heritageType}
                    {detail.customFields.timePeriod && (
                      <span className="text-lg text-gray-600"> • {detail.customFields.timePeriod}</span>
                    )}
                  </p>
                )}
                
                {/* Secondary info */}
                {(detail.customFields.category || detail.customFields.regionOrigin) && (
                  <p className="mt-2 text-base text-gray-700">
                    {[detail.customFields.category, detail.customFields.regionOrigin]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                )}
              </div>
            </div>

            {keyMetadata.length > 0 && (
              <dl className="grid grid-cols-1 gap-4 rounded-2xl bg-white/70 p-4 shadow-inner ring-1 ring-primary-100 md:grid-cols-2">
                {keyMetadata.map(item => (
                  <div key={item.label}>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">{item.label}</dt>
                    <dd className="mt-1 text-base font-medium text-primary-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
```

            {supplementalMeta.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {supplementalMeta.map(meta => (
                  <span
                    key={`${meta.label}-${meta.value}`}
                    className="rounded-full border border-primary-100 bg-white px-3 py-1 text-xs font-medium text-primary-700"
                    title={'tooltip' in meta ? (meta.tooltip as string | undefined) : undefined}
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
            title="About this contribution"
            description={detail.description}
            tags={tags}
          />
        }
      />
    </div>
  );
}
