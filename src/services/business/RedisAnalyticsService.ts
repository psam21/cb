/**
 * Business Service for Redis Analytics
 * Handles Redis statistics and monitoring operations
 * 
 * SOA Layer: Business Service
 * Dependencies: KVService (Core)
 */

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

      // Get comprehensive Redis INFO from Core Service
      const rawInfo = await this.kvService.getRedisInfo();
      const parsedInfo = this.parseRedisInfo(rawInfo);

      // Get keyspace information from Core Service
      const dbSize = await this.kvService.getDatabaseSize();

      // Analyze key patterns using Core Service
      const keysByPattern = await this.analyzeKeyPatterns();

      // Count unique users and events using Core Service
      const { userCount, indexKeys } = await this.countUsers();
      const eventCount = await this.countEvents();

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
  private async analyzeKeyPatterns(): Promise<KeyPatternAnalysis[]> {
    const keyPatterns = [
      { pattern: 'user_events:*', description: 'User event data' },
      { pattern: 'user_events_index:*', description: 'User event indexes' },
    ];

    const results: KeyPatternAnalysis[] = [];

    for (const { pattern, description } of keyPatterns) {
      // Use Core Service to scan keys
      const keys = await this.kvService.scanKeys(pattern, 1000);

      // Use Core Service to estimate memory
      const estimatedMemory = await this.estimateKeyMemory(keys);

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
  private async countUsers(): Promise<{ userCount: number; indexKeys: string[] }> {
    // Use Core Service to scan index keys
    const indexKeys = await this.kvService.scanKeys('user_events_index:*', 1000);
    return { userCount: indexKeys.length, indexKeys };
  }

  /**
   * Count actual event keys (not index keys)
   */
  private async countEvents(): Promise<number> {
    // Use Core Service to scan event keys
    const allKeys = await this.kvService.scanKeys('user_events:*', 1000);
    const eventKeys = allKeys.filter((key: string) => !key.includes('user_events_index:'));
    return eventKeys.length;
  }

  /**
   * Estimate memory usage for a set of keys
   */
  private async estimateKeyMemory(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    let totalMemory = 0;
    const sampleSize = Math.min(10, keys.length);

    for (let i = 0; i < sampleSize; i++) {
      // Use Core Service to get memory usage
      const memory = await this.kvService.getKeyMemoryUsage(keys[i]);
      if (memory) {
        totalMemory += memory;
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
