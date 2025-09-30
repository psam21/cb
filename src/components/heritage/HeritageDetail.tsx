'use client';

import { useMemo, useState } from 'react';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { ContentMetaInfo } from '@/components/generic/ContentMetaInfo';
import type { ContentDetail } from '@/types/content-detail';
import type { HeritageCustomFields } from '@/types/heritage-content';
import type { InfoItem } from '@/components/generic/ContentDetailInfo';

interface HeritageDetailProps {
  detail: ContentDetail<HeritageCustomFields>;
  backHref?: string;
}

export function HeritageDetail({ detail, backHref = '/heritage' }: HeritageDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const actions = useMemo(() => {
    const filtered = detail.actions.filter(action => 
      action.id !== 'report' && 
      action.id !== 'share'
    );
    return filtered;
  }, [detail.actions]);

  const shareAction = useMemo(() => {
    return detail.actions.find(action => action.id === 'share');
  }, [detail.actions]);

  const keyMetadata: InfoItem[] = useMemo(() => {
    const items: InfoItem[] = [];

    if (detail.customFields.heritageType) {
      items.push({
        label: 'Heritage Type',
        value: detail.customFields.heritageType,
      });
    }

    if (detail.customFields.category) {
      items.push({
        label: 'Category',
        value: detail.customFields.category,
      });
    }

    if (detail.customFields.timePeriod) {
      items.push({
        label: 'Time Period',
        value: detail.customFields.timePeriod,
      });
    }

    if (detail.customFields.regionOrigin) {
      items.push({
        label: 'Region of Origin',
        value: detail.customFields.regionOrigin,
      });
    }

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

    return items;
  }, [detail.customFields]);

  const supplementalMeta = useMemo(() => {
    const items: InfoItem[] = [];

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

    // Add any meta items from the detail
    if (detail.meta) {
      detail.meta.forEach(meta => {
        // Avoid duplicating fields we're already showing
        const existingLabels = new Set([...items.map(i => i.label), ...keyMetadata.map(i => i.label)]);
        if (!existingLabels.has(meta.label)) {
          items.push(meta);
        }
      });
    }

    return items;
  }, [detail.customFields, detail.meta, keyMetadata]);

  const tags = useMemo(() => {
    return (detail.tags ?? []).filter(tag => tag.toLowerCase() !== 'culture-bridge-heritage');
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

            {supplementalMeta.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {supplementalMeta.map(meta => (
                  <span
                    key={`${meta.label}-${meta.value}`}
                    className="rounded-full border border-primary-100 bg-white px-3 py-1 text-xs font-medium text-primary-700"
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
