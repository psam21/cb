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
