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
        try {
          onProgress?.({
            step: 'publishing',
            progress: Math.round((index / totalRelays) * 100),
            message: `Publishing to ${relay.name}...`,
            publishedRelays,
            failedRelays,
            currentRelay: relay.url,
          });

          const result = await this.publishToRelay(event, relay.url);
          
          // Track response time if available
          if (result.responseTime !== undefined) {
            responseTimes.push(result.responseTime);
          }
          
          if (result.success) {
            publishedRelays.push(relay.url);
            logger.info('Event published successfully to relay', {
              service: 'GenericRelayService',
              method: 'publishEvent',
              relayUrl: relay.url,
              relayName: relay.name,
              eventId: event.id,
              responseTime: result.responseTime,
            });
          } else {
            failedRelays.push(relay.url);
            logger.warn('Event publishing failed to relay', {
              service: 'GenericRelayService',
              method: 'publishEvent',
              relayUrl: relay.url,
              relayName: relay.name,
              eventId: event.id,
              error: result.error,
              responseTime: result.responseTime,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedRelays.push(relay.url);
          logger.error('Error publishing to relay', error instanceof Error ? error : new Error(errorMessage), {
            service: 'GenericRelayService',
            method: 'publishEvent',
            relayUrl: relay.url,
            relayName: relay.name,
            eventId: event.id,
            error: errorMessage,
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
  private async publishToRelay(event: NostrEvent, relayUrl: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    return new Promise((resolve) => {
      try {
        const startTime = Date.now(); // Track response time
        
        logger.debug('Publishing event to relay', {
          service: 'GenericRelayService',
          method: 'publishToRelay',
          relayUrl,
          eventId: event.id,
        });

        const ws = new WebSocket(relayUrl);
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            ws.close();
            resolve({
              success: false,
              error: 'Publish timeout',
              responseTime: Date.now() - startTime,
            });
          }
        }, this.publishTimeout);

        ws.onopen = () => {
          logger.debug('WebSocket connected to relay', {
            service: 'GenericRelayService',
            method: 'publishToRelay',
            relayUrl,
          });

          // Send EVENT message to publish
          const message = ['EVENT', event];
          ws.send(JSON.stringify(message));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            
            if (data[0] === 'OK' && data[1] === event.id) {
              clearTimeout(timeout);
              ws.close();
              
              if (!resolved) {
                resolved = true;
                const responseTime = Date.now() - startTime;
                
                if (data[2] === true) {
                  resolve({ success: true, responseTime });
                } else {
                  resolve({
                    success: false,
                    error: data[3] || 'Event rejected by relay',
                    responseTime,
                  });
                }
              }
            }
          } catch (parseError) {
            logger.warn('Failed to parse relay response', {
              service: 'GenericRelayService',
              method: 'publishToRelay',
              relayUrl,
              error: parseError instanceof Error ? parseError.message : 'Unknown error',
            });
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          ws.close();
          
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: 'WebSocket connection error',
              responseTime: Date.now() - startTime,
            });
          }
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: 'WebSocket connection closed',
              responseTime: Date.now() - startTime,
            });
          }
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error creating WebSocket connection', error instanceof Error ? error : new Error(errorMessage), {
          service: 'GenericRelayService',
          method: 'publishToRelay',
          relayUrl,
          error: errorMessage,
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
        try {
          onProgress?.({
            step: 'querying',
            progress: Math.round((index / NOSTR_RELAYS.length) * 100),
            message: `Querying ${relay.name}...`,
          });

          const events = await this.queryRelay(relay.url, filters);
          
          // Track which relay returned each event
          events.forEach(event => {
            if (!eventRelayMap.has(event.id)) {
              eventRelayMap.set(event.id, []);
              allEvents.push(event);
            }
            eventRelayMap.get(event.id)!.push(relay.url);
          });

          completedRelays++;
          logger.debug('Query completed for relay', {
            service: 'GenericRelayService',
            method: 'queryEvents',
            relayUrl: relay.url,
            relayName: relay.name,
            eventCount: events.length,
            totalEvents: allEvents.length,
          });
        } catch (error) {
          logger.warn('Query failed for relay', {
            service: 'GenericRelayService',
            method: 'queryEvents',
            relayUrl: relay.url,
            relayName: relay.name,
            error: error instanceof Error ? error.message : 'Unknown error',
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
  private async queryRelay(relayUrl: string, filters: Record<string, unknown>[]): Promise<NostrEvent[]> {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(relayUrl);
        const events: NostrEvent[] = [];
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            ws.close();
            resolve(events);
          }
        }, this.connectionTimeout);

        ws.onopen = () => {
          // Send REQ message to query events
          const message = ['REQ', 'query', ...filters];
          ws.send(JSON.stringify(message));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            
            if (data[0] === 'EVENT') {
              events.push(data[2] as NostrEvent);
            } else if (data[0] === 'EOSE') {
              clearTimeout(timeout);
              ws.close();
              
              if (!resolved) {
                resolved = true;
                resolve(events);
              }
            }
          } catch (parseError) {
            logger.warn('Failed to parse relay query response', {
              service: 'GenericRelayService',
              method: 'queryRelay',
              relayUrl,
              error: parseError instanceof Error ? parseError.message : 'Unknown error',
            });
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          ws.close();
          
          if (!resolved) {
            resolved = true;
            resolve(events);
          }
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            resolve(events);
          }
        };
      } catch (error) {
        logger.error('Error creating query WebSocket connection', error instanceof Error ? error : new Error('Unknown error'), {
          service: 'GenericRelayService',
          method: 'queryRelay',
          relayUrl,
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
}

// Export singleton instance
export const genericRelayService = GenericRelayService.getInstance();

// Export convenience functions
export const publishEvent = (event: NostrEvent, signer: NostrSigner, onProgress?: (progress: RelayPublishingProgress) => void) =>
  genericRelayService.publishEvent(event, signer, onProgress);

export const queryEvents = (filters: Record<string, unknown>[], onProgress?: (progress: { step: string; progress: number; message: string }) => void) =>
  genericRelayService.queryEvents(filters, onProgress);

export const getRelayHealth = (relayUrl: string) => genericRelayService.getRelayHealth(relayUrl);
export const getAllRelayHealth = () => genericRelayService.getAllRelayHealth();
export const closeAllConnections = () => genericRelayService.closeAllConnections();
