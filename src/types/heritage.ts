import type { GenericAttachment } from './attachments';
import type { NostrEvent } from './nostr';

/**
 * Heritage Contribution Types
 * Based on /src/config/heritage.ts enums and form fields
 */

/**
 * Heritage contribution form data interface
 * Maps to the HeritageContributionForm fields
 */
export interface HeritageContributionData {
  // Section 1: Basic Information
  title: string;
  category: string;
  heritageType: string;

  // Section 2: Cultural Details
  description: string;
  language?: string;
  community?: string;
  region: string;
  country: string;

  // Section 3: Historical Context
  timePeriod: string;
  sourceType: string;

  // Section 4: Media & Attachments
  attachments: GenericAttachment[];

  // Section 5: Contact & Attribution
  contributorRole: string;
  knowledgeKeeperContact?: string;

  // Section 6: Tags & Keywords
  tags: string[];
}

/**
 * Heritage contribution Nostr event (Kind 30023)
 * Extended from base NostrEvent with heritage-specific tags
 */
export interface HeritageNostrEvent extends NostrEvent {
  kind: 30023;
  tags: [
    ['d', string], // Unique identifier
    ['content-type', 'heritage'], // Content type identifier
    ['t', 'culture-bridge-heritage-contribution'], // System tag (hidden)
    ['title', string],
    ['category', string],
    ['heritage-type', string],
    ['time-period', string],
    ['source-type', string],
    ['region', string],
    ['country', string],
    ['contributor-role', string],
    ...Array<
      | ['language', string]
      | ['community', string]
      | ['knowledge-keeper', string]
      | ['t', string] // User tags
      | ['image', string] // Media URLs
      | ['video', string]
      | ['audio', string]
    >
  ];
  content: string; // JSON stringified description
}

/**
 * Heritage contribution data for Nostr event creation
 * Simplified interface for the publishing hook
 */
export interface HeritageEventData {
  title: string;
  category: string;
  heritageType: string;
  timePeriod: string;
  sourceType: string;
  region: string;
  country: string;
  contributorRole: string;
  description: string;
  language?: string;
  community?: string;
  knowledgeKeeperContact?: string;
  tags: string[];
  attachments: GenericAttachment[];
}

/**
 * Heritage publishing result
 */
export interface HeritagePublishingResult {
  success: boolean;
  eventId?: string;
  dTag?: string; // The d-tag identifier for the contribution (used for URLs)
  event?: HeritageNostrEvent;
  error?: string;
  publishedToRelays?: string[];
}

/**
 * Heritage publishing state
 */
export interface HeritagePublishingState {
  isPublishing: boolean;
  uploadProgress: number;
  currentStep: 'idle' | 'validating' | 'uploading' | 'creating' | 'publishing' | 'complete' | 'error';
  error: string | null;
  result: HeritagePublishingResult | null;
}

/**
 * Heritage attachment (extends GenericAttachment)
 */
export interface HeritageAttachment extends GenericAttachment {
  type: 'image' | 'video' | 'audio';
  heritageId?: string;
  displayOrder: number;
  category?: 'image' | 'video' | 'audio';
}

/**
 * Heritage contribution validation result
 */
export interface HeritageValidationResult {
  valid: boolean;
  errors: {
    title?: string;
    category?: string;
    heritageType?: string;
    description?: string;
    region?: string;
    country?: string;
    timePeriod?: string;
    sourceType?: string;
    contributorRole?: string;
    attachments?: string;
    tags?: string;
  };
}

/**
 * Heritage contribution for display (from Nostr event)
 */
export interface HeritageContribution {
  id: string;
  dTag: string;
  title: string;
  category: string;
  heritageType: string;
  timePeriod: string;
  sourceType: string;
  region: string;
  country: string;
  contributorRole: string;
  description: string;
  language?: string;
  community?: string;
  knowledgeKeeperContact?: string;
  tags: string[];
  media: Array<{ type: 'image' | 'video' | 'audio'; url: string }>;
  author: {
    pubkey: string;
    npub?: string;
    displayName?: string;
  };
  createdAt: number;
  updatedAt?: number;
  relays?: string[];
}

/**
 * Tag mapping helpers
 */
export const HERITAGE_TAG_KEYS = {
  D_TAG: 'd',
  CONTENT_TYPE: 'content-type',
  SYSTEM_TAG: 't', // For 'culture-bridge-heritage-contribution'
  TITLE: 'title',
  CATEGORY: 'category',
  HERITAGE_TYPE: 'heritage-type',
  TIME_PERIOD: 'time-period',
  SOURCE_TYPE: 'source-type',
  REGION: 'region',
  COUNTRY: 'country',
  CONTRIBUTOR_ROLE: 'contributor-role',
  LANGUAGE: 'language',
  COMMUNITY: 'community',
  KNOWLEDGE_KEEPER: 'knowledge-keeper',
  USER_TAG: 't',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
} as const;

/**
 * System tag constant
 */
export const HERITAGE_SYSTEM_TAG = 'culture-bridge-heritage-contribution';

/**
 * Content type constant
 */
export const HERITAGE_CONTENT_TYPE = 'heritage';

/**
 * Helper to extract heritage data from Nostr event
 */
export const parseHeritageEvent = (event: NostrEvent): HeritageContribution | null => {
  try {
    const tags = event.tags;
    const getTag = (key: string): string | undefined => {
      const tag = tags.find(t => t[0] === key);
      return tag ? tag[1] : undefined;
    };

    const getAllTags = (key: string): string[] => {
      return tags.filter(t => t[0] === key).map(t => t[1]);
    };

    const dTag = getTag('d');
    const title = getTag('title');
    const category = getTag('category');
    const heritageType = getTag('heritage-type');
    const timePeriod = getTag('time-period');
    const sourceType = getTag('source-type');
    const region = getTag('region');
    const country = getTag('country');
    const contributorRole = getTag('contributor-role');

    if (!dTag || !title || !category || !heritageType || !timePeriod || 
        !sourceType || !region || !country || !contributorRole) {
      return null;
    }

    // Parse user tags (exclude system tag)
    const userTags = getAllTags('t').filter(tag => tag !== HERITAGE_SYSTEM_TAG);

    // Parse media
    const images = getAllTags('image').map(url => ({ type: 'image' as const, url }));
    const videos = getAllTags('video').map(url => ({ type: 'video' as const, url }));
    const audios = getAllTags('audio').map(url => ({ type: 'audio' as const, url }));
    const media = [...images, ...videos, ...audios];

    // Parse description from content
    let description = '';
    try {
      const content = JSON.parse(event.content);
      description = content.description || '';
    } catch {
      description = event.content;
    }

    return {
      id: event.id || dTag,
      dTag,
      title,
      category,
      heritageType,
      timePeriod,
      sourceType,
      region,
      country,
      contributorRole,
      description,
      language: getTag('language'),
      community: getTag('community'),
      knowledgeKeeperContact: getTag('knowledge-keeper'),
      tags: userTags,
      media,
      author: {
        pubkey: event.pubkey,
      },
      createdAt: event.created_at,
      relays: [], // Will be populated by business service
    };
  } catch (error) {
    console.error('Failed to parse heritage event:', error);
    return null;
  }
};

/**
 * Type guard for heritage event
 */
export const isHeritageEvent = (event: NostrEvent): event is HeritageNostrEvent => {
  return (
    event.kind === 30023 &&
    event.tags.some(t => t[0] === 'content-type' && t[1] === 'heritage') &&
    event.tags.some(t => t[0] === 't' && t[1] === HERITAGE_SYSTEM_TAG)
  );
};

/**
 * Validate heritage contribution data
 */
export const validateHeritageData = (data: Partial<HeritageContributionData>): HeritageValidationResult => {
  const errors: HeritageValidationResult['errors'] = {};

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!data.category) {
    errors.category = 'Category is required';
  }

  if (!data.heritageType) {
    errors.heritageType = 'Heritage type is required';
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (!data.region) {
    errors.region = 'Region is required';
  }

  if (!data.country) {
    errors.country = 'Country is required';
  }

  if (!data.timePeriod) {
    errors.timePeriod = 'Time period is required';
  }

  if (!data.sourceType) {
    errors.sourceType = 'Source type is required';
  }

  if (!data.contributorRole) {
    errors.contributorRole = 'Contributor role is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
