/**
 * Generic Heritage Service
 * Layer 4: Service (Business Logic)
 * 
 * SOA Compliance:
 * - ✅ Queries relays for public heritage events
 * - ✅ Accepts limit and until parameters for pagination
 * - ✅ Returns normalized heritage events
 * - ❌ NO state management (stateless)
 * - ❌ NO UI concerns
 */

import { logger } from '../core/LoggingService';
import { queryEvents } from './GenericRelayService';
import type { NostrEvent } from '@/types/nostr';

/**
 * Heritage event from relay (Kind 30023)
 */
export interface HeritageEvent {
  id: string;
  dTag: string;
  pubkey: string;
  title: string;
  summary: string;
  category: string;
  heritageType: string;
  location: string;
  region: string;
  country?: string;
  tags: string[];
  media: {
    images: string[];
    audio: string[];
    videos: string[];
  };
  createdAt: number;
  publishedAt: number;
}

/**
 * Parse imeta tag to extract media metadata
 * Format: ["imeta", "url <url>", "m <mime>", ...]
 */
function parseImetaTag(imetaTag: string[]): { url: string; mimeType?: string } | null {
  if (!imetaTag || imetaTag[0] !== 'imeta') return null;
  
  const imetaStr = imetaTag.slice(1).join(' ');
  
  // Extract URL
  const urlMatch = imetaStr.match(/url\s+(\S+)/);
  if (!urlMatch) return null;
  
  const url = urlMatch[1];
  
  // Extract mime type
  const mimeMatch = imetaStr.match(/m\s+(\S+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : undefined;
  
  return { url, mimeType };
}

/**
 * Extract media URLs from event tags and categorize by type
 */
function extractMedia(tags: string[][]): {
  images: string[];
  audio: string[];
  videos: string[];
} {
  const images: string[] = [];
  const audio: string[] = [];
  const videos: string[] = [];
  
  tags.forEach(tag => {
    // Check for imeta tags (full metadata)
    if (tag[0] === 'imeta') {
      const parsed = parseImetaTag(tag);
      if (parsed) {
        const { url, mimeType } = parsed;
        
        // Categorize by mime type
        if (mimeType?.startsWith('video/')) {
          videos.push(url);
        } else if (mimeType?.startsWith('audio/')) {
          audio.push(url);
        } else {
          images.push(url);
        }
      }
    }
    // Fallback to simple tags
    else if (tag[0] === 'image' && tag[1]) {
      images.push(tag[1]);
    } else if (tag[0] === 'video' && tag[1]) {
      videos.push(tag[1]);
    } else if (tag[0] === 'audio' && tag[1]) {
      audio.push(tag[1]);
    }
  });
  
  return { images, audio, videos };
}

/**
 * Parse Nostr event to HeritageEvent
 */
function parseHeritageEvent(event: NostrEvent): HeritageEvent | null {
  try {
    const tags = event.tags as string[][];
    
    // Extract required fields
    const dTag = tags.find(t => t[0] === 'd')?.[1];
    const title = tags.find(t => t[0] === 'title')?.[1];
    const summary = tags.find(t => t[0] === 'summary')?.[1];
    
    // Skip events missing required fields
    if (!dTag || !title) {
      logger.warn('Heritage event missing required fields', {
        service: 'GenericHeritageService',
        method: 'parseHeritageEvent',
        eventId: event.id,
        hasDTag: !!dTag,
        hasTitle: !!title,
      });
      return null;
    }
    
    // Extract optional fields
    const category = tags.find(t => t[0] === 'category')?.[1] || 'Uncategorized';
    const heritageType = tags.find(t => t[0] === 'heritage-type')?.[1] || '';
    const location = tags.find(t => t[0] === 'location')?.[1] || '';
    const region = tags.find(t => t[0] === 'region')?.[1] || '';
    const country = tags.find(t => t[0] === 'country')?.[1];
    
    // Extract custom tags (all tags with 't' key except system tags)
    const customTags = tags
      .filter(t => t[0] === 't' && !t[1].startsWith('culture-bridge-'))
      .map(t => t[1]);
    
    // Extract media
    const media = extractMedia(tags);
    
    return {
      id: event.id,
      dTag,
      pubkey: event.pubkey,
      title,
      summary: summary || title, // Fallback to title if no summary
      category,
      heritageType,
      location,
      region,
      country,
      tags: customTags,
      media,
      createdAt: event.created_at,
      publishedAt: event.created_at,
    };
  } catch (error) {
    logger.error('Error parsing heritage event', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericHeritageService',
      method: 'parseHeritageEvent',
      eventId: event.id,
    });
    return null;
  }
}

/**
 * Fetch public heritage contributions from relays
 * 
 * SOA Compliance:
 * - Service layer handles relay queries and parsing
 * - Stateless: accepts parameters, returns data
 * - No UI concerns, no state management
 * 
 * @param limit - Number of events to fetch (default: 8)
 * @param until - Unix timestamp for pagination (fetch events before this time)
 * @returns Array of parsed heritage events
 */
export async function fetchPublicHeritage(
  limit = 8,
  until?: number
): Promise<HeritageEvent[]> {
  try {
    logger.info('Fetching public heritage contributions', {
      service: 'GenericHeritageService',
      method: 'fetchPublicHeritage',
      limit,
      until,
      hasPagination: !!until,
    });

    // Build relay filter
    const filter: Record<string, unknown> = {
      kinds: [30023],
      '#t': ['culture-bridge-heritage'],
      limit,
    };
    
    // Add pagination filter if provided
    if (until) {
      filter.until = until;
    }

    // Query relays
    const queryResult = await queryEvents([filter]);

    if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
      logger.info('No heritage contributions found', {
        service: 'GenericHeritageService',
        method: 'fetchPublicHeritage',
        success: queryResult.success,
        eventCount: 0,
      });
      return [];
    }

    logger.info('Found heritage events from relays', {
      service: 'GenericHeritageService',
      method: 'fetchPublicHeritage',
      eventCount: queryResult.events.length,
      relayCount: queryResult.relayCount,
    });

    // Parse events
    const heritageEvents: HeritageEvent[] = [];
    const seenDTags = new Set<string>(); // Deduplication by dTag

    for (const event of queryResult.events) {
      const parsed = parseHeritageEvent(event);
      
      if (parsed && !seenDTags.has(parsed.dTag)) {
        seenDTags.add(parsed.dTag);
        heritageEvents.push(parsed);
      }
    }

    // Sort by created_at DESC (newest first)
    heritageEvents.sort((a, b) => b.createdAt - a.createdAt);

    logger.info('Heritage contributions parsed successfully', {
      service: 'GenericHeritageService',
      method: 'fetchPublicHeritage',
      parsedCount: heritageEvents.length,
      deduplicatedCount: queryResult.events.length - heritageEvents.length,
    });

    return heritageEvents;
  } catch (error) {
    logger.error('Error fetching public heritage', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericHeritageService',
      method: 'fetchPublicHeritage',
      limit,
      until,
    });
    return [];
  }
}

export const GenericHeritageService = {
  fetchPublicHeritage,
};
