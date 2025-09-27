/**
 * Redis service for user event logging
 * Handles storage and retrieval of Nostr event publishing analytics
 */
import { createClient, RedisClientType } from 'redis';
import { logger } from './LoggingService';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';

export interface UserEventData {
  npub: string;
  eventId: string;
  eventKind: number;
  createdTimestamp: number;
  processedTimestamp: number;
  processingDuration: number;
  totalRelaysAttempted: number;
  successfulRelays: string[];
  failedRelays: string[];
  averageResponseTime: number;
  tagsCount: number;
  retryAttempts: number;
}

export interface PaginatedEventResponse {
  events: UserEventData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class KVService {
  private static instance: KVService;
  private redis: RedisClientType | null = null;
  private connectionPromise: Promise<void> | null = null;
  private isConnected = false;

  private constructor() {
    // Don't initialize connection in constructor for serverless
  }

  private async initializeRedis(): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Return immediately if already connected
    if (this.isConnected && this.redis?.isReady) {
      return Promise.resolve();
    }

    this.connectionPromise = this.connectToRedis();
    return this.connectionPromise;
  }

  private async connectToRedis(): Promise<void> {
    try {
      // Check for Redis URL in environment variables (with fallback)
      const redisUrl = process.env.cb_redis_storage_REDIS_URL || process.env.REDIS_URL;
      
      if (!redisUrl) {
        logger.warn('Redis URL not configured - KV service will not be available', {
          service: 'KVService',
          method: 'connectToRedis',
          checkedVars: ['cb_redis_storage_REDIS_URL', 'REDIS_URL'],
        });
        throw new Error('Redis URL not configured');
      }

      logger.info('Connecting to Redis', {
        service: 'KVService',
        method: 'connectToRedis',
        redisHost: redisUrl.split('@')[1]?.split(':')[0] || 'unknown',
      });

      // Create new client if doesn't exist or is closed
      if (!this.redis || !this.redis.isOpen) {
        this.redis = createClient({ 
          url: redisUrl,
          socket: {
            connectTimeout: 10000, // 10 seconds
          }
        });
        
        this.redis.on('error', (err) => {
          logger.error('Redis client error', err, {
            service: 'KVService',
            method: 'connectToRedis',
          });
          this.isConnected = false;
        });

        this.redis.on('connect', () => {
          logger.info('Redis connected', {
            service: 'KVService',
            method: 'connectToRedis',
          });
        });

        this.redis.on('ready', () => {
          logger.info('Redis ready', {
            service: 'KVService',
            method: 'connectToRedis',
          });
          this.isConnected = true;
        });

        this.redis.on('end', () => {
          logger.info('Redis connection ended', {
            service: 'KVService',
            method: 'connectToRedis',
          });
          this.isConnected = false;
        });
      }

      // Connect if not already connected
      if (!this.redis.isOpen) {
        await this.redis.connect();
      }
      
      this.isConnected = true;
      
      logger.info('Redis client connected successfully', {
        service: 'KVService',
        method: 'connectToRedis',
        isReady: this.redis.isReady,
      });
    } catch (error) {
      this.isConnected = false;
      this.connectionPromise = null;
      logger.error('Failed to connect to Redis', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'KVService',
        method: 'connectToRedis',
      });
      throw error;
    }
  }

  private async ensureConnected(): Promise<boolean> {
    try {
      await this.initializeRedis();
      return this.isConnected && this.redis?.isReady === true;
    } catch (error) {
      logger.error('Failed to ensure Redis connection', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'KVService',
        method: 'ensureConnected',
      });
      return false;
    }
  }

  public static getInstance(): KVService {
    if (!KVService.instance) {
      KVService.instance = new KVService();
    }
    return KVService.instance;
  }

  /**
   * Store event analytics data
   */
  public async logEvent(eventData: UserEventData): Promise<void> {
    try {
      if (!(await this.ensureConnected())) {
        throw new Error('Redis connection not available');
      }

      logger.info('Storing event analytics data', {
        service: 'KVService',
        method: 'logEvent',
        eventId: eventData.eventId,
        npub: eventData.npub.substring(0, 12) + '...',
        eventKind: eventData.eventKind,
      });

      // Create structured key: user_events:{npub}:{timestamp}:{eventId}
      const eventKey = `user_events:${eventData.npub}:${eventData.processedTimestamp}:${eventData.eventId}`;
      
      // Store event data
      await this.redis!.set(eventKey, JSON.stringify(eventData));

      // Update user's event index for pagination
      const indexKey = `user_events_index:${eventData.npub}`;
      await this.redis!.zAdd(indexKey, { score: eventData.processedTimestamp, value: eventKey });

      logger.info('Event analytics data stored successfully', {
        service: 'KVService',
        method: 'logEvent',
        eventId: eventData.eventId,
        eventKey,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to store event analytics data', error instanceof Error ? error : new Error(errorMessage), {
        service: 'KVService',
        method: 'logEvent',
        eventId: eventData.eventId,
        error: errorMessage,
      });

      throw new AppError(
        'Failed to store event analytics data',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Retrieve paginated event data for a user
   */
  public async getUserEvents(
    npub: string,
    page: number = 1,
    limit: number = 20,
    eventKind?: number,
    startDate?: number,
    endDate?: number
  ): Promise<PaginatedEventResponse> {
    try {
      if (!(await this.ensureConnected())) {
        throw new Error('Redis connection not available');
      }

      logger.info('Retrieving user events', {
        service: 'KVService',
        method: 'getUserEvents',
        npub: npub.substring(0, 12) + '...',
        page,
        limit,
        eventKind,
        startDate,
        endDate,
      });

      const indexKey = `user_events_index:${npub}`;
      
      // Get total count first
      const totalCount = await this.redis!.zCard(indexKey);
      
      if (totalCount === 0) {
        return {
          events: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Calculate pagination
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(totalCount / limit);

      // Get event keys in reverse chronological order (newest first)
      const eventKeys = await this.redis!.zRange(indexKey, offset, offset + limit - 1, {
        REV: true, // Reverse order for newest first
      });

      // Fetch event data
      const events: UserEventData[] = [];
      
      for (const eventKey of eventKeys) {
        try {
          const eventDataStr = await this.redis!.get(eventKey);
          if (eventDataStr) {
            const eventData: UserEventData = JSON.parse(eventDataStr);
            
            // Apply filters if provided
            if (eventKind !== undefined && eventData.eventKind !== eventKind) {
              continue;
            }
            
            if (startDate !== undefined && eventData.processedTimestamp < startDate) {
              continue;
            }
            
            if (endDate !== undefined && eventData.processedTimestamp > endDate) {
              continue;
            }
            
            events.push(eventData);
          }
        } catch (error) {
          logger.warn('Failed to fetch individual event data', {
            service: 'KVService',
            method: 'getUserEvents',
            eventKey,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const result: PaginatedEventResponse = {
        events,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
      };

      logger.info('User events retrieved successfully', {
        service: 'KVService',
        method: 'getUserEvents',
        npub: npub.substring(0, 12) + '...',
        eventCount: events.length,
        totalCount,
        page,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to retrieve user events', error instanceof Error ? error : new Error(errorMessage), {
        service: 'KVService',
        method: 'getUserEvents',
        npub: npub.substring(0, 12) + '...',
        error: errorMessage,
      });

      throw new AppError(
        'Failed to retrieve user events',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get all events from all users (global dashboard)
   */
  public async getAllEvents(
    page: number = 1,
    limit: number = 20,
    eventKind?: number,
    startDate?: number,
    endDate?: number
  ): Promise<PaginatedEventResponse> {
    try {
      if (!(await this.ensureConnected())) {
        throw new Error('Redis connection not available');
      }

      logger.info('Retrieving all events globally', {
        service: 'KVService',
        method: 'getAllEvents',
        page,
        limit,
        eventKind,
        startDate,
        endDate,
      });

      // Get all event keys from all users using a pattern scan
      const allEventKeys: string[] = [];
      
      // Scan for all user_events keys
      let cursor = 0;
      do {
        const scanResult = await this.redis!.scan(cursor.toString(), {
          MATCH: 'user_events:*',
          COUNT: 1000
        });
        
        cursor = typeof scanResult.cursor === 'string' ? parseInt(scanResult.cursor) : scanResult.cursor;
        allEventKeys.push(...scanResult.keys.filter(key => 
          // Only include actual event keys, not index keys
          !key.includes('user_events_index:')
        ));
      } while (cursor !== 0);

      if (allEventKeys.length === 0) {
        return {
          events: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Sort keys by timestamp (newest first) - extract timestamp from key
      const sortedKeys = allEventKeys.sort((a, b) => {
        const timestampA = parseInt(a.split(':')[2] || '0');
        const timestampB = parseInt(b.split(':')[2] || '0');
        return timestampB - timestampA; // Newest first
      });

      // Calculate pagination
      const totalCount = sortedKeys.length;
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(totalCount / limit);
      const paginatedKeys = sortedKeys.slice(offset, offset + limit);

      // Fetch event data
      const events: UserEventData[] = [];
      
      for (const eventKey of paginatedKeys) {
        try {
          const eventDataStr = await this.redis!.get(eventKey);
          if (eventDataStr) {
            const eventData: UserEventData = JSON.parse(eventDataStr);
            
            // Apply filters if provided
            if (eventKind !== undefined && eventData.eventKind !== eventKind) {
              continue;
            }
            
            if (startDate !== undefined && eventData.processedTimestamp < startDate) {
              continue;
            }
            
            if (endDate !== undefined && eventData.processedTimestamp > endDate) {
              continue;
            }
            
            events.push(eventData);
          }
        } catch (error) {
          logger.warn('Failed to fetch individual event data', {
            service: 'KVService',
            method: 'getAllEvents',
            eventKey,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const result: PaginatedEventResponse = {
        events,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
      };

      logger.info('All events retrieved successfully', {
        service: 'KVService',
        method: 'getAllEvents',
        eventCount: events.length,
        totalCount,
        page,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to retrieve all events', error instanceof Error ? error : new Error(errorMessage), {
        service: 'KVService',
        method: 'getAllEvents',
        error: errorMessage,
      });

      throw new AppError(
        'Failed to retrieve all events',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get event statistics for a user
   */
  public async getUserEventStats(npub: string): Promise<{
    totalEvents: number;
    eventKinds: Record<number, number>;
    avgProcessingDuration: number;
    avgResponseTime: number;
    totalSuccessfulRelays: number;
    totalFailedRelays: number;
  }> {
    try {
      if (!(await this.ensureConnected())) {
        throw new Error('Redis connection not available');
      }

      const indexKey = `user_events_index:${npub}`;
      const eventKeys = await this.redis!.zRange(indexKey, 0, -1);
      
      if (eventKeys.length === 0) {
        return {
          totalEvents: 0,
          eventKinds: {},
          avgProcessingDuration: 0,
          avgResponseTime: 0,
          totalSuccessfulRelays: 0,
          totalFailedRelays: 0,
        };
      }

      const stats = {
        totalEvents: eventKeys.length,
        eventKinds: {} as Record<number, number>,
        totalProcessingDuration: 0,
        totalResponseTime: 0,
        totalSuccessfulRelays: 0,
        totalFailedRelays: 0,
      };

      for (const eventKey of eventKeys) {
        try {
          const eventDataStr = await this.redis!.get(eventKey);
          if (eventDataStr) {
            const eventData: UserEventData = JSON.parse(eventDataStr);
            
            // Count event kinds
            stats.eventKinds[eventData.eventKind] = (stats.eventKinds[eventData.eventKind] || 0) + 1;
            
            // Accumulate durations and response times
            stats.totalProcessingDuration += eventData.processingDuration;
            stats.totalResponseTime += eventData.averageResponseTime;
            stats.totalSuccessfulRelays += eventData.successfulRelays.length;
            stats.totalFailedRelays += eventData.failedRelays.length;
          }
        } catch (error) {
          logger.warn('Failed to process event for stats', {
            service: 'KVService',
            method: 'getUserEventStats',
            eventKey,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        totalEvents: stats.totalEvents,
        eventKinds: stats.eventKinds,
        avgProcessingDuration: Math.round(stats.totalProcessingDuration / stats.totalEvents),
        avgResponseTime: Math.round(stats.totalResponseTime / stats.totalEvents),
        totalSuccessfulRelays: stats.totalSuccessfulRelays,
        totalFailedRelays: stats.totalFailedRelays,
      };
    } catch (error) {
      logger.error('Failed to calculate user event stats', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'KVService',
        method: 'getUserEventStats',
        npub: npub.substring(0, 12) + '...',
      });
      
      // Return empty stats on error
      return {
        totalEvents: 0,
        eventKinds: {},
        avgProcessingDuration: 0,
        avgResponseTime: 0,
        totalSuccessfulRelays: 0,
        totalFailedRelays: 0,
      };
    }
  }
}

// Export singleton instance
export const kvService = KVService.getInstance();
