/**
 * POST /api/log-event
 * Store event analytics data after publishing attempt
 */
import { NextRequest, NextResponse } from 'next/server';
import { kvService, UserEventData } from '@/services/core/KVService';
import { logger } from '@/services/core/LoggingService';

export async function POST(request: NextRequest) {
  try {
    logger.info('Received event logging request', {
      service: 'log-event-api',
      method: 'POST',
    });

    // Parse request body
    const eventData: UserEventData = await request.json();

    // Basic validation
    if (!eventData.npub || !eventData.eventId || !eventData.eventKind) {
      logger.warn('Invalid event data received', {
        service: 'log-event-api',
        method: 'POST',
        hasNpub: !!eventData.npub,
        hasEventId: !!eventData.eventId,
        hasEventKind: !!eventData.eventKind,
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: npub, eventId, eventKind' 
        },
        { status: 400 }
      );
    }

    // Validate npub format
    if (!eventData.npub.startsWith('npub1') || eventData.npub.length !== 63) {
      logger.warn('Invalid npub format', {
        service: 'log-event-api',
        method: 'POST',
        npub: eventData.npub.substring(0, 12) + '...',
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid npub format' 
        },
        { status: 400 }
      );
    }

    // Validate event ID format (64-character hex)
    if (!/^[a-f0-9]{64}$/.test(eventData.eventId)) {
      logger.warn('Invalid event ID format', {
        service: 'log-event-api',
        method: 'POST',
        eventId: eventData.eventId,
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid event ID format' 
        },
        { status: 400 }
      );
    }

    // Validate timestamps
    if (!eventData.createdTimestamp || !eventData.processedTimestamp) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required timestamps' 
        },
        { status: 400 }
      );
    }

    // Validate arrays
    if (!Array.isArray(eventData.successfulRelays) || !Array.isArray(eventData.failedRelays)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Relay arrays must be valid arrays' 
        },
        { status: 400 }
      );
    }

    // Store the event data
    await kvService.logEvent(eventData);

    logger.info('Event analytics stored successfully', {
      service: 'log-event-api',
      method: 'POST',
      eventId: eventData.eventId,
      npub: eventData.npub.substring(0, 12) + '...',
      eventKind: eventData.eventKind,
      successfulRelays: eventData.successfulRelays.length,
      failedRelays: eventData.failedRelays.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Event analytics stored successfully',
      eventId: eventData.eventId,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to store event analytics', error instanceof Error ? error : new Error(errorMessage), {
      service: 'log-event-api',
      method: 'POST',
      error: errorMessage,
    });

    // Check if it's a KV service error (already logged)
    if (error instanceof Error && error.message.includes('Failed to store event analytics data')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database storage failed' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to log events.' },
    { status: 405 }
  );
}
