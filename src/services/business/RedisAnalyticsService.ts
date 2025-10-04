/**
 * Business Service for Redis Analytics
 * Handles Redis statistics and monitoring operations
 * 
 * SOA Layer: Business Service
 * Dependencies: KVService (Core)
 */

import { RedisClientType } from 'redis';
import { KVService } from '../core/KVService';
import { logger } from '../core/LoggingService';

export interface RedisInfoSection {
  [key: string]: string | number | boolean;
}

export interface KeyPatternAnalysis {
  pattern: string;
  description: string;
  count: number;
  sampleKeys: string[];
  estimatedMemory: string;
  estimatedMemoryBytes: number;
}

export interface RedisMemoryBreakdown {
  usedMemory: string;
  usedMemoryHuman: string;
  usedMemoryRss: string;
  usedMemoryPeak: string;
  usedMemoryPeakHuman: string;
  memoryFragmentationRatio: number;
  allocatorFragmentationRatio: number;
}

export interface RedisPerformanceMetrics {
  totalCommandsProcessed: number;
  instantaneousOpsPerSec: number;
  totalNetInputBytes: string;
  totalNetOutputBytes: string;
  rejectedConnections: number;
}

export interface RedisCustomAnalytics {
  totalKeys: number;
  keysByPattern: KeyPatternAnalysis[];
  userCount: number;
  eventCount: number;
  indexCount: number;
  memoryBreakdown: RedisMemoryBreakdown;
  performance: RedisPerformanceMetrics;
}

export interface RedisInfoResponse {
  timestamp: string;
  connectionStatus: string;
  server: RedisInfoSection;
  clients: RedisInfoSection;
  memory: RedisInfoSection;
  persistence: RedisInfoSection;
  stats: RedisInfoSection;
  replication: RedisInfoSection;
  cpu: RedisInfoSection;
  keyspace: RedisInfoSection;
  cluster: RedisInfoSection;
  customAnalytics: RedisCustomAnalytics;
  rawInfo: string;
}

export class RedisAnalyticsService {
  private kvService: KVService;

  constructor() {
    this.kvService = KVService.getInstance();
  }

  /**
   * Get comprehensive Redis information and statistics
   */
  async getRedisInfo(): Promise<RedisInfoResponse> {
    try {
      logger.info('Fetching comprehensive Redis information', {
        service: 'RedisAnalyticsService',
        method: 'getRedisInfo',
      });

      const redis = await this.kvService.getRedisClient();

      // Get comprehensive Redis INFO
      const rawInfo = await redis.info();
      const parsedInfo = this.parseRedisInfo(rawInfo);

      // Get keyspace information
      const dbSize = await redis.dbSize();

      // Analyze key patterns
      const keysByPattern = await this.analyzeKeyPatterns(redis);

      // Count unique users and events
      const { userCount, indexKeys } = await this.countUsers(redis);
      const eventCount = await this.countEvents(redis);

      // Build memory breakdown
      const memorySection = parsedInfo.memory || {};
      const memoryBreakdown = this.buildMemoryBreakdown(memorySection);

      // Build performance metrics
      const statsSection = parsedInfo.stats || {};
      const performance = this.buildPerformanceMetrics(statsSection);

      const response: RedisInfoResponse = {
        timestamp: new Date().toISOString(),
        connectionStatus: 'Connected',
        server: parsedInfo.server || {},
        clients: parsedInfo.clients || {},
        memory: memorySection,
        persistence: parsedInfo.persistence || {},
        stats: statsSection,
        replication: parsedInfo.replication || {},
        cpu: parsedInfo.cpu || {},
        keyspace: parsedInfo.keyspace || {},
        cluster: parsedInfo.cluster || {},
        customAnalytics: {
          totalKeys: dbSize,
          keysByPattern,
          userCount,
          eventCount,
          indexCount: indexKeys.length,
          memoryBreakdown,
          performance,
        },
        rawInfo,
      };

      logger.info('Redis information retrieved successfully', {
        service: 'RedisAnalyticsService',
        method: 'getRedisInfo',
        totalKeys: dbSize,
        userCount,
        eventCount,
      });

      return response;
    } catch (error) {
      logger.error('Failed to retrieve Redis information', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'RedisAnalyticsService',
        method: 'getRedisInfo',
      });
      throw error;
    }
  }

  /**
   * Parse Redis INFO command output into structured sections
   */
  private parseRedisInfo(infoString: string): Record<string, RedisInfoSection> {
    const sections: Record<string, RedisInfoSection> = {};
    let currentSection = 'general';

    const lines = infoString.split('\r\n');

    for (const line of lines) {
      if (!line || line.startsWith('#')) {
        if (line.startsWith('# ')) {
          currentSection = line.substring(2).toLowerCase();
          sections[currentSection] = {};
        }
        continue;
      }

      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();

        // Try to convert to number if possible
        const numValue = parseFloat(value);
        sections[currentSection][key] = isNaN(numValue) ? value : numValue;
      }
    }

    return sections;
  }

  /**
   * Analyze keys by pattern
   */
  private async analyzeKeyPatterns(redis: RedisClientType): Promise<KeyPatternAnalysis[]> {
    const keyPatterns = [
      { pattern: 'user_events:*', description: 'User event data' },
      { pattern: 'user_events_index:*', description: 'User event indexes' },
    ];

    const results: KeyPatternAnalysis[] = [];

    for (const { pattern, description } of keyPatterns) {
      const keys: string[] = [];
      let cursor = 0;

      do {
        const scanResult = await redis.scan(cursor.toString(), {
          MATCH: pattern,
          COUNT: 1000,
        });

        cursor = typeof scanResult.cursor === 'string' ? parseInt(scanResult.cursor) : scanResult.cursor;
        keys.push(...scanResult.keys);
      } while (cursor !== 0);

      const estimatedMemory = await this.estimateKeyMemory(redis, keys);

      results.push({
        pattern,
        description,
        count: keys.length,
        sampleKeys: keys.slice(0, 5),
        estimatedMemory: this.formatBytes(estimatedMemory),
        estimatedMemoryBytes: estimatedMemory,
      });
    }

    return results;
  }

  /**
   * Count unique users from index keys
   */
  private async countUsers(redis: RedisClientType): Promise<{ userCount: number; indexKeys: string[] }> {
    const indexKeys: string[] = [];
    let cursor = 0;

    do {
      const scanResult = await redis.scan(cursor.toString(), {
        MATCH: 'user_events_index:*',
        COUNT: 1000,
      });

      cursor = typeof scanResult.cursor === 'string' ? parseInt(scanResult.cursor) : scanResult.cursor;
      indexKeys.push(...scanResult.keys);
    } while (cursor !== 0);

    return { userCount: indexKeys.length, indexKeys };
  }

  /**
   * Count actual event keys (not index keys)
   */
  private async countEvents(redis: RedisClientType): Promise<number> {
    const eventKeys: string[] = [];
    let cursor = 0;

    do {
      const scanResult = await redis.scan(cursor.toString(), {
        MATCH: 'user_events:*',
        COUNT: 1000,
      });

      cursor = typeof scanResult.cursor === 'string' ? parseInt(scanResult.cursor) : scanResult.cursor;
      const filteredKeys = scanResult.keys.filter((key: string) => !key.includes('user_events_index:'));
      eventKeys.push(...filteredKeys);
    } while (cursor !== 0);

    return eventKeys.length;
  }

  /**
   * Estimate memory usage for a set of keys
   */
  private async estimateKeyMemory(redis: RedisClientType, keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    let totalMemory = 0;
    const sampleSize = Math.min(10, keys.length);

    for (let i = 0; i < sampleSize; i++) {
      try {
        const memory = await redis.memoryUsage(keys[i]);
        if (memory) {
          totalMemory += memory;
        }
      } catch (error) {
        continue;
      }
    }

    const avgMemoryPerKey = totalMemory / sampleSize;
    return Math.round(avgMemoryPerKey * keys.length);
  }

  /**
   * Build memory breakdown from Redis INFO memory section
   */
  private buildMemoryBreakdown(memorySection: RedisInfoSection): RedisMemoryBreakdown {
    return {
      usedMemory: this.formatBytes(Number(memorySection.used_memory) || 0),
      usedMemoryHuman: String(memorySection.used_memory_human || 'N/A'),
      usedMemoryRss: this.formatBytes(Number(memorySection.used_memory_rss) || 0),
      usedMemoryPeak: this.formatBytes(Number(memorySection.used_memory_peak) || 0),
      usedMemoryPeakHuman: String(memorySection.used_memory_peak_human || 'N/A'),
      memoryFragmentationRatio: Number(memorySection.mem_fragmentation_ratio) || 0,
      allocatorFragmentationRatio: Number(memorySection.allocator_frag_ratio) || 0,
    };
  }

  /**
   * Build performance metrics from Redis INFO stats section
   */
  private buildPerformanceMetrics(statsSection: RedisInfoSection): RedisPerformanceMetrics {
    return {
      totalCommandsProcessed: Number(statsSection.total_commands_processed) || 0,
      instantaneousOpsPerSec: Number(statsSection.instantaneous_ops_per_sec) || 0,
      totalNetInputBytes: this.formatBytes(Number(statsSection.total_net_input_bytes) || 0),
      totalNetOutputBytes: this.formatBytes(Number(statsSection.total_net_output_bytes) || 0),
      rejectedConnections: Number(statsSection.rejected_connections) || 0,
    };
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}

// Export singleton instance
export const redisAnalyticsService = new RedisAnalyticsService();
