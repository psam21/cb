'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserEventData } from '@/services/core/KVService';
import { logger } from '@/services/core/LoggingService';
import { EventTable } from '@/components/user-event-log/EventTable';
import { Pagination } from '@/components/user-event-log/Pagination';
// NpubInput removed - now showing ALL events globally

export default function UserEventLogPage() {
  // Note: user and isAuthenticated removed as we now show global events
  // const { user, isAuthenticated } = useAuthStore();
  const [events, setEvents] = useState<UserEventData[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof UserEventData>('processedTimestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchEvents = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching all events globally', {
        service: 'UserEventLogPage',
        method: 'fetchEvents',
        page,
        limit: pagination.limit,
      });

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/get-all-events?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      // Sort events on client side
      const sortedEvents = [...data.events].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        }
        
        if (Array.isArray(aVal) && Array.isArray(bVal)) {
          return sortDirection === 'asc' 
            ? aVal.length - bVal.length 
            : bVal.length - aVal.length;
        }
        
        return 0;
      });

      setEvents(sortedEvents);
      setPagination(data.pagination);

      logger.info('All events fetched successfully', {
        service: 'UserEventLogPage',
        method: 'fetchEvents',
        eventCount: data.events.length,
        totalEvents: data.pagination.total,
        page: data.pagination.page,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      
      logger.error('Failed to fetch all events', error instanceof Error ? error : new Error(errorMessage), {
        service: 'UserEventLogPage',
        method: 'fetchEvents',
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, sortField, sortDirection]);

  // Auto-load events on component mount
  useEffect(() => {
    fetchEvents(1); // Load first page immediately
  }, [fetchEvents]);

  // Remove npub-specific handlers - now global

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchEvents(newPage);
  }, [fetchEvents]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    fetchEvents(1);
  }, [fetchEvents]);

  const handleSort = useCallback((field: keyof UserEventData) => {
    const newDirection = field === sortField && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
    
    // Re-sort current events without refetching
    const sortedEvents = [...events].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return newDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return newDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      if (Array.isArray(aVal) && Array.isArray(bVal)) {
        return newDirection === 'asc' 
          ? aVal.length - bVal.length 
          : bVal.length - aVal.length;
      }
      
      return 0;
    });
    
    setEvents(sortedEvents);
  }, [sortField, sortDirection, events]);

  const handleRefresh = useCallback(() => {
    fetchEvents(pagination.page);
  }, [pagination.page, fetchEvents]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchEvents(pagination.page);
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, pagination.page, fetchEvents]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-800">Global Event Activity</h1>
              <p className="text-gray-600 mt-1">
                Real-time Nostr event publishing analytics from all Culture Bridge users
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
              </label>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="btn-outline-sm flex items-center space-x-2 disabled:opacity-50"
              >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-width py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">Error loading events</p>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-6 p-8 text-center">
            <div className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-primary-600">Loading events...</span>
            </div>
          </div>
        )}

        {/* Events Table */}
        {!loading && (
          <>
            <EventTable
              events={events}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="mt-6">
                <Pagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            )}

            {/* Empty State */}
            {events.length === 0 && !loading && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No Nostr events have been published through Culture Bridge yet. Try creating, editing, or deleting a product to see events appear here.
                </p>
              </div>
            )}
          </>
        )}

        {/* Event Statistics */}
        {events.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Activity Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Events:</span>
                <span className="font-medium ml-1">{pagination.total}</span>
              </div>
              <div>
                <span className="text-gray-500">This Page:</span>
                <span className="font-medium ml-1">{events.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Event Types:</span>
                <span className="font-medium ml-1">{[...new Set(events.map(e => e.eventKind))].length}</span>
              </div>
              <div>
                <span className="text-gray-500">Users:</span>
                <span className="font-medium ml-1">{[...new Set(events.map(e => e.npub))].length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
