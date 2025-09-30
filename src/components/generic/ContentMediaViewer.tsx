'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import type { ContentMediaItem } from '@/types/content-media';

interface ContentMediaViewerProps {
  item: ContentMediaItem | null;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  fillContainer?: boolean; // When true, respects natural aspect ratio instead of forcing 4:3
}

const MEDIA_PLACEHOLDER = '/favicon.svg';

export function ContentMediaViewer({
  item,
  className = '',
  autoPlay = false,
  controls = true,
  fillContainer = false,
}: ContentMediaViewerProps) {
  const mediaType = item?.type ?? 'image';
  const [isLoading, setIsLoading] = useState<boolean>(!!item);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(!!item);
    setHasError(false);
  }, [item]);

  const mediaContent = useMemo(() => {
    const loadingOverlay = isLoading ? (
      <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary-100" aria-hidden="true" />
    ) : null;

    const errorFallback = (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-primary-50 text-center text-primary-500">
        <span className="text-sm font-semibold">We couldn9t load this media.</span>
        <span className="text-xs">Please try again later.</span>
      </div>
    );

    if (!item) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-300">
          <span className="text-sm font-medium">No media available</span>
        </div>
      );
    }

    if (hasError) {
      return errorFallback;
    }

    switch (mediaType) {
      case 'video':
        return (
          <video
            key={item.id}
            className="h-full w-full rounded-2xl bg-black object-contain"
            controls={controls}
            autoPlay={autoPlay}
            preload="metadata"
            onCanPlay={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          >
            <source src={item.source.url} type={item.source.mimeType ?? 'video/mp4'} />
            Your browser does not support the video tag.
          </video>
        );
      case 'audio':
        return (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-primary-900 p-6 text-white">
            <span className="mb-4 text-lg font-semibold">Audio Preview</span>
            <audio
              key={item.id}
              className="w-full"
              controls={controls}
              autoPlay={autoPlay}
              onCanPlay={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
            >
              <source src={item.source.url} type={item.source.mimeType ?? 'audio/mpeg'} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      default:
        return (
          <div className="relative h-full w-full overflow-hidden rounded-2xl bg-primary-50">
            <Image
              key={item.id}
              src={item.source.url || MEDIA_PLACEHOLDER}
              alt={item.title || 'Media asset'}
              fill
              className={fillContainer ? "object-contain" : "object-cover"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoadingComplete={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              loading="lazy"
            />
            {loadingOverlay}
          </div>
        );
    }
  }, [item, mediaType, autoPlay, controls, hasError, isLoading, fillContainer]);

  // Use natural aspect ratio when fillContainer is true (modal view), otherwise force 4:3 (gallery view)
  const containerClass = fillContainer 
    ? `relative w-full h-full ${className}` 
    : `relative aspect-[4/3] w-full max-w-3xl ${className}`;

  return <div className={containerClass}>{mediaContent}</div>;
}
