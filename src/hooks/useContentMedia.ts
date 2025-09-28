'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ContentMediaItem } from '@/types/content-media';

export interface UseContentMediaOptions {
  initialIndex?: number;
}

export interface UseContentMediaResult {
  activeItem: ContentMediaItem | null;
  activeIndex: number;
  isModalOpen: boolean;
  items: ContentMediaItem[];
  setActiveIndex: (index: number) => void;
  openModal: (index?: number) => void;
  closeModal: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
}

export const useContentMedia = (
  mediaItems: ContentMediaItem[],
  options: UseContentMediaOptions = {}
): UseContentMediaResult => {
  const { initialIndex = 0 } = options;
  const [activeIndex, setActiveIndexState] = useState(() =>
    mediaItems.length > 0 ? Math.min(initialIndex, mediaItems.length - 1) : 0
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeItem = useMemo(() => mediaItems[activeIndex] || null, [mediaItems, activeIndex]);

  const setActiveIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= mediaItems.length) {
        return;
      }
      setActiveIndexState(index);
    },
    [mediaItems.length]
  );

  const openModal = useCallback(
    (index?: number) => {
      if (typeof index === 'number') {
        setActiveIndex(index);
      }
      setIsModalOpen(true);
    },
    [setActiveIndex]
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const goToNext = useCallback(() => {
    setActiveIndexState(prev => {
      if (mediaItems.length === 0) return prev;
      return prev === mediaItems.length - 1 ? 0 : prev + 1;
    });
  }, [mediaItems.length]);

  const goToPrevious = useCallback(() => {
    setActiveIndexState(prev => {
      if (mediaItems.length === 0) return prev;
      return prev === 0 ? mediaItems.length - 1 : prev - 1;
    });
  }, [mediaItems.length]);

  return {
    activeItem,
    activeIndex,
    isModalOpen,
    items: mediaItems,
    setActiveIndex,
    openModal,
    closeModal,
    goToNext,
    goToPrevious,
  };
};
