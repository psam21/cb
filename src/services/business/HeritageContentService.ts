import { contentDetailService, type ContentDetailProvider } from './ContentDetailService';
import type { ContentDetailResult, ContentMeta } from '@/types/content-detail';
import type { HeritageCustomFields } from '../../types/heritage-content';
import type { ContentMediaItem, ContentMediaSource, ContentMediaType } from '@/types/content-media';
import { logger } from '@/services/core/LoggingService';
import type { HeritageNostrEvent, HeritageContributionData } from '@/types/heritage';
import { queryEvents } from '../generic/GenericRelayService';
import { nostrEventService } from '../nostr/NostrEventService';
import type { NostrSigner } from '@/types/nostr';

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

/**
 * Parse imeta tag to extract comprehensive media metadata
 * NIP-94 format: ["imeta", "url <url>", "m <mime>", "x <hash>", "size <bytes>", "dim <WxH>", ...]
 */
function parseImetaTag(imetaTag: string[]): Partial<ContentMediaSource> | null {
  if (!imetaTag || imetaTag[0] !== 'imeta') return null;
  
  const metadata: Partial<ContentMediaSource> = {};
  
  // Join all parts (excluding first element which is 'imeta')
  const imetaStr = imetaTag.slice(1).join(' ');
  
  // Extract URL
  const urlMatch = imetaStr.match(/url\s+(\S+)/);
  if (urlMatch) metadata.url = urlMatch[1];
  
  // Extract mime type
  const mimeMatch = imetaStr.match(/m\s+(\S+)/);
  if (mimeMatch) metadata.mimeType = mimeMatch[1];
  
  // Extract hash
  const hashMatch = imetaStr.match(/x\s+(\S+)/);
  if (hashMatch) metadata.hash = hashMatch[1];
  
  // Extract size (in bytes)
  const sizeMatch = imetaStr.match(/size\s+(\d+)/);
  if (sizeMatch) metadata.size = parseInt(sizeMatch[1], 10);
  
  // Extract dimensions
  const dimMatch = imetaStr.match(/dim\s+(\d+)x(\d+)/);
  if (dimMatch) {
    metadata.dimensions = {
      width: parseInt(dimMatch[1], 10),
      height: parseInt(dimMatch[2], 10),
    };
  }
  
  return metadata;
}

/**
 * Create media items with full metadata from imeta tags
 */
function createMediaItemsFromImeta(event: { tags: string[][] }): ContentMediaItem[] {
  const mediaItems: ContentMediaItem[] = [];
  
  // Find all image tags and their corresponding imeta tags
  (event.tags as string[][]).forEach(tag => {
    if (tag[0] === 'image' && tag[1]) {
      const url = tag[1];
      
      // Find corresponding imeta tag
      const imetaTag = (event.tags as string[][]).find(
        t => t[0] === 'imeta' && t.some(part => part.includes(url))
      );
      
      let metadata: Partial<ContentMediaSource> = {
        url,
        name: `Media ${mediaItems.length + 1}`,
      };
      
      // If imeta tag exists, parse it for full metadata
      if (imetaTag) {
        const parsedMeta = parseImetaTag(imetaTag);
        if (parsedMeta) {
          metadata = { ...metadata, ...parsedMeta };
        }
      }
      
      // Infer mime type from URL if not provided
      if (!metadata.mimeType) {
        if (url.match(/\.(mp4|webm|mov)$/i)) {
          metadata.mimeType = 'video/mp4';
        } else if (url.match(/\.(mp3|wav|ogg)$/i)) {
          metadata.mimeType = 'audio/mpeg';
        } else {
          metadata.mimeType = 'image/jpeg';
        }
      }
      
      // Determine media type
      const type: ContentMediaType = 
        metadata.mimeType?.startsWith('video/') ? 'video' :
        metadata.mimeType?.startsWith('audio/') ? 'audio' :
        'image';
      
      mediaItems.push({
        id: metadata.hash || `media-${mediaItems.length}`,
        type,
        source: metadata as ContentMediaSource,
      });
    }
  });
  
  return mediaItems;
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

export interface CreateHeritageResult {
  success: boolean;
  eventId?: string;
  contribution?: HeritageContribution;
  publishedRelays?: string[];
  failedRelays?: string[];
  error?: string;
}

/**
 * Create a new heritage contribution with event creation and publishing
 * Orchestrates: validation → event creation → publishing
 */
export async function createHeritageContribution(
  heritageData: HeritageContributionData,
  signer: NostrSigner,
  existingDTag?: string
): Promise<CreateHeritageResult> {
  try {
    logger.info('Starting heritage contribution creation', {
      service: 'HeritageContentService',
      method: 'createHeritageContribution',
      title: heritageData.title,
      isEdit: !!existingDTag,
    });

    // Map GenericAttachment to simplified format for event service
    const mappedAttachments = heritageData.attachments
      .filter(att => att.url) // Only include attachments with URLs
      .map(att => ({
        url: att.url!,
        type: att.type,
        hash: att.hash,
        name: att.name,
      }));

    // Step 1: Create Nostr event using event service
    logger.info('Creating heritage event', {
      service: 'HeritageContentService',
      method: 'createHeritageContribution',
      title: heritageData.title,
      dTag: existingDTag,
    });

    const event = await nostrEventService.createHeritageEvent(
      {
        ...heritageData,
        attachments: mappedAttachments,
      },
      signer,
      existingDTag
    );

    // Step 2: Publish to relays
    logger.info('Publishing event to relays', {
      service: 'HeritageContentService',
      method: 'createHeritageContribution',
      eventId: event.id,
      title: heritageData.title,
    });

    const publishResult = await nostrEventService.publishEvent(
      event,
      signer,
      (relay, status) => {
        logger.info('Relay publishing status', {
          service: 'HeritageContentService',
          method: 'createHeritageContribution',
          relay,
          status,
          eventId: event.id,
        });
      }
    );

    if (!publishResult.success) {
      return {
        success: false,
        error: `Failed to publish to any relay: ${publishResult.error}`,
        eventId: event.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    }

    // Step 3: Create contribution object from published event
    const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
    if (!dTag) {
      throw new Error('Created event missing required d tag');
    }

    // Extract media URLs and hashes from event tags
    const mediaUrls: string[] = [];
    const mediaHashes: string[] = [];

    event.tags.forEach(tag => {
      if (tag[0] === 'image' || tag[0] === 'video' || tag[0] === 'audio') {
        mediaUrls.push(tag[1]);
      }
      if (tag[0] === 'imeta') {
        const urlPart = tag.find(part => part.startsWith('url '));
        const hashPart = tag.find(part => part.startsWith('x '));
        if (urlPart && hashPart) {
          const hash = hashPart.replace('x ', '');
          mediaHashes.push(hash);
        }
      }
    });

    // Parse media from imeta tags (includes full metadata: size, dimensions, mime type, hash)
    const media = createMediaItemsFromImeta(event);

    const contribution: HeritageContribution = {
      id: dTag,
      dTag,
      eventId: event.id,
      pubkey: event.pubkey,
      title: heritageData.title,
      description: heritageData.description,
      category: heritageData.category,
      heritageType: heritageData.heritageType,
      language: heritageData.language,
      communityGroup: heritageData.community,
      regionOrigin: heritageData.region,
      country: heritageData.country,
      timePeriod: heritageData.timePeriod,
      sourceType: heritageData.sourceType,
      contributorRole: heritageData.contributorRole,
      knowledgeKeeper: heritageData.knowledgeKeeperContact,
      media,
      tags: heritageData.tags,
      createdAt: event.created_at,
      publishedAt: event.created_at,
      publishedRelays: publishResult.publishedRelays,
      isDeleted: false,
    };

    logger.info('Heritage contribution created successfully', {
      service: 'HeritageContentService',
      method: 'createHeritageContribution',
      eventId: event.id,
      dTag,
      title: heritageData.title,
      publishedRelays: publishResult.publishedRelays.length,
    });

    return {
      success: true,
      eventId: event.id,
      contribution,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    logger.error('Failed to create heritage contribution', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'HeritageContentService',
      method: 'createHeritageContribution',
      title: heritageData.title,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating heritage contribution',
    };
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
        '#t': ['culture-bridge-heritage-contribution'],
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

    // Parse media from imeta tags (includes full metadata: size, dimensions, mime type, hash)
    const media = createMediaItemsFromImeta(latestEvent);

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
      media,
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

export async function fetchAllHeritage(): Promise<HeritageContribution[]> {
  try {
    logger.info('Fetching all heritage contributions', {
      service: 'HeritageContentService',
      method: 'fetchAllHeritage',
    });

    // Query relays for all heritage events
    const filters = [
      {
        kinds: [30023],
        '#t': ['culture-bridge-heritage-contribution'],
      }
    ];

    const queryResult = await queryEvents(filters);

    if (!queryResult.events || queryResult.events.length === 0) {
      logger.info('No heritage contributions found', {
        service: 'HeritageContentService',
        method: 'fetchAllHeritage',
      });
      return [];
    }

    logger.info('Found heritage contributions', {
      service: 'HeritageContentService',
      method: 'fetchAllHeritage',
      count: queryResult.events.length,
    });

    // NIP-33 parameterized replaceable events - relays return latest version automatically
    // No client-side grouping needed
    const contributions: HeritageContribution[] = [];
    
    for (const event of queryResult.events as HeritageNostrEvent[]) {
      const dTag = event.tags.find(t => t[0] === 'd')?.[1];
      if (!dTag) continue; // Skip events without dTag
      const title = event.tags.find(t => t[0] === 'title')?.[1] || '';
      const category = event.tags.find(t => t[0] === 'category')?.[1] || '';
      const heritageType = event.tags.find(t => t[0] === 'heritage-type')?.[1] || '';
      const timePeriod = event.tags.find(t => t[0] === 'time-period')?.[1] || '';
      const sourceType = event.tags.find(t => t[0] === 'source-type')?.[1] || '';
      const regionOrigin = event.tags.find(t => t[0] === 'region')?.[1] || '';
      const country = event.tags.find(t => t[0] === 'country')?.[1];
      const language = event.tags.find(t => t[0] === 'language')?.[1];
      const communityGroup = event.tags.find(t => t[0] === 'community')?.[1];
      const contributorRole = event.tags.find(t => t[0] === 'contributor-role')?.[1];
      const knowledgeKeeper = event.tags.find(t => t[0] === 'knowledge-keeper')?.[1];
      const tags = event.tags.filter(t => t[0] === 't').map(t => t[1]);

      // Parse media from imeta tags (includes full metadata: size, dimensions, mime type, hash)
      const media = createMediaItemsFromImeta(event);

      contributions.push({
        id: dTag,
        dTag,
        eventId: event.id || '',
        pubkey: event.pubkey,
        title,
        description: event.content,
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
        media,
        tags,
        createdAt: event.created_at,
        publishedAt: event.created_at,
        publishedRelays: [],
        isDeleted: false,
      });
    }

    // Sort by created_at descending (newest first)
    contributions.sort((a, b) => b.createdAt - a.createdAt);

    return contributions;
  } catch (error) {
    logger.error('Error fetching all heritage contributions', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'HeritageContentService',
      method: 'fetchAllHeritage',
    });
    return [];
  }
}

export async function fetchHeritageByAuthor(pubkey: string): Promise<HeritageContribution[]> {
  try {
    logger.info('Fetching heritage contributions by author', {
      service: 'HeritageContentService',
      method: 'fetchHeritageByAuthor',
      pubkey,
    });

    // Query relays for heritage events by this author
    const filters = [
      {
        kinds: [30023],
        authors: [pubkey],
        '#t': ['culture-bridge-heritage-contribution'],
      }
    ];

    const queryResult = await queryEvents(filters);

    if (!queryResult.events || queryResult.events.length === 0) {
      logger.info('No heritage contributions found for author', {
        service: 'HeritageContentService',
        method: 'fetchHeritageByAuthor',
        pubkey,
      });
      return [];
    }

    logger.info('Found heritage contributions for author', {
      service: 'HeritageContentService',
      method: 'fetchHeritageByAuthor',
      pubkey,
      count: queryResult.events.length,
    });

    // NIP-33 parameterized replaceable events - relays return latest version automatically
    // No client-side grouping needed
    const contributions: HeritageContribution[] = [];
    
    for (const event of queryResult.events as HeritageNostrEvent[]) {
      const dTag = event.tags.find(t => t[0] === 'd')?.[1];
      if (!dTag) continue; // Skip events without dTag
      const title = event.tags.find(t => t[0] === 'title')?.[1] || '';
      const category = event.tags.find(t => t[0] === 'category')?.[1] || '';
      const heritageType = event.tags.find(t => t[0] === 'heritage-type')?.[1] || '';
      const timePeriod = event.tags.find(t => t[0] === 'time-period')?.[1] || '';
      const sourceType = event.tags.find(t => t[0] === 'source-type')?.[1] || '';
      const regionOrigin = event.tags.find(t => t[0] === 'region')?.[1] || '';
      const country = event.tags.find(t => t[0] === 'country')?.[1];
      const language = event.tags.find(t => t[0] === 'language')?.[1];
      const communityGroup = event.tags.find(t => t[0] === 'community')?.[1];
      const contributorRole = event.tags.find(t => t[0] === 'contributor-role')?.[1];
      const knowledgeKeeper = event.tags.find(t => t[0] === 'knowledge-keeper')?.[1];
      const tags = event.tags.filter(t => t[0] === 't').map(t => t[1]);

      // Parse media from imeta tags (includes full metadata: size, dimensions, mime type, hash)
      const media = createMediaItemsFromImeta(event);

      contributions.push({
        id: dTag,
        dTag,
        eventId: event.id || '',
        pubkey: event.pubkey,
        title,
        description: event.content,
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
        media,
        tags,
        createdAt: event.created_at,
        publishedAt: event.created_at,
        publishedRelays: [],
        isDeleted: false,
      });
    }

    // Sort by created_at descending (newest first)
    contributions.sort((a, b) => b.createdAt - a.createdAt);

    return contributions;
  } catch (error) {
    logger.error('Error fetching heritage contributions by author', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'HeritageContentService',
      method: 'fetchHeritageByAuthor',
      pubkey,
    });
    return [];
  }
}

export async function deleteHeritageContribution(
  eventId: string,
  signer: unknown,
  userPubkey: string,
  title: string
): Promise<{ success: boolean; error?: string; publishedRelays?: string[] }> {
  try {
    logger.info('Starting heritage contribution deletion', {
      service: 'HeritageContentService',
      method: 'deleteHeritageContribution',
      eventId,
      userPubkey: userPubkey.substring(0, 8) + '...',
    });

    // Import deletion functions
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createDeletionEvent, signEvent, publishEvent } = require('../nostr/NostrEventService');

    // Create NIP-09 Kind 5 deletion event
    const deletionResult = createDeletionEvent(
      [eventId],
      userPubkey,
      {
        reason: `Heritage contribution "${title}" deleted by author`,
        additionalTags: [
          ['t', 'culture-bridge-heritage-contribution'], // Heritage identifier tag
        ],
      }
    );

    if (!deletionResult.success || !deletionResult.event) {
      return {
        success: false,
        error: `Failed to create deletion event: ${deletionResult.error}`,
      };
    }

    // Sign the deletion event
    const signingResult = await signEvent(deletionResult.event, signer);
    if (!signingResult.success || !signingResult.signedEvent) {
      return {
        success: false,
        error: `Failed to sign deletion event: ${signingResult.error}`,
      };
    }

    // Publish the deletion event
    const publishResult = await publishEvent(signingResult.signedEvent, signer);

    if (!publishResult.success) {
      return {
        success: false,
        error: `Failed to publish deletion: ${publishResult.error}`,
        publishedRelays: publishResult.publishedRelays,
      };
    }

    logger.info('Heritage contribution deleted successfully', {
      service: 'HeritageContentService',
      method: 'deleteHeritageContribution',
      eventId,
      publishedRelays: publishResult.publishedRelays.length,
    });

    return {
      success: true,
      publishedRelays: publishResult.publishedRelays,
    };
  } catch (error) {
    logger.error('Error deleting heritage contribution', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'HeritageContentService',
      method: 'deleteHeritageContribution',
      eventId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete heritage contribution',
    };
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
