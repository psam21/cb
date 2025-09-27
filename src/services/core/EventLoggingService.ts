/**
 * Event Logging Service
 * Handles logging of Nostr event publishing analytics to the user activity log
 */
import { logger } from './LoggingService';
import { RelayPublishingResult } from '../generic/GenericRelayService';
import { NostrEvent } from '../../types/nostr';

export class EventLoggingService {
  private static instance: EventLoggingService;

  private constructor() {}

  public static getInstance(): EventLoggingService {
    if (!EventLoggingService.instance) {
      EventLoggingService.instance = new EventLoggingService();
    }
    return EventLoggingService.instance;
  }

  /**
   * Log event publishing analytics to the user activity log
   */
  public async logEventPublishing(
    event: NostrEvent,
    publishResult: RelayPublishingResult
  ): Promise<void> {
    try {
      // Only log if we have the required analytics data
      if (!publishResult.npub || !publishResult.processedTimestamp || !publishResult.processingDuration) {
        logger.warn('Skipping event logging - missing analytics data', {
          service: 'EventLoggingService',
          method: 'logEventPublishing',
          eventId: event.id,
          hasNpub: !!publishResult.npub,
          hasProcessedTimestamp: !!publishResult.processedTimestamp,
          hasProcessingDuration: !!publishResult.processingDuration,
        });
        return;
      }

      const eventData = {
        npub: publishResult.npub,
        eventId: event.id,
        eventKind: event.kind,
        createdTimestamp: event.created_at * 1000, // Convert to milliseconds
        processedTimestamp: publishResult.processedTimestamp,
        processingDuration: publishResult.processingDuration,
        totalRelaysAttempted: publishResult.totalRelays,
        successfulRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
        averageResponseTime: publishResult.averageResponseTime || 0,
        tagsCount: event.tags.length,
        retryAttempts: publishResult.retryAttempts || 0,
      };

      logger.info('Logging event publishing analytics', {
        service: 'EventLoggingService',
        method: 'logEventPublishing',
        eventId: event.id,
        eventKind: event.kind,
        npub: publishResult.npub.substring(0, 12) + '...',
        successfulRelays: publishResult.publishedRelays.length,
        failedRelays: publishResult.failedRelays.length,
        processingDuration: publishResult.processingDuration,
      });

      // Send to logging API
      const response = await fetch('/api/log-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to log event');
      }

      logger.info('Event analytics logged successfully', {
        service: 'EventLoggingService',
        method: 'logEventPublishing',
        eventId: event.id,
        loggedEventId: result.eventId,
      });

    } catch (error) {
      // Log the error but don't throw - we don't want logging failures to break the main flow
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to log event analytics', error instanceof Error ? error : new Error(errorMessage), {
        service: 'EventLoggingService',
        method: 'logEventPublishing',
        eventId: event.id,
        error: errorMessage,
      });
    }
  }

  /**
   * Log event publishing analytics in the background (fire-and-forget)
   */
  public logEventPublishingAsync(
    event: NostrEvent,
    publishResult: RelayPublishingResult
  ): void {
    // Use setTimeout to make it truly async and non-blocking
    setTimeout(() => {
      this.logEventPublishing(event, publishResult);
    }, 0);
  }
}

// Export singleton instance
export const eventLoggingService = EventLoggingService.getInstance();
