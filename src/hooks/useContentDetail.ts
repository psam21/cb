'use client';

import { useCallback, useEffect, useState } from 'react';
import { contentDetailService } from '@/services/business/ContentDetailService';
import type { ContentDetail, ContentDetailResult, ContentType } from '@/types/content-detail';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

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
      const error = new AppError(
        result.error ?? 'Content not found',
        ErrorCode.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        ErrorCategory.RESOURCE,
        ErrorSeverity.LOW
      );
      setData(null);
      setError(error.message);
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
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to load content detail',
            ErrorCode.INTERNAL_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.INTERNAL,
            ErrorSeverity.MEDIUM
          );
      setError(appError.message);
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
