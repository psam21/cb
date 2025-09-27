/**
 * Vercel KV service for user event logging
 * Handles storage and retrieval of Nostr event publishing analytics
 */
import { kv } from '@vercel/kv';
import { logger } from './LoggingService';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus } from '../../errors/ErrorTypes';

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

  private constructor() {}

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
      await kv.set(eventKey, eventData);

      // Update user's event index for pagination
      const indexKey = `user_events_index:${eventData.npub}`;
      await kv.zadd(indexKey, { score: eventData.processedTimestamp, member: eventKey });

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
        { eventId: eventData.eventId, error: errorMessage }
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
      const totalCount = await kv.zcard(indexKey);
      
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
      const eventKeys = await kv.zrange(indexKey, offset, offset + limit - 1, {
        rev: true, // Reverse order for newest first
      });

      // Fetch event data
      const events: UserEventData[] = [];
      
      for (const eventKey of eventKeys) {
        try {
          const eventData = await kv.get<UserEventData>(eventKey as string);
          if (eventData) {
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
        { npub, error: errorMessage }
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
      const indexKey = `user_events_index:${npub}`;
      const eventKeys = await kv.zrange(indexKey, 0, -1);
      
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
          const eventData = await kv.get<UserEventData>(eventKey as string);
          if (eventData) {
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
