import { logger } from '@/services/core/LoggingService';
import type { ContentDetailProvider } from './ContentDetailService';
import type { ContentDetailResult } from '@/types/content-detail';

/**
 * Base class for content detail providers
 * Provides common functionality for singleton pattern, author utilities, and logging
 */
export abstract class BaseContentProvider<TCustomFields = Record<string, unknown>>
  implements ContentDetailProvider<TCustomFields>
{
  /**
   * Get content detail by ID
   * Must be implemented by subclasses
   */
  abstract getContentDetail(id: string): Promise<ContentDetailResult<TCustomFields>>;

  /**
   * Get the service name for logging
   * Must be implemented by subclasses
   */
  protected abstract getServiceName(): string;

  /**
   * Convert pubkey to npub format
   * Uses ProfileBusinessService with dynamic import to avoid circular dependencies
   */
  protected tryGetNpub(pubkey: string): string | undefined {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { profileService } = require('./ProfileBusinessService');
      return profileService.pubkeyToNpub(pubkey);
    } catch (error) {
      logger.warn('Failed to convert pubkey to npub', {
        service: this.getServiceName(),
        method: 'tryGetNpub',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return undefined;
    }
  }

  /**
   * Get author display name from profile
   * Uses ProfileBusinessService with dynamic import to avoid circular dependencies
   */
  protected async tryGetAuthorDisplayName(pubkey: string): Promise<string | undefined> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { profileService } = require('./ProfileBusinessService');
      const profile = await profileService.getUserProfile(pubkey);
      return profile?.display_name || undefined;
    } catch (error) {
      logger.warn('Failed to fetch author display name', {
        service: this.getServiceName(),
        method: 'tryGetAuthorDisplayName',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return undefined;
    }
  }
}
