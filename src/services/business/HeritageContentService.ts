import { contentDetailService, type ContentDetailProvider } from './ContentDetailService';
import type { ContentDetailResult, ContentMeta } from '@/types/content-detail';
import type { HeritageCustomFields } from '../../types/heritage-content';
import type { ContentMediaItem } from '@/types/content-media';
import { logger } from '@/services/core/LoggingService';
import type { HeritageNostrEvent } from '@/types/heritage';
import { queryEvents } from '../generic/GenericRelayService';

export interface HeritageContribution {
  id: string;
  dTag: string;
  eventId: string;
  pubkey: string;
  title: string;
  description: string;
  category: string;
  heritageType: string;
  language?: string;
  communityGroup?: string;
  regionOrigin: string;
  country?: string;
  timePeriod: string;
  sourceType: string;
  contributorRole?: string;
  knowledgeKeeper?: string;
  media: ContentMediaItem[];
  tags: string[];
  createdAt: number;
  publishedAt: number;
  publishedRelays: string[];
  isDeleted: boolean;
}

function createMediaItems(mediaUrls: string[], hashes: string[]): ContentMediaItem[] {
  return mediaUrls.map((url, index) => ({
    id: hashes[index] || `media-${index}`,
    type: url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 
          url.match(/\.(mp3|wav|ogg)$/i) ? 'audio' : 'image',
    source: {
      url,
      hash: hashes[index],
      mimeType: url.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : 
                url.match(/\.(mp3|wav|ogg)$/i) ? 'audio/mpeg' : 'image/jpeg',
      name: `Media ${index + 1}`,
    },
  }));
}

function buildMeta(contribution: HeritageContribution): ContentMeta[] {
  const meta: ContentMeta[] = [];

  if (contribution.heritageType) {
    meta.push({
      label: 'Heritage Type',
      value: contribution.heritageType,
    });
  }

  if (contribution.category) {
    meta.push({
      label: 'Category',
      value: contribution.category,
    });
  }

  if (contribution.timePeriod) {
    meta.push({
      label: 'Time Period',
      value: contribution.timePeriod,
    });
  }

  if (contribution.regionOrigin) {
    meta.push({
      label: 'Region',
      value: contribution.regionOrigin,
    });
  }

  if (contribution.country) {
    meta.push({
      label: 'Country',
      value: contribution.country,
    });
  }

  if (contribution.sourceType) {
    meta.push({
      label: 'Source',
      value: contribution.sourceType,
    });
  }

  if (contribution.language) {
    meta.push({
      label: 'Language',
      value: contribution.language,
    });
  }

  if (contribution.communityGroup) {
    meta.push({
      label: 'Community',
      value: contribution.communityGroup,
    });
  }

  if (contribution.contributorRole) {
    meta.push({
      label: 'Contributor Role',
      value: contribution.contributorRole,
    });
  }

  if (contribution.knowledgeKeeper) {
    meta.push({
      label: 'Knowledge Keeper',
      value: contribution.knowledgeKeeper,
    });
  }

  if (contribution.publishedRelays?.length) {
    meta.push({
      label: 'Relays',
      value: `${contribution.publishedRelays.length}`,
      tooltip: contribution.publishedRelays.join(', '),
    });
  }

  return meta;
}

function tryGetNpub(pubkey: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { profileService } = require('./ProfileBusinessService');
    return profileService.pubkeyToNpub(pubkey);
  } catch (error) {
    logger.warn('Failed to convert pubkey to npub', {
      service: 'HeritageContentService',
      method: 'tryGetNpub',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return undefined;
  }
}

async function tryGetAuthorDisplayName(pubkey: string): Promise<string | undefined> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { profileService } = require('./ProfileBusinessService');
    const profile = await profileService.getUserProfile(pubkey);
    return profile?.display_name || undefined;
  } catch (error) {
    logger.warn('Failed to fetch author display name', {
      service: 'HeritageContentService',
      method: 'tryGetAuthorDisplayName',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return undefined;
  }
}

export async function fetchHeritageById(id: string): Promise<HeritageContribution | null> {
  try {
    logger.info('Fetching heritage contribution by ID', {
      service: 'HeritageContentService',
      method: 'fetchHeritageById',
      id,
    });

    // Query relays for the heritage event
    const filters = [
      {
        kinds: [30023],
        '#d': [id],
        '#content-type': ['heritage'],
      }
    ];

    const queryResult = await queryEvents(filters);

    if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
      logger.warn('Heritage contribution not found', {
        service: 'HeritageContentService',
        method: 'fetchHeritageById',
        id,
      });
      return null;
    }

    // Get the most recent event (highest created_at)
    const latestEvent = queryResult.events.sort((a, b) => b.created_at - a.created_at)[0] as HeritageNostrEvent;

    // Extract data from event tags
    const dTag = latestEvent.tags.find(t => t[0] === 'd')?.[1] || id;
    const title = latestEvent.tags.find(t => t[0] === 'title')?.[1] || '';
    const category = latestEvent.tags.find(t => t[0] === 'category')?.[1] || '';
    const heritageType = latestEvent.tags.find(t => t[0] === 'heritage-type')?.[1] || '';
    const timePeriod = latestEvent.tags.find(t => t[0] === 'time-period')?.[1] || '';
    const sourceType = latestEvent.tags.find(t => t[0] === 'source-type')?.[1] || '';
    const regionOrigin = latestEvent.tags.find(t => t[0] === 'region')?.[1] || '';
    const country = latestEvent.tags.find(t => t[0] === 'country')?.[1];
    const language = latestEvent.tags.find(t => t[0] === 'language')?.[1];
    const communityGroup = latestEvent.tags.find(t => t[0] === 'community')?.[1];
    const contributorRole = latestEvent.tags.find(t => t[0] === 'contributor-role')?.[1];
    const knowledgeKeeper = latestEvent.tags.find(t => t[0] === 'knowledge-keeper')?.[1];
    const tags = latestEvent.tags.filter(t => t[0] === 't').map(t => t[1]);

    // Extract media URLs and hashes from tags
    const mediaUrls: string[] = [];
    const mediaHashes: string[] = [];
    
    (latestEvent.tags as string[][]).forEach(tag => {
      if (tag[0] === 'image' && tag[1]) {
        mediaUrls.push(tag[1]);
        // Try to find corresponding hash in imeta tags
        const imetaTag = (latestEvent.tags as string[][]).find(t => t[0] === 'imeta' && t[1] && t[1].includes(tag[1]));
        if (imetaTag) {
          const imetaStr = imetaTag.slice(1).join(' ');
          const hashMatch = imetaStr.match(/x\s+(\S+)/);
          if (hashMatch && hashMatch[1]) {
            mediaHashes.push(hashMatch[1]);
          }
        }
      }
    });

    const contribution: HeritageContribution = {
      id: dTag,
      dTag,
      eventId: latestEvent.id,
      pubkey: latestEvent.pubkey,
      title,
      description: latestEvent.content,
      category,
      heritageType,
      language,
      communityGroup,
      regionOrigin,
      country,
      timePeriod,
      sourceType,
      contributorRole,
      knowledgeKeeper,
      media: createMediaItems(mediaUrls, mediaHashes),
      tags,
      createdAt: latestEvent.created_at,
      publishedAt: latestEvent.created_at,
      publishedRelays: [], // Will be populated by relay responses
      isDeleted: false,
    };

    logger.info('Heritage contribution fetched successfully', {
      service: 'HeritageContentService',
      method: 'fetchHeritageById',
      id,
      title: contribution.title,
    });

    return contribution;
  } catch (error) {
    logger.error('Error fetching heritage contribution', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'HeritageContentService',
      method: 'fetchHeritageById',
      id,
    });
    return null;
  }
}

class HeritageContentService implements ContentDetailProvider<HeritageCustomFields> {
  private static instance: HeritageContentService;

  private constructor() {}

  public static getInstance(): HeritageContentService {
    if (!HeritageContentService.instance) {
      HeritageContentService.instance = new HeritageContentService();
    }
    return HeritageContentService.instance;
  }

  async getContentDetail(id: string): Promise<ContentDetailResult<HeritageCustomFields>> {
    try {
      const contribution = await fetchHeritageById(id);

      if (!contribution) {
        return {
          success: false,
          error: 'Heritage contribution not found',
        };
      }

      const npub = tryGetNpub(contribution.pubkey);
      const authorDisplayName = await tryGetAuthorDisplayName(contribution.pubkey);

      const result: ContentDetailResult<HeritageCustomFields> = {
        success: true,
        content: {
          id: contribution.id,
          dTag: contribution.dTag,
          title: contribution.title,
          description: contribution.description,
          summary: contribution.description.slice(0, 200) + '...',
          media: contribution.media,
          tags: contribution.tags,
          meta: buildMeta(contribution),
          author: {
            pubkey: contribution.pubkey,
            npub,
            displayName: authorDisplayName,
          },
          publishedAt: contribution.publishedAt,
          updatedAt: contribution.publishedAt,
          contentType: 'heritage',
          customFields: {
            heritageType: contribution.heritageType,
            category: contribution.category,
            timePeriod: contribution.timePeriod,
            regionOrigin: contribution.regionOrigin,
            country: contribution.country,
            sourceType: contribution.sourceType,
            language: contribution.language,
            communityGroup: contribution.communityGroup,
            contributorRole: contribution.contributorRole,
            knowledgeKeeper: contribution.knowledgeKeeper,
          },
          actions: [],
        },
      };

      return result;
    } catch (error) {
      logger.error('Error in getContentDetail', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'HeritageContentService',
        method: 'getContentDetail',
        id,
      });

      return {
        success: false,
        error: 'Failed to fetch heritage contribution details',
      };
    }
  }
}

// Create singleton instance
const heritageContentService = HeritageContentService.getInstance();

// Register with content detail service
contentDetailService.registerProvider('heritage', heritageContentService);

logger.info('Registering content detail provider', {
  service: 'HeritageContentService',
  method: 'registerProvider',
  contentType: 'heritage',
});

export { heritageContentService };
