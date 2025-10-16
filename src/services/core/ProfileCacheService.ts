import { logger } from '@/services/core/LoggingService';
import { UserProfile } from '@/services/business/ProfileBusinessService';

/**
 * Performance metrics for cache operations
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  expirations: number;
  invalidations: number;
  sets: number;
  totalHitTime: number; // Milliseconds
  totalMissTime: number; // Milliseconds
}

/**
 * In-memory profile cache to avoid redundant relay queries
 * Profiles are cached for 5 minutes with comprehensive performance tracking
 * 
 * Features:
 * - TTL-based expiration (5 minutes)
 * - Hit/miss/expiration tracking
 * - Performance metrics
 * - Detailed logging for debugging
 */
export class ProfileCacheService {
  private static instance: ProfileCacheService;
  private cache: Map<string, { profile: UserProfile; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    expirations: 0,
    invalidations: 0,
    sets: 0,
    totalHitTime: 0,
    totalMissTime: 0,
  };

  private constructor() {
    logger.info('ProfileCacheService initialized', {
      service: 'ProfileCacheService',
      ttl: this.TTL / 1000 + 's',
    });
  }

  public static getInstance(): ProfileCacheService {
    if (!ProfileCacheService.instance) {
      ProfileCacheService.instance = new ProfileCacheService();
    }
    return ProfileCacheService.instance;
  }

  /**
   * Get profile from cache if available and not expired
   * Tracks hit/miss metrics and performance timing
   */
  public get(pubkey: string): UserProfile | null {
    const startTime = performance.now();
    const cached = this.cache.get(pubkey);
    
    if (!cached) {
      // CACHE MISS
      this.metrics.misses++;
      const elapsed = performance.now() - startTime;
      this.metrics.totalMissTime += elapsed;
      
      logger.info('❌ Profile cache MISS', {
        service: 'ProfileCacheService',
        method: 'get',
        pubkey: pubkey.substring(0, 8) + '...',
        cacheSize: this.cache.size,
        hitRate: this.getHitRate() + '%',
        elapsedMs: elapsed.toFixed(2),
      });
      
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > this.TTL) {
      // CACHE EXPIRATION
      this.metrics.expirations++;
      this.cache.delete(pubkey);
      const elapsed = performance.now() - startTime;
      this.metrics.totalMissTime += elapsed;
      
      logger.info('⏰ Profile cache EXPIRED', {
        service: 'ProfileCacheService',
        method: 'get',
        pubkey: pubkey.substring(0, 8) + '...',
        ageSeconds: Math.floor(age / 1000),
        ttlSeconds: Math.floor(this.TTL / 1000),
        cacheSize: this.cache.size,
        expirations: this.metrics.expirations,
        elapsedMs: elapsed.toFixed(2),
      });
      
      return null;
    }

    // CACHE HIT
    this.metrics.hits++;
    const elapsed = performance.now() - startTime;
    this.metrics.totalHitTime += elapsed;

    logger.info('⚡ Profile cache HIT', {
      service: 'ProfileCacheService',
      method: 'get',
      pubkey: pubkey.substring(0, 8) + '...',
      displayName: cached.profile.display_name,
      ageSeconds: Math.floor(age / 1000),
      remainingSeconds: Math.floor((this.TTL - age) / 1000),
      hitRate: this.getHitRate() + '%',
      elapsedMs: elapsed.toFixed(2),
    });

    return cached.profile;
  }

  /**
   * Store profile in cache with metrics tracking
   */
  public set(pubkey: string, profile: UserProfile): void {
    this.metrics.sets++;
    this.cache.set(pubkey, {
      profile,
      timestamp: Date.now(),
    });

    logger.info('💾 Profile CACHED', {
      service: 'ProfileCacheService',
      method: 'set',
      pubkey: pubkey.substring(0, 8) + '...',
      displayName: profile.display_name,
      hasPicture: !!profile.picture,
      hasNip05: !!profile.nip05,
      cacheSize: this.cache.size,
      totalSets: this.metrics.sets,
    });
  }

  /**
   * Clear entire cache with metrics reporting
   */
  public clear(): void {
    const size = this.cache.size;
    const metrics = { ...this.metrics };
    
    this.cache.clear();
    this.resetMetrics();
    
    logger.info('🗑️ Profile cache CLEARED', {
      service: 'ProfileCacheService',
      method: 'clear',
      clearedEntries: size,
      finalMetrics: {
        hits: metrics.hits,
        misses: metrics.misses,
        expirations: metrics.expirations,
        hitRate: this.calculateHitRate(metrics.hits, metrics.misses + metrics.expirations) + '%',
        avgHitTime: metrics.hits > 0 ? (metrics.totalHitTime / metrics.hits).toFixed(2) + 'ms' : 'N/A',
      },
    });
  }

  /**
   * Remove specific profile from cache
   */
  public invalidate(pubkey: string): void {
    const existed = this.cache.has(pubkey);
    if (existed) {
      this.metrics.invalidations++;
      this.cache.delete(pubkey);
      
      logger.info('🗑️ Profile cache INVALIDATED', {
        service: 'ProfileCacheService',
        method: 'invalidate',
        pubkey: pubkey.substring(0, 8) + '...',
        cacheSize: this.cache.size,
        totalInvalidations: this.metrics.invalidations,
      });
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  public getStats(): {
    size: number;
    ttl: number;
    metrics: CacheMetrics;
    hitRate: string;
    avgHitTime: string;
    avgMissTime: string;
    entries: Array<{ pubkey: string; displayName: string; age: number }>;
  } {
    const totalLookups = this.metrics.hits + this.metrics.misses + this.metrics.expirations;
    const hitRate = this.calculateHitRate(this.metrics.hits, this.metrics.misses + this.metrics.expirations);
    
    // Get snapshot of current cache entries
    const entries = Array.from(this.cache.entries()).map(([pubkey, data]) => ({
      pubkey: pubkey.substring(0, 8) + '...',
      displayName: data.profile.display_name,
      age: Math.floor((Date.now() - data.timestamp) / 1000),
    }));

    return {
      size: this.cache.size,
      ttl: this.TTL / 1000,
      metrics: { ...this.metrics },
      hitRate: hitRate + '%',
      avgHitTime: this.metrics.hits > 0 
        ? (this.metrics.totalHitTime / this.metrics.hits).toFixed(2) + 'ms' 
        : 'N/A',
      avgMissTime: (this.metrics.misses + this.metrics.expirations) > 0
        ? (this.metrics.totalMissTime / (this.metrics.misses + this.metrics.expirations)).toFixed(2) + 'ms'
        : 'N/A',
      entries,
    };
  }

  /**
   * Get current hit rate percentage
   */
  private getHitRate(): number {
    return this.calculateHitRate(this.metrics.hits, this.metrics.misses + this.metrics.expirations);
  }

  /**
   * Calculate hit rate percentage
   */
  private calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses;
    if (total === 0) return 0;
    return Math.round((hits / total) * 100);
  }

  /**
   * Reset metrics (used when clearing cache)
   */
  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      expirations: 0,
      invalidations: 0,
      sets: 0,
      totalHitTime: 0,
      totalMissTime: 0,
    };
  }

  /**
   * Print detailed cache statistics (useful for debugging)
   */
  public logDetailedStats(): void {
    const stats = this.getStats();
    
    logger.info('📊 Profile Cache Statistics', {
      service: 'ProfileCacheService',
      method: 'logDetailedStats',
      cacheSize: stats.size,
      ttlSeconds: stats.ttl,
      metrics: {
        hits: stats.metrics.hits,
        misses: stats.metrics.misses,
        expirations: stats.metrics.expirations,
        invalidations: stats.metrics.invalidations,
        sets: stats.metrics.sets,
        hitRate: stats.hitRate,
        avgHitTime: stats.avgHitTime,
        avgMissTime: stats.avgMissTime,
      },
      entries: stats.entries.length > 0 ? stats.entries.slice(0, 10) : [],
    });
  }
}

export const profileCacheService = ProfileCacheService.getInstance();
