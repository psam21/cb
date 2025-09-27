'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserEventData } from '@/services/core/KVService';
import { logger } from '@/services/core/LoggingService';
import { EventTable } from '@/components/user-event-log/EventTable';
import { Pagination } from '@/components/user-event-log/Pagination';
import { NpubInput } from '@/components/user-event-log/NpubInput';

export default function UserEventLogPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [events, setEvents] = useState<UserEventData[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNpub, setCurrentNpub] = useState<string>('');
  const [sortField, setSortField] = useState<keyof UserEventData>('processedTimestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Initialize with user's npub if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.npub && !currentNpub) {
      setCurrentNpub(user.npub);
    }
  }, [isAuthenticated, user, currentNpub]);

  const fetchEvents = useCallback(async (npub: string, page: number = 1) => {
    if (!npub) return;

    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching user events', {
        service: 'UserEventLogPage',
        method: 'fetchEvents',
        npub: npub.substring(0, 12) + '...',
        page,
        limit: pagination.limit,
      });

      const params = new URLSearchParams({
        npub,
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/get-user-events?${params}`);
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

      logger.info('User events fetched successfully', {
        service: 'UserEventLogPage',
        method: 'fetchEvents',
        eventCount: data.events.length,
        totalEvents: data.pagination.total,
        page: data.pagination.page,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      
      logger.error('Failed to fetch user events', error instanceof Error ? error : new Error(errorMessage), {
        service: 'UserEventLogPage',
        method: 'fetchEvents',
        npub: npub.substring(0, 12) + '...',
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, sortField, sortDirection]);

  const handleNpubSubmit = useCallback((npub: string) => {
    setCurrentNpub(npub);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    fetchEvents(npub, 1);
  }, [fetchEvents]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchEvents(currentNpub, newPage);
  }, [currentNpub, fetchEvents]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    fetchEvents(currentNpub, 1);
  }, [currentNpub, fetchEvents]);

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
    if (currentNpub) {
      fetchEvents(currentNpub, pagination.page);
    }
  }, [currentNpub, pagination.page, fetchEvents]);

  // Auto-fetch if user is authenticated and npub is set
  useEffect(() => {
    if (currentNpub && pagination.page === 1) {
      fetchEvents(currentNpub, 1);
    }
  }, [currentNpub]); // Only run when npub changes, not on every pagination change

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-800">User Activity Log</h1>
              <p className="text-gray-600 mt-1">
                View Nostr event publishing analytics and relay performance metrics
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading || !currentNpub}
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

      <div className="container-width py-8">
        {/* Npub Input */}
        <div className="mb-6">
          <NpubInput
            value={currentNpub}
            onSubmit={handleNpubSubmit}
            loading={loading}
            isAuthenticated={isAuthenticated}
            userNpub={user?.npub}
          />
        </div>

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
        {!loading && currentNpub && (
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This user hasn&apos;t published any events through Culture Bridge yet.
                </p>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        {!currentNpub && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Enter an npub to get started</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter a Nostr public key (npub) above to view event publishing analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
