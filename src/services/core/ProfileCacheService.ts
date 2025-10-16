import { logger } from '@/services/core/LoggingService';
import { UserProfile } from '@/services/business/ProfileBusinessService';

/**
 * In-memory profile cache to avoid redundant relay queries
 * Profiles are cached for 5 minutes
 */
export class ProfileCacheService {
  private static instance: ProfileCacheService;
  private cache: Map<string, { profile: UserProfile; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): ProfileCacheService {
    if (!ProfileCacheService.instance) {
      ProfileCacheService.instance = new ProfileCacheService();
    }
    return ProfileCacheService.instance;
  }

  /**
   * Get profile from cache if available and not expired
   */
  public get(pubkey: string): UserProfile | null {
    const cached = this.cache.get(pubkey);
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > this.TTL) {
      // Expired - remove from cache
      this.cache.delete(pubkey);
      logger.debug('Profile cache expired', {
        service: 'ProfileCacheService',
        pubkey: pubkey.substring(0, 8) + '...',
        age: Math.floor(age / 1000) + 's',
      });
      return null;
    }

    logger.debug('Profile cache hit', {
      service: 'ProfileCacheService',
      pubkey: pubkey.substring(0, 8) + '...',
      age: Math.floor(age / 1000) + 's',
    });

    return cached.profile;
  }

  /**
   * Store profile in cache
   */
  public set(pubkey: string, profile: UserProfile): void {
    this.cache.set(pubkey, {
      profile,
      timestamp: Date.now(),
    });

    logger.debug('Profile cached', {
      service: 'ProfileCacheService',
      pubkey: pubkey.substring(0, 8) + '...',
      displayName: profile.display_name,
      cacheSize: this.cache.size,
    });
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Profile cache cleared', {
      service: 'ProfileCacheService',
      clearedEntries: size,
    });
  }

  /**
   * Remove specific profile from cache
   */
  public invalidate(pubkey: string): void {
    this.cache.delete(pubkey);
    logger.debug('Profile cache invalidated', {
      service: 'ProfileCacheService',
      pubkey: pubkey.substring(0, 8) + '...',
    });
  }

  /**
   * Get cache statistics
   */
  public getStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.TTL,
    };
  }
}

export const profileCacheService = ProfileCacheService.getInstance();
