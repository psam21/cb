import type { ContentDetail } from './content-detail';

/**
 * Heritage-specific custom fields for content detail system
 */
export interface HeritageCustomFields extends Record<string, unknown> {
  heritageType: string;
  category: string;
  timePeriod: string;
  regionOrigin: string;
  country?: string;
  sourceType: string;
  language?: string;
  communityGroup?: string;
  contributorRole?: string;
  knowledgeKeeper?: string;
}

/**
 * Heritage content detail type alias for consistency with shop pattern
 */
export type HeritageContentDetail = ContentDetail<HeritageCustomFields>;
