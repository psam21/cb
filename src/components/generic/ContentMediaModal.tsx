'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentMediaViewer } from './ContentMediaViewer';
import type { ContentMediaItem } from '@/types/content-media';

interface ContentMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentMediaItem | null;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function ContentMediaModal({
  isOpen,
  onClose,
  item,
  onPrevious,
  onNext,
}: ContentMediaModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<Element | null>(null);

  const focusFirstElement = useCallback(() => {
    const modalEl = modalRef.current;
    if (!modalEl) return;
    const focusable = modalEl.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      modalEl.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'ArrowLeft') {
        onPrevious?.();
      }
      if (event.key === 'ArrowRight') {
        onNext?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPrevious, onNext]);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement;
      focusFirstElement();
    } else if (previouslyFocusedElementRef.current instanceof HTMLElement) {
      previouslyFocusedElementRef.current.focus();
      previouslyFocusedElementRef.current = null;
    }
  }, [isOpen, focusFirstElement]);

  const handleKeyDownInModal = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Tab') {
        return;
      }

      const modalEl = modalRef.current;
      if (!modalEl) {
        return;
      }

      const focusable = Array.from(
        modalEl.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetParent !== null || el === modalEl);

      if (focusable.length === 0) {
        event.preventDefault();
        modalEl.focus();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    },
    []
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white p-6 shadow-2xl focus:outline-none"
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKeyDownInModal}
        tabIndex={-1}
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-primary-800 shadow focus:outline-none focus:ring-2 focus:ring-accent-400"
          onClick={onClose}
          aria-label="Close media viewer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex items-center justify-center">
          {onPrevious && (
            <button
              type="button"
              onClick={onPrevious}
              className="absolute left-0 z-10 hidden rounded-full bg-white/80 p-2 text-primary-800 shadow transition hover:bg-white lg:flex"
              aria-label="Previous media"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <ContentMediaViewer item={item} className="max-h-[80vh]" controls autoPlay fillContainer />

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="absolute right-0 z-10 hidden rounded-full bg-white/80 p-2 text-primary-800 shadow transition hover:bg-white lg:flex"
              aria-label="Next media"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
