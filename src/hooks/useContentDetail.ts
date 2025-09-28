'use client';

import { useCallback, useEffect, useState } from 'react';
import { contentDetailService } from '@/services/business/ContentDetailService';
import type { ContentDetail, ContentDetailResult, ContentType } from '@/types/content-detail';

export interface UseContentDetailOptions {
  enabled?: boolean;
  lazy?: boolean;
}

export interface UseContentDetailState<TCustomFields = Record<string, unknown>> {
  data: ContentDetail<TCustomFields> | null;
  isLoading: boolean;
  error: string | null;
  status?: number;
  refresh: () => Promise<void>;
}

export const useContentDetail = <TCustomFields = Record<string, unknown>>(
  contentType: ContentType,
  id: string,
  options: UseContentDetailOptions = {}
): UseContentDetailState<TCustomFields> => {
  const { enabled = true, lazy = false } = options;
  const [data, setData] = useState<ContentDetail<TCustomFields> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && !lazy);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | undefined>(undefined);

  const handleResult = useCallback((result: ContentDetailResult<TCustomFields>) => {
    if (!result.success || !result.content) {
      setData(null);
      setError(result.error ?? 'Content not found');
      setStatus(result.status);
      return;
    }
    setData(result.content);
    setError(null);
    setStatus(result.status);
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!enabled || !id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contentDetailService.getContentDetail<TCustomFields>(contentType, id);
      handleResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content detail';
      setError(errorMessage);
      setData(null);
      setStatus(500);
    } finally {
      setIsLoading(false);
    }
  }, [contentType, enabled, id, handleResult]);

  useEffect(() => {
    if (!enabled || lazy) {
      return;
    }
    fetchDetail();
  }, [fetchDetail, enabled, lazy]);

  return {
    data,
    isLoading,
    error,
    status,
    refresh: fetchDetail,
  };
};
