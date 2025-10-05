'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { ContentMetaInfo } from '@/components/generic/ContentMetaInfo';
import { logger } from '@/services/core/LoggingService';
import type { HeritageContentDetail } from '@/types/heritage-content';
import type { InfoItem } from '@/components/generic/ContentDetailInfo';

interface HeritageDetailProps {
  detail: HeritageContentDetail;
  backHref?: string;
}

export function HeritageDetail({ detail, backHref = '/heritage' }: HeritageDetailProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleContactContributor = () => {
    const contactAction = detail.actions.find(action => action.id === 'contact-author');
    if (!contactAction || !contactAction.metadata) {
      logger.warn('Contact author action has no metadata', {
        service: 'HeritageDetail',
        method: 'handleContactContributor',
      });
      return;
    }

    const metadata = contactAction.metadata as {
      contributorPubkey: string;
      heritageId: string;
      heritageTitle: string;
      heritageImageUrl?: string;
    };
    const { contributorPubkey, heritageId, heritageTitle, heritageImageUrl } = metadata;

    logger.info('Navigating to messages for contributor', {
      service: 'HeritageDetail',
      method: 'handleContactContributor',
      contributorPubkey,
      heritageId,
    });

    // Navigate to messages with context
    const params = new URLSearchParams({
      recipient: contributorPubkey,
      context: `heritage:${heritageId}`,
      contextTitle: heritageTitle || 'Heritage',
      ...(heritageImageUrl && { contextImage: heritageImageUrl }),
    });

    router.push(`/messages?${params.toString()}`);
  };

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

  // All heritage metadata in a single comprehensive grid
  const allMetadata: InfoItem[] = useMemo(() => {
    const items: InfoItem[] = [];

    if (detail.customFields.heritageType) {
      items.push({
        label: 'Heritage Type',
        value: detail.customFields.heritageType,
        emphasis: true,
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
        label: 'Region',
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
            <h2
              id="heritage-contribution-details"
              className="text-sm font-semibold uppercase tracking-wide text-gray-500"
            >
              Heritage Details
            </h2>

            {allMetadata.length > 0 && (
              <dl className="grid grid-cols-1 gap-4 rounded-2xl bg-white/70 p-4 shadow-inner ring-1 ring-primary-100 md:grid-cols-2">
                {allMetadata.map(item => (
                  <div key={item.label}>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">{item.label}</dt>
                    <dd
                      className={`mt-1 text-base font-medium ${item.emphasis ? 'text-primary-900' : 'text-gray-700'}`}
                    >
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
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
                onClick={handleContactContributor}
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
