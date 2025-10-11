/**
 * useExploreHeritage Hook
 * Layer 3: Hook (State & Orchestration)
 * 
 * SOA Compliance:
 * - ✅ Manages state (isLoading, error, heritageItems, pagination)
 * - ✅ Calls service layer (GenericHeritageService)
 * - ✅ Maps events to UI-friendly format
 * - ✅ Implements pagination logic
 * - ❌ NO relay queries (use service)
 * - ❌ NO UI rendering (component's job)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { fetchPublicHeritage, type HeritageEvent } from '@/services/generic/GenericHeritageService';

/**
 * Heritage item for explore page (UI-friendly format)
 */
export interface HeritageExploreItem {
  id: string;
  dTag: string;
  name: string;
  location: string;
  region: string;
  image: string;
  contributors: number; // Always 1 (single author)
  mediaCount: number;
  tags: string[];
  description: string;
  category: string;
  publishedAt: number;
  relativeTime: string; // "2 days ago"
}

/**
 * Calculate relative time string
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000; // Convert to seconds
  const diff = now - timestamp;
  
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
  if (diff < week) return `${Math.floor(diff / day)} days ago`;
  if (diff < month) return `${Math.floor(diff / week)} weeks ago`;
  if (diff < year) return `${Math.floor(diff / month)} months ago`;
  return `${Math.floor(diff / year)} years ago`;
}

/**
 * Map HeritageEvent to HeritageExploreItem
 */
function mapToExploreItem(event: HeritageEvent): HeritageExploreItem {
  const totalMedia = 
    event.media.images.length +
    event.media.audio.length +
    event.media.videos.length;
  
  // Use first image, or placeholder
  const image = event.media.images[0] || 
                event.media.videos[0] || 
                'https://images.unsplash.com/photo-1606114701010-e2b90b5ab7d8?w=400&h=300&fit=crop';
  
  return {
    id: event.id,
    dTag: event.dTag,
    name: event.title,
    // Use region as location since that's what's in the event tags
    location: event.region || event.location || 'Unknown Location',
    region: event.region || 'Unknown Region',
    image,
    contributors: 1, // Each event has single author
    mediaCount: totalMedia,
    tags: event.tags,
    description: event.summary,
    category: event.category,
    publishedAt: event.publishedAt,
    relativeTime: getRelativeTime(event.publishedAt),
  };
}

/**
 * useExploreHeritage Hook
 * 
 * Manages state and orchestrates heritage data fetching for /explore page
 * Implements Load More pagination
 */
export function useExploreHeritage() {
  // State
  const [heritageItems, setHeritageItems] = useState<HeritageExploreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Initial load: Fetch first 8 items (2 featured + 6 grid)
   */
  const loadInitial = useCallback(async () => {
    try {
      logger.info('Loading initial heritage items', {
        service: 'useExploreHeritage',
        method: 'loadInitial',
        limit: 8,
      });

      setIsLoading(true);
      setError(null);

      // Fetch 8 items (no 'until' parameter)
      const events = await fetchPublicHeritage(8);
      
      // Map to UI format
      const items = events.map(mapToExploreItem);
      
      setHeritageItems(items);
      
      // If we got less than 8 events, there's no more to load
      setHasMore(events.length === 8);

      logger.info('Initial heritage items loaded', {
        service: 'useExploreHeritage',
        method: 'loadInitial',
        itemCount: items.length,
        hasMore: events.length === 8,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load heritage';
      
      logger.error('Error loading initial heritage items', err instanceof Error ? err : new Error(errorMessage), {
        service: 'useExploreHeritage',
        method: 'loadInitial',
      });
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load More: Fetch 6 additional items
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || heritageItems.length === 0) {
      return;
    }

    try {
      logger.info('Loading more heritage items', {
        service: 'useExploreHeritage',
        method: 'loadMore',
        currentCount: heritageItems.length,
      });

      setIsLoadingMore(true);

      // Get timestamp of last item for pagination
      const lastTimestamp = heritageItems[heritageItems.length - 1].publishedAt;
      
      // Fetch 6 more items using 'until' parameter
      const events = await fetchPublicHeritage(6, lastTimestamp);
      
      // Map to UI format
      const newItems = events.map(mapToExploreItem);
      
      // Append to existing items (with deduplication by dTag)
      setHeritageItems(prev => {
        const existingDTags = new Set(prev.map(item => item.dTag));
        const uniqueNewItems = newItems.filter(item => !existingDTags.has(item.dTag));
        return [...prev, ...uniqueNewItems];
      });
      
      // If we got less than 6 events, there's no more to load
      setHasMore(events.length === 6);

      logger.info('More heritage items loaded', {
        service: 'useExploreHeritage',
        method: 'loadMore',
        newItemCount: newItems.length,
        totalCount: heritageItems.length + newItems.length,
        hasMore: events.length === 6,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more heritage';
      
      logger.error('Error loading more heritage items', err instanceof Error ? err : new Error(errorMessage), {
        service: 'useExploreHeritage',
        method: 'loadMore',
      });
      
      // Don't set main error, just log it
      logger.warn('Load more failed, but keeping existing items', {
        service: 'useExploreHeritage',
        method: 'loadMore',
        error: errorMessage,
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [heritageItems, isLoadingMore, hasMore]);

  /**
   * Refetch: Reload from beginning
   */
  const refetch = useCallback(() => {
    logger.info('Refetching heritage items', {
      service: 'useExploreHeritage',
      method: 'refetch',
    });
    
    setHeritageItems([]);
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  // Load initial data on mount
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    heritageItems,
    isLoading,
    error,
    refetch,
    loadMore,
    isLoadingMore,
    hasMore,
  };
}
