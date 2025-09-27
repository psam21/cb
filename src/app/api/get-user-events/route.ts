/**
 * GET /api/get-user-events
 * Retrieve paginated event data for display
 */
import { NextRequest, NextResponse } from 'next/server';
import { kvService } from '@/services/core/KVService';
import { logger } from '@/services/core/LoggingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const npub = searchParams.get('npub');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const eventKind = searchParams.get('eventKind') ? parseInt(searchParams.get('eventKind')!) : undefined;
    const startDate = searchParams.get('startDate') ? parseInt(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? parseInt(searchParams.get('endDate')!) : undefined;

    logger.info('Received get user events request', {
      service: 'get-user-events-api',
      method: 'GET',
      npub: npub?.substring(0, 12) + '...',
      page,
      limit,
      eventKind,
      startDate,
      endDate,
    });

    // Validate required npub parameter
    if (!npub) {
      logger.warn('Missing npub parameter', {
        service: 'get-user-events-api',
        method: 'GET',
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: npub' 
        },
        { status: 400 }
      );
    }

    // Validate npub format
    if (!npub.startsWith('npub1') || npub.length !== 63) {
      logger.warn('Invalid npub format', {
        service: 'get-user-events-api',
        method: 'GET',
        npub: npub.substring(0, 12) + '...',
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid npub format' 
        },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Page must be >= 1' 
        },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Limit must be between 1 and 100' 
        },
        { status: 400 }
      );
    }

    // Validate date parameters
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Start date must be before end date' 
        },
        { status: 400 }
      );
    }

    // Retrieve events from KV store
    const result = await kvService.getUserEvents(
      npub,
      page,
      limit,
      eventKind,
      startDate,
      endDate
    );

    logger.info('User events retrieved successfully', {
      service: 'get-user-events-api',
      method: 'GET',
      npub: npub.substring(0, 12) + '...',
      eventCount: result.events.length,
      totalEvents: result.pagination.total,
      page: result.pagination.page,
      totalPages: result.pagination.totalPages,
    });

    return NextResponse.json({
      success: true,
      events: result.events,
      pagination: result.pagination,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to retrieve user events', error instanceof Error ? error : new Error(errorMessage), {
      service: 'get-user-events-api',
      method: 'GET',
      error: errorMessage,
    });

    // Check if it's a KV service error (already logged)
    if (error instanceof Error && error.message.includes('Failed to retrieve user events')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query failed' 
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
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to retrieve events.' },
    { status: 405 }
  );
}
