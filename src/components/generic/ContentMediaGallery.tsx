'use client';

import { useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { Maximize2, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Music } from 'lucide-react';
import Image from 'next/image';
import type { ContentMediaItem } from '@/types/content-media';
import { useContentMedia } from '@/hooks/useContentMedia';
import { ContentMediaViewer } from './ContentMediaViewer';

const ContentMediaModal = dynamic(
  () => import('./ContentMediaModal').then(module => module.ContentMediaModal),
  { ssr: false }
);

const THUMBNAIL_PLACEHOLDER = '/favicon.svg';

interface ContentMediaGalleryProps {
  items: ContentMediaItem[];
  initialIndex?: number;
  className?: string;
  enableModal?: boolean;
}

export function ContentMediaGallery({
  items,
  initialIndex = 0,
  className = '',
  enableModal = true,
}: ContentMediaGalleryProps) {
  const { activeItem, activeIndex, setActiveIndex, openModal, closeModal, isModalOpen, goToNext, goToPrevious } =
    useContentMedia(items, { initialIndex });

  const hasMultipleItems = items.length > 1;
  const thumbnailItems = useMemo(() => items.map((media, index) => ({ media, index })), [items]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const resetTouch = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
    touchCurrentX.current = null;
  }, []);

  const handleTouchStart = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchCurrentX.current = touch.clientX;
  }, []);

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (touchStartX.current === null || touchStartY.current === null) {
        return;
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      touchCurrentX.current = touch.clientX;

      // Ignore swipe if mostly vertical to prevent interference with page scroll
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        resetTouch();
      }
    },
    [resetTouch]
  );

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchCurrentX.current === null) {
      return;
    }

    const deltaX = touchStartX.current - touchCurrentX.current;
    resetTouch();

    if (Math.abs(deltaX) < 40) {
      return;
    }

    if (deltaX > 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  }, [goToNext, goToPrevious, resetTouch]);

  return (
    <div className={`w-full ${className}`}>
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetTouch}
      >
        <ContentMediaViewer item={activeItem} className="w-full" />

        {enableModal && (
          <button
            type="button"
            onClick={() => openModal()}
            className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-primary-800 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent-400"
            aria-label="Open media in fullscreen"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        )}

        {hasMultipleItems && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-primary-800 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent-400 lg:flex"
              aria-label="Previous media"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-primary-800 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent-400 lg:flex"
              aria-label="Next media"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {thumbnailItems.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {thumbnailItems.map(({ media, index }) => {
            const isActive = activeIndex === index;
            const icon =
              media.type === 'video' ? (
                <Video className="h-4 w-4" />
              ) : media.type === 'audio' ? (
                <Music className="h-4 w-4" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              );

            const thumbnailContent = media.type === 'image'
              ? (
                  <Image
                    src={media.source.url || THUMBNAIL_PLACEHOLDER}
                    alt={media.title || 'Media thumbnail'}
                    fill
                    className="object-cover"
                    sizes="112px"
                    loading="lazy"
                  />
                )
              : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-900 text-white">
                    {icon}
                  </div>
                );

            return (
              <button
                key={media.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`group relative aspect-square overflow-hidden rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-accent-400 ${
                  isActive ? 'border-accent-500 ring-2 ring-accent-200' : 'border-transparent hover:border-primary-200'
                }`}
                aria-label={`View ${media.type} ${index + 1}`}
              >
                {thumbnailContent}
                <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between rounded-full bg-black/55 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                  <span className="flex items-center gap-1">
                    {icon}
                    {media.type.toUpperCase()}
                  </span>
                  <span>{index + 1}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {enableModal && (
        <ContentMediaModal
          isOpen={isModalOpen}
          onClose={closeModal}
          item={activeItem}
          onNext={hasMultipleItems ? goToNext : undefined}
          onPrevious={hasMultipleItems ? goToPrevious : undefined}
        />
      )}
    </div>
  );
}
