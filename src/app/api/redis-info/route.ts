/**
 * Redis Information API Endpoint
 * Provides exhaustive statistics about the Redis instance
 * 
 * GET /api/redis-info
 * 
 * Returns comprehensive Redis metrics including:
 * - Server information
 * - Memory usage and statistics
 * - Database statistics
 * - Key space analysis
 * - Performance metrics
 * - Persistence information
 * - Replication status
 * - Client connections
 * 
 * SOA Architecture:
 * API Route → RedisAnalyticsService (Business) → KVService (Core) → Redis
 */

import { NextResponse } from 'next/server';
import { redisAnalyticsService } from '@/services/business/RedisAnalyticsService';

export async function GET() {
  try {
    const redisInfo = await redisAnalyticsService.getRedisInfo();

    return NextResponse.json(redisInfo, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Redis info error:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve Redis information',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

