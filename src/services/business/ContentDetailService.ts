import { logger } from '@/services/core/LoggingService';
import type { ContentDetailResult, ContentType } from '@/types/content-detail';

export interface ContentDetailProvider<TCustomFields = Record<string, unknown>> {
  getContentDetail(id: string): Promise<ContentDetailResult<TCustomFields>>;
}

export class ContentDetailService {
  private static instance: ContentDetailService;
  private providers = new Map<ContentType, ContentDetailProvider>();

  private constructor() {}

  public static getInstance(): ContentDetailService {
    if (!ContentDetailService.instance) {
      ContentDetailService.instance = new ContentDetailService();
    }
    return ContentDetailService.instance;
  }

  public registerProvider(contentType: ContentType, provider: ContentDetailProvider): void {
    logger.info('Registering content detail provider', {
      service: 'ContentDetailService',
      method: 'registerProvider',
      contentType,
    });
    this.providers.set(contentType, provider);
  }

  public getProvider(contentType: ContentType): ContentDetailProvider | undefined {
    return this.providers.get(contentType);
  }

  public async getContentDetail<TCustomFields = Record<string, unknown>>(
    contentType: ContentType,
    id: string
  ): Promise<ContentDetailResult<TCustomFields>> {
    const provider = this.providers.get(contentType);
    if (!provider) {
      const errorMessage = `No content detail provider registered for type "${contentType}"`;
      logger.error(errorMessage, undefined, {
        service: 'ContentDetailService',
        method: 'getContentDetail',
        contentType,
        id,
      });
      return {
        success: false,
        error: errorMessage,
        status: 500,
      };
    }

    try {
      const result = await provider.getContentDetail(id);
      if (!result.success) {
        logger.warn('Content detail provider returned failure', {
          service: 'ContentDetailService',
          method: 'getContentDetail',
          contentType,
          id,
          error: result.error,
          status: result.status,
        });
      }
      return result as ContentDetailResult<TCustomFields>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown content detail error';
      logger.error('Failed to get content detail', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ContentDetailService',
        method: 'getContentDetail',
        contentType,
        id,
        error: errorMessage,
      });
      return {
        success: false,
        error: errorMessage,
        status: 500,
      };
    }
  }
}

export const contentDetailService = ContentDetailService.getInstance();
