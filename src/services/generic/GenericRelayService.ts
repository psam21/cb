/**
 * Generic Nostr relay service for centralized relay operations
 * Handles all relay publishing and querying operations following CultureBridge patterns
 */
import { logger } from '../core/LoggingService';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
import { NostrEvent, NostrSigner } from '../../types/nostr';
import { NOSTR_RELAYS } from '../../config/relays';
import { profileService } from '../business/ProfileBusinessService';
import { eventLoggingService } from '../core/EventLoggingService';

export interface RelayPublishingResult {
  success: boolean;
  eventId: string;
  publishedRelays: string[];
  failedRelays: string[];
  totalRelays: number;
  successRate: number;
  error?: string;
  // Enhanced analytics data
  npub?: string;
  processedTimestamp?: number;
  processingDuration?: number;
  averageResponseTime?: number;
  retryAttempts?: number;
}

export interface RelayQueryResult {
  success: boolean;
  events: NostrEvent[];
  relayCount: number;
  eventRelayMap: Map<string, string[]>; // Maps event ID to array of relay URLs that returned it
  error?: string;
}

export interface RelayPublishingProgress {
  step: 'connecting' | 'publishing' | 'waiting' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  details?: string;
  publishedRelays: string[];
  failedRelays: string[];
  currentRelay?: string;
}

export interface RelayConnection {
  url: string;
  ws: WebSocket | null;
  isConnected: boolean;
  isHealthy: boolean;
  lastError?: string;
  lastPing?: number;
}

/**
 * Generic Nostr relay service for centralized relay operations
 */
export class GenericRelayService {
  private static instance: GenericRelayService;
  private connections: Map<string, RelayConnection> = new Map();
  private readonly connectionTimeout = 10000; // 10 seconds
  private readonly publishTimeout = 15000; // 15 seconds
  private readonly maxRetries = 3;

  private constructor() {
    this.initializeConnections();
  }

  /**
   * Get singleton instance of GenericRelayService
   */
  public static getInstance(): GenericRelayService {
    if (!GenericRelayService.instance) {
      GenericRelayService.instance = new GenericRelayService();
    }
    return GenericRelayService.instance;
  }

  /**
   * Initialize relay connections
   */
  private initializeConnections(): void {
    logger.info('Initializing relay connections', {
      service: 'GenericRelayService',
      method: 'initializeConnections',
      relayCount: NOSTR_RELAYS.length,
    });

    NOSTR_RELAYS.forEach(relay => {
      this.connections.set(relay.url, {
        url: relay.url,
        ws: null,
        isConnected: false,
        isHealthy: false,
      });
    });
  }

  /**
   * Publish an event to all configured relays with progress tracking
   */
  public async publishEvent(
    event: NostrEvent,
    signer: NostrSigner,
    onProgress?: (progress: RelayPublishingProgress) => void
  ): Promise<RelayPublishingResult> {
    try {
      const startTime = Date.now(); // Track overall processing time
      
      logger.info('Starting event publishing to relays', {
        service: 'GenericRelayService',
        method: 'publishEvent',
        eventId: event.id,
        relayCount: NOSTR_RELAYS.length,
      });

      const publishedRelays: string[] = [];
      const failedRelays: string[] = [];
      const totalRelays = NOSTR_RELAYS.length;
      const responseTimes: number[] = []; // Track individual relay response times

      // Initialize progress
      onProgress?.({
        step: 'connecting',
        progress: 0,
        message: 'Connecting to relays...',
        publishedRelays: [],
        failedRelays: [],
      });

      // Publish to all relays in parallel
      const publishPromises = NOSTR_RELAYS.map(async (relay, index) => {
        const relayStartTime = Date.now();
        
        try {
          logger.info(`📡 [${relay.name}] Attempting to publish event`, {
            service: 'GenericRelayService',
            method: 'publishEvent',
            relayUrl: relay.url,
            relayName: relay.name,
            eventId: event.id,
            relayIndex: index + 1,
            totalRelays: NOSTR_RELAYS.length,
          });

          onProgress?.({
            step: 'publishing',
            progress: Math.round((index / totalRelays) * 100),
            message: `Publishing to ${relay.name}...`,
            publishedRelays,
            failedRelays,
            currentRelay: relay.url,
          });

          const result = await this.publishToRelay(event, relay.url, relay.name);
          
          // Track response time if available
          if (result.responseTime !== undefined) {
            responseTimes.push(result.responseTime);
          }
          
          const totalTime = Date.now() - relayStartTime;
          
          if (result.success) {
            publishedRelays.push(relay.url);
            logger.info(`✅ [${relay.name}] Published successfully`, {
              service: 'GenericRelayService',
              method: 'publishEvent',
              relayUrl: relay.url,
              relayName: relay.name,
              eventId: event.id,
              responseTime: `${result.responseTime}ms`,
              totalTime: `${totalTime}ms`,
              relayIndex: index + 1,
            });
          } else {
            failedRelays.push(relay.url);
            logger.warn(`❌ [${relay.name}] Publishing failed`, {
              service: 'GenericRelayService',
              method: 'publishEvent',
              relayUrl: relay.url,
              relayName: relay.name,
              eventId: event.id,
              error: result.error,
              responseTime: result.responseTime ? `${result.responseTime}ms` : 'N/A',
              totalTime: `${totalTime}ms`,
              relayIndex: index + 1,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const totalTime = Date.now() - relayStartTime;
          failedRelays.push(relay.url);
          logger.error(`🔥 [${relay.name}] Exception during publish`, error instanceof Error ? error : new Error(errorMessage), {
            service: 'GenericRelayService',
            method: 'publishEvent',
            relayUrl: relay.url,
            relayName: relay.name,
            eventId: event.id,
            error: errorMessage,
            totalTime: `${totalTime}ms`,
            relayIndex: index + 1,
          });
        }
      });

      // Wait for all publish attempts to complete
      await Promise.allSettled(publishPromises);

      const success = publishedRelays.length > 0;
      const successRate = (publishedRelays.length / totalRelays) * 100;
      
      // Calculate enhanced analytics
      const processedTimestamp = Date.now();
      const processingDuration = processedTimestamp - startTime;
      const averageResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;
      const retryAttempts = 0; // No retry logic currently implemented
      
      // Convert pubkey to npub
      let npub: string | undefined;
      try {
        npub = profileService.pubkeyToNpub(event.pubkey);
      } catch (error) {
        logger.warn('Failed to convert pubkey to npub', {
          service: 'GenericRelayService',
          method: 'publishEvent',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Final progress update
      onProgress?.({
        step: success ? 'complete' : 'error',
        progress: 100,
        message: success 
          ? `Published to ${publishedRelays.length} of ${totalRelays} relays (${successRate.toFixed(1)}%)`
          : 'Failed to publish to any relay',
        details: success 
          ? `Successfully published to: ${publishedRelays.join(', ')}`
          : `Failed relays: ${failedRelays.join(', ')}`,
        publishedRelays,
        failedRelays,
      });

      const result: RelayPublishingResult = {
        success,
        eventId: event.id,
        publishedRelays,
        failedRelays,
        totalRelays,
        successRate,
        error: success ? undefined : 'Failed to publish to any relay',
        // Enhanced analytics data
        npub,
        processedTimestamp,
        processingDuration,
        averageResponseTime,
        retryAttempts,
      };

      // 🚀 UNIVERSAL EVENT LOGGING - Log ALL events automatically
      eventLoggingService.logEventPublishingAsync(event, result);

      if (success) {
        logger.info('Event publishing completed successfully', {
          service: 'GenericRelayService',
          method: 'publishEvent',
          eventId: event.id,
          publishedCount: publishedRelays.length,
          failedCount: failedRelays.length,
          successRate: `${successRate.toFixed(1)}%`,
          processingDuration: `${processingDuration}ms`,
          averageResponseTime: `${averageResponseTime}ms`,
          npub: npub?.substring(0, 12) + '...',
        });
      } else {
        logger.error('Event publishing failed to all relays', new Error(result.error), {
          service: 'GenericRelayService',
          method: 'publishEvent',
          eventId: event.id,
          failedRelays,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error during event publishing workflow', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericRelayService',
        method: 'publishEvent',
        eventId: event.id,
        error: errorMessage,
      });

      onProgress?.({
        step: 'error',
        progress: 0,
        message: `Publishing failed: ${errorMessage}`,
        publishedRelays: [],
        failedRelays: NOSTR_RELAYS.map(r => r.url),
      });

      throw new AppError(
        'Error during event publishing',
        ErrorCode.NOSTR_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.EXTERNAL_SERVICE,
        ErrorSeverity.HIGH,
        { originalError: errorMessage }
      );
    }
  }


  /**
   * Publish an event to a specific relay
   */
  private async publishToRelay(event: NostrEvent, relayUrl: string, relayName?: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const displayName = relayName || relayUrl;
    
    return new Promise((resolve) => {
      try {
        const startTime = Date.now(); // Track response time
        
        logger.debug(`🔌 [${displayName}] Opening WebSocket connection`, {
          service: 'GenericRelayService',
          method: 'publishToRelay',
          relayUrl,
          relayName: displayName,
          eventId: event.id,
        });

        const ws = new WebSocket(relayUrl);
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            ws.close();
            logger.warn(`⏱️ [${displayName}] Publish timeout after ${this.publishTimeout}ms`, {
              service: 'GenericRelayService',
              method: 'publishToRelay',
              relayUrl,
              relayName: displayName,
              eventId: event.id,
              timeout: `${this.publishTimeout}ms`,
            });
            resolve({
              success: false,
              error: 'Publish timeout',
              responseTime: Date.now() - startTime,
            });
          }
        }, this.publishTimeout);

        ws.onopen = () => {
          logger.debug(`✓ [${displayName}] WebSocket connected, sending EVENT`, {
            service: 'GenericRelayService',
            method: 'publishToRelay',
            relayUrl,
            relayName: displayName,
            eventId: event.id,
            connectionTime: `${Date.now() - startTime}ms`,
          });

          // Send EVENT message to publish
          const message = ['EVENT', event];
          ws.send(JSON.stringify(message));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            
            logger.debug(`📨 [${displayName}] Received message: ${JSON.stringify(data).substring(0, 100)}`, {
              service: 'GenericRelayService',
              method: 'publishToRelay',
              relayUrl,
              relayName: displayName,
              eventId: event.id,
              messageType: data[0],
            });
            
            if (data[0] === 'OK' && data[1] === event.id) {
              clearTimeout(timeout);
              ws.close();
              
              if (!resolved) {
                resolved = true;
                const responseTime = Date.now() - startTime;
                
                if (data[2] === true) {
                  logger.debug(`👍 [${displayName}] Event accepted`, {
                    service: 'GenericRelayService',
                    method: 'publishToRelay',
                    relayUrl,
                    relayName: displayName,
                    eventId: event.id,
                    responseTime: `${responseTime}ms`,
                  });
                  resolve({ success: true, responseTime });
                } else {
                  logger.warn(`👎 [${displayName}] Event rejected: ${data[3]}`, {
                    service: 'GenericRelayService',
                    method: 'publishToRelay',
                    relayUrl,
                    relayName: displayName,
                    eventId: event.id,
                    rejectionReason: data[3],
                    responseTime: `${responseTime}ms`,
                  });
                  resolve({
                    success: false,
                    error: data[3] || 'Event rejected by relay',
                    responseTime,
                  });
                }
              }
            }
          } catch (parseError) {
            logger.warn(`⚠️ [${displayName}] Failed to parse relay response`, {
              service: 'GenericRelayService',
              method: 'publishToRelay',
              relayUrl,
              relayName: displayName,
              error: parseError instanceof Error ? parseError.message : 'Unknown error',
              rawMessage: msg.data.substring(0, 100),
            });
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          ws.close();
          
          if (!resolved) {
            resolved = true;
            logger.error(`⚡ [${displayName}] WebSocket error`, new Error('WebSocket connection error'), {
              service: 'GenericRelayService',
              method: 'publishToRelay',
              relayUrl,
              relayName: displayName,
              eventId: event.id,
              errorType: 'WebSocket error event',
              responseTime: `${Date.now() - startTime}ms`,
            });
            resolve({
              success: false,
              error: 'WebSocket connection error',
              responseTime: Date.now() - startTime,
            });
          }
        };

        ws.onclose = (closeEvent) => {
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            logger.warn(`🔌 [${displayName}] WebSocket closed unexpectedly`, {
              service: 'GenericRelayService',
              method: 'publishToRelay',
              relayUrl,
              relayName: displayName,
              eventId: event.id,
              closeCode: closeEvent.code,
              closeReason: closeEvent.reason || 'No reason provided',
              wasClean: closeEvent.wasClean,
              responseTime: `${Date.now() - startTime}ms`,
            });
            resolve({
              success: false,
              error: `WebSocket closed (code: ${closeEvent.code})`,
              responseTime: Date.now() - startTime,
            });
          }
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`💥 [${displayName}] Exception creating WebSocket`, error instanceof Error ? error : new Error(errorMessage), {
          service: 'GenericRelayService',
          method: 'publishToRelay',
          relayUrl,
          relayName: displayName,
          eventId: event.id,
          error: errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        
        resolve({
          success: false,
          error: errorMessage,
          responseTime: 0, // No meaningful response time for connection errors
        });
      }
    });
  }

  /**
   * Query events from relays
   */
  public async queryEvents(
    filters: Record<string, unknown>[],
    onProgress?: (progress: { step: string; progress: number; message: string }) => void
  ): Promise<RelayQueryResult> {
    try {
      logger.info('Starting event query from relays', {
        service: 'GenericRelayService',
        method: 'queryEvents',
        filterCount: filters.length,
        relayCount: NOSTR_RELAYS.length,
      });

      onProgress?.({
        step: 'querying',
        progress: 0,
        message: 'Querying events from relays...',
      });

      const allEvents: NostrEvent[] = [];
      const eventRelayMap = new Map<string, string[]>();
      let completedRelays = 0;

      // Query all relays in parallel
      const queryPromises = NOSTR_RELAYS.map(async (relay, index) => {
        const relayStartTime = Date.now();
        
        try {
          logger.info(`🔍 [${relay.name}] Starting event query`, {
            service: 'GenericRelayService',
            method: 'queryEvents',
            relayUrl: relay.url,
            relayName: relay.name,
            relayIndex: index + 1,
            totalRelays: NOSTR_RELAYS.length,
            filters: JSON.stringify(filters).substring(0, 100),
          });

          onProgress?.({
            step: 'querying',
            progress: Math.round((index / NOSTR_RELAYS.length) * 100),
            message: `Querying ${relay.name}...`,
          });

          const events = await this.queryRelay(relay.url, filters, relay.name);
          
          const queryTime = Date.now() - relayStartTime;
          
          // Track which relay returned each event
          events.forEach(event => {
            if (!eventRelayMap.has(event.id)) {
              eventRelayMap.set(event.id, []);
              allEvents.push(event);
            }
            eventRelayMap.get(event.id)!.push(relay.url);
          });

          completedRelays++;
          logger.info(`✅ [${relay.name}] Query completed`, {
            service: 'GenericRelayService',
            method: 'queryEvents',
            relayUrl: relay.url,
            relayName: relay.name,
            eventCount: events.length,
            totalEvents: allEvents.length,
            queryTime: `${queryTime}ms`,
            relayIndex: index + 1,
          });
        } catch (error) {
          const queryTime = Date.now() - relayStartTime;
          logger.warn(`❌ [${relay.name}] Query failed`, {
            service: 'GenericRelayService',
            method: 'queryEvents',
            relayUrl: relay.url,
            relayName: relay.name,
            error: error instanceof Error ? error.message : 'Unknown error',
            queryTime: `${queryTime}ms`,
            relayIndex: index + 1,
          });
        }
      });

      await Promise.allSettled(queryPromises);

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: `Found ${allEvents.length} events from ${completedRelays} relays`,
      });

      logger.info('Event query completed', {
        service: 'GenericRelayService',
        method: 'queryEvents',
        totalEvents: allEvents.length,
        completedRelays,
        totalRelays: NOSTR_RELAYS.length,
      });

      return {
        success: true,
        events: allEvents,
        relayCount: completedRelays,
        eventRelayMap,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error during event query', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericRelayService',
        method: 'queryEvents',
        error: errorMessage,
      });

      return {
        success: false,
        events: [],
        relayCount: 0,
        eventRelayMap: new Map(),
        error: errorMessage,
      };
    }
  }

  /**
   * Query events from a specific relay
   */
  private async queryRelay(relayUrl: string, filters: Record<string, unknown>[], relayName?: string): Promise<NostrEvent[]> {
    const displayName = relayName || relayUrl;
    
    return new Promise((resolve) => {
      try {
        const startTime = Date.now();
        
        logger.debug(`🔌 [${displayName}] Opening WebSocket for query`, {
          service: 'GenericRelayService',
          method: 'queryRelay',
          relayUrl,
          relayName: displayName,
          filters: JSON.stringify(filters).substring(0, 100),
        });

        const ws = new WebSocket(relayUrl);
        const events: NostrEvent[] = [];
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            ws.close();
            logger.warn(`⏱️ [${displayName}] Query timeout after ${this.connectionTimeout}ms`, {
              service: 'GenericRelayService',
              method: 'queryRelay',
              relayUrl,
              relayName: displayName,
              timeout: `${this.connectionTimeout}ms`,
              eventsReceived: events.length,
            });
            resolve(events);
          }
        }, this.connectionTimeout);

        ws.onopen = () => {
          logger.debug(`✓ [${displayName}] WebSocket connected, sending REQ`, {
            service: 'GenericRelayService',
            method: 'queryRelay',
            relayUrl,
            relayName: displayName,
            connectionTime: `${Date.now() - startTime}ms`,
          });

          // Send REQ message to query events
          const message = ['REQ', 'query', ...filters];
          ws.send(JSON.stringify(message));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            
            if (data[0] === 'EVENT') {
              events.push(data[2] as NostrEvent);
              logger.debug(`📨 [${displayName}] Received EVENT (total: ${events.length})`, {
                service: 'GenericRelayService',
                method: 'queryRelay',
                relayUrl,
                relayName: displayName,
                eventId: (data[2] as NostrEvent).id,
                totalEvents: events.length,
              });
            } else if (data[0] === 'EOSE') {
              clearTimeout(timeout);
              ws.close();
              
              if (!resolved) {
                resolved = true;
                logger.debug(`🏁 [${displayName}] End of stored events (EOSE)`, {
                  service: 'GenericRelayService',
                  method: 'queryRelay',
                  relayUrl,
                  relayName: displayName,
                  totalEvents: events.length,
                  queryTime: `${Date.now() - startTime}ms`,
                });
                resolve(events);
              }
            }
          } catch (parseError) {
            logger.warn(`⚠️ [${displayName}] Failed to parse query response`, {
              service: 'GenericRelayService',
              method: 'queryRelay',
              relayUrl,
              relayName: displayName,
              error: parseError instanceof Error ? parseError.message : 'Unknown error',
              rawMessage: msg.data.substring(0, 100),
            });
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          ws.close();
          
          if (!resolved) {
            resolved = true;
            logger.error(`⚡ [${displayName}] WebSocket error during query`, new Error('WebSocket connection error'), {
              service: 'GenericRelayService',
              method: 'queryRelay',
              relayUrl,
              relayName: displayName,
              errorType: 'WebSocket error event',
              eventsReceived: events.length,
              queryTime: `${Date.now() - startTime}ms`,
            });
            resolve(events);
          }
        };

        ws.onclose = (closeEvent) => {
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            logger.warn(`🔌 [${displayName}] WebSocket closed during query`, {
              service: 'GenericRelayService',
              method: 'queryRelay',
              relayUrl,
              relayName: displayName,
              closeCode: closeEvent.code,
              closeReason: closeEvent.reason || 'No reason provided',
              wasClean: closeEvent.wasClean,
              eventsReceived: events.length,
              queryTime: `${Date.now() - startTime}ms`,
            });
            resolve(events);
          }
        };
      } catch (error) {
        logger.error(`💥 [${displayName}] Exception creating WebSocket for query`, error instanceof Error ? error : new Error('Unknown error'), {
          service: 'GenericRelayService',
          method: 'queryRelay',
          relayUrl,
          relayName: displayName,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        
        resolve([]);
      }
    });
  }

  /**
   * Get relay health status
   */
  public async getRelayHealth(relayUrl: string): Promise<{ healthy: boolean; error?: string }> {
    try {
      const ws = new WebSocket(relayUrl);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ healthy: false, error: 'Connection timeout' });
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({ healthy: true });
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({ healthy: false, error: 'Connection failed' });
        };
      });
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all relay health statuses
   */
  public async getAllRelayHealth(): Promise<Record<string, { healthy: boolean; error?: string }>> {
    const healthChecks = await Promise.allSettled(
      NOSTR_RELAYS.map(async (relay) => {
        const health = await this.getRelayHealth(relay.url);
        return { url: relay.url, health };
      })
    );

    const results: Record<string, { healthy: boolean; error?: string }> = {};
    
    healthChecks.forEach((result, index) => {
      const relay = NOSTR_RELAYS[index];
      if (result.status === 'fulfilled') {
        results[relay.url] = result.value.health;
      } else {
        results[relay.url] = {
          healthy: false,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        };
      }
    });

    return results;
  }

  /**
   * Close all relay connections
   */
  public closeAllConnections(): void {
    logger.info('Closing all relay connections', {
      service: 'GenericRelayService',
      method: 'closeAllConnections',
      connectionCount: this.connections.size,
    });

    this.connections.forEach((connection) => {
      if (connection.ws) {
        connection.ws.close();
        connection.ws = null;
        connection.isConnected = false;
      }
    });
  }

  /**
   * Subscribe to events from relays with real-time updates
   * 
   * @param filters - Nostr filters
   * @param onEvent - Callback for each event (deduplicated across relays)
   * @param relayUrls - Optional specific relay URLs (defaults to all configured relays)
   * @returns Unsubscribe function to close the subscription
   */
  public subscribeToEvents(
    filters: Record<string, unknown>[],
    onEvent: (event: NostrEvent) => void,
    relayUrls?: string[]
  ): () => void {
    const relays = relayUrls || NOSTR_RELAYS.map(r => r.url);
    const subscriptionId = Math.random().toString(36).substring(7);
    const websockets: WebSocket[] = [];
    const seenEventIds = new Set<string>(); // Track events we've already delivered

    logger.info('Starting event subscription', {
      service: 'GenericRelayService',
      method: 'subscribeToEvents',
      subscriptionId,
      filters,
      relayCount: relays.length,
    });

    relays.forEach((relayUrl) => {
      try {
        const ws = new WebSocket(relayUrl);

        ws.onopen = () => {
          logger.debug('WebSocket opened for subscription', {
            service: 'GenericRelayService',
            subscriptionId,
            relayUrl,
          });

          // Send REQ message
          const reqMessage = ['REQ', subscriptionId, ...filters];
          ws.send(JSON.stringify(reqMessage));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            
            // Handle EVENT messages
            if (Array.isArray(data) && data[0] === 'EVENT' && data[1] === subscriptionId) {
              const event = data[2] as NostrEvent;
              
              // Only deliver each event once (deduplicate across relays)
              if (!seenEventIds.has(event.id)) {
                seenEventIds.add(event.id);
                onEvent(event);
                
                logger.debug('New event received from subscription', {
                  service: 'GenericRelayService',
                  subscriptionId,
                  relayUrl,
                  eventId: event.id,
                  totalSeenEvents: seenEventIds.size,
                });
              } else {
                logger.debug('Duplicate event ignored (already seen from another relay)', {
                  service: 'GenericRelayService',
                  subscriptionId,
                  relayUrl,
                  eventId: event.id,
                });
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error parsing WebSocket message', error instanceof Error ? error : new Error(errorMessage), {
              service: 'GenericRelayService',
              subscriptionId,
              relayUrl,
            });
          }
        };        ws.onerror = () => {
          logger.error('WebSocket error in subscription', new Error('WebSocket error'), {
            service: 'GenericRelayService',
            subscriptionId,
            relayUrl,
          });
        };

        ws.onclose = () => {
          logger.debug('WebSocket closed for subscription', {
            service: 'GenericRelayService',
            subscriptionId,
            relayUrl,
          });
        };

        websockets.push(ws);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to create WebSocket subscription', error instanceof Error ? error : new Error(errorMessage), {
          service: 'GenericRelayService',
          subscriptionId,
          relayUrl,
        });
      }
    });

    // Return unsubscribe function
    return () => {
      logger.info('Unsubscribing from events', {
        service: 'GenericRelayService',
        subscriptionId,
      });

      websockets.forEach((ws) => {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            // Send CLOSE message
            ws.send(JSON.stringify(['CLOSE', subscriptionId]));
          }
          ws.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Error closing WebSocket subscription', error instanceof Error ? error : new Error(errorMessage), {
            service: 'GenericRelayService',
            subscriptionId,
          });
        }
      });
    };
  }
}

// Export singleton instance
export const genericRelayService = GenericRelayService.getInstance();

// Export convenience functions
export const publishEvent = (event: NostrEvent, signer: NostrSigner, onProgress?: (progress: RelayPublishingProgress) => void) =>
  genericRelayService.publishEvent(event, signer, onProgress);

export const queryEvents = (filters: Record<string, unknown>[], onProgress?: (progress: { step: string; progress: number; message: string }) => void) =>
  genericRelayService.queryEvents(filters, onProgress);

export const subscribeToEvents = (filters: Record<string, unknown>[], onEvent: (event: NostrEvent) => void, relayUrls?: string[]) =>
  genericRelayService.subscribeToEvents(filters, onEvent, relayUrls);

export const getRelayHealth = (relayUrl: string) => genericRelayService.getRelayHealth(relayUrl);
export const getAllRelayHealth = () => genericRelayService.getAllRelayHealth();
export const closeAllConnections = () => genericRelayService.closeAllConnections();
