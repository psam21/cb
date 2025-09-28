export type ContentMediaType = 'image' | 'video' | 'audio';

export interface ContentMediaSource {
  url: string;
  mimeType?: string;
  size?: number;
  hash?: string;
  name?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // seconds for audio/video
}

export interface ContentMediaItem {
  id: string;
  type: ContentMediaType;
  title?: string;
  description?: string;
  source: ContentMediaSource;
  thumbnailUrl?: string;
  // Additional metadata for future use
  metadata?: Record<string, unknown>;
}

export interface MediaGalleryState {
  activeIndex: number;
  isModalOpen: boolean;
}
