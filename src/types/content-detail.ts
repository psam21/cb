import type { ContentMediaItem } from './content-media';

export type ContentType = 'shop' | 'heritage' | 'contribute' | 'courses' | 'exhibitions' | 'downloads' | 'generic';

export interface ContentAuthor {
  pubkey: string;
  npub?: string;
  displayName?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

export interface ContentAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  type?: 'primary' | 'secondary' | 'ghost';
  ariaLabel?: string;
  disabled?: boolean;
}

export interface ContentContactInfo {
  label: string;
  value: string;
  href?: string;
  description?: string;
}

export interface BaseContentDetail {
  id: string;
  dTag?: string;
  title: string;
  summary?: string;
  description: string;
  publishedAt: number;
  updatedAt?: number;
  author: ContentAuthor;
  tags: string[];
  media: ContentMediaItem[];
  contact?: ContentContactInfo;
  location?: string;
  relays?: string[];
  bookmarkable?: boolean;
  shareable?: boolean;
}

export interface ContentMeta {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tooltip?: string;
}

export interface ContentDetail<TCustomFields = Record<string, unknown>> extends BaseContentDetail {
  contentType: ContentType;
  customFields: TCustomFields;
  meta: ContentMeta[];
  actions: ContentAction[];
}

export interface ContentDetailResult<TCustomFields = Record<string, unknown>> {
  success: boolean;
  content?: ContentDetail<TCustomFields>;
  error?: string;
  status?: number;
}

export interface ContentBreadcrumb {
  label: string;
  href: string;
}
