'use client';

import { UserEventData } from '@/services/core/KVService';

interface EventTableProps {
  events: UserEventData[];
  sortField: keyof UserEventData;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof UserEventData) => void;
}

export function EventTable({ events, sortField, sortDirection, onSort }: EventTableProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Extract relay name from URL
  const getRelayName = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      // Remove 'wss://' and common prefixes
      return hostname
        .replace('relay.', '')
        .replace('www.', '')
        .split('.')[0]
        || hostname;
    } catch {
      return url;
    }
  };

  // Get failed relays as comma-separated names
  const getFailedRelaysDisplay = (failedRelays: string[]): string => {
    if (failedRelays.length === 0) return '-';
    return failedRelays.map(getRelayName).join(', ');
  };

  // Note: We don't have per-relay response times in current data structure
  // These would need to be added to the event logging in GenericRelayService
  // For now, we show what's available

  const getProcessingSpeedBadge = (duration: number) => {
    if (duration < 1000) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">⚡ Fast</span>;
    } else if (duration < 5000) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">⏱️ Normal</span>;
    } else {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">🐌 Slow</span>;
    }
  };

  const getEventKindName = (kind: number) => {
    const kindNames: Record<number, string> = {
      0: 'Profile',
      1: 'Text Note',
      3: 'Contacts',
      5: 'Deletion',
      23: 'Long-form (Legacy)',
      30023: 'Long-form (NIP-33)',
      10063: 'File Server List',
      24242: 'Blossom Auth',
    };
    return kindNames[kind] || `Kind ${kind}`;
  };

  const SortButton = ({ field, children }: { field: keyof UserEventData; children: React.ReactNode }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-primary-600 group"
    >
      <span>{children}</span>
      <div className="flex flex-col">
        <svg 
          className={`w-3 h-3 ${sortField === field && sortDirection === 'asc' ? 'text-primary-600' : 'text-gray-400'} group-hover:text-primary-600`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <svg 
          className={`w-3 h-3 -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-primary-600' : 'text-gray-400'} group-hover:text-primary-600`} 
          fill="currentColor" 
          viewBox="0 0 20 20" 
          transform="rotate(180)"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </button>
  );

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="eventKind">Event Kind</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="processedTimestamp">Processed</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="failedRelays">Failed Relay(s)</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="averageResponseTime">Avg Response</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="totalRelaysAttempted">Relays</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="tagsCount">Tags</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Link
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={`${event.eventId}-${event.processedTimestamp}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getEventKindName(event.eventKind)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatTimestamp(event.processedTimestamp)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs">
                    {event.failedRelays.length > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        ❌ {getFailedRelaysDisplay(event.failedRelays)}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {formatDuration(event.averageResponseTime)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      ✅ {event.successfulRelays.length}
                    </span>
                    {event.failedRelays.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        ❌ {event.failedRelays.length}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      /{event.totalRelaysAttempted}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {event.tagsCount}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`https://njump.me/${event.eventId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    🔗 njump
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {events.map((event) => (
          <div key={`${event.eventId}-${event.processedTimestamp}`} className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getEventKindName(event.eventKind)}
              </span>
              <a
                href={`https://njump.me/${event.eventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
              >
                🔗 njump
              </a>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
              <div>
                <span className="text-gray-500">Processed:</span>
                <div className="font-medium">{formatTimestamp(event.processedTimestamp)}</div>
              </div>
              
              <div>
                <span className="text-gray-500">Avg Response:</span>
                <div className="font-medium">{formatDuration(event.averageResponseTime)}</div>
              </div>
              
              <div>
                <span className="text-gray-500">Relays:</span>
                <div className="flex items-center space-x-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    ✅ {event.successfulRelays.length}
                  </span>
                  {event.failedRelays.length > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      ❌ {event.failedRelays.length}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">/{event.totalRelaysAttempted}</span>
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Tags:</span>
                <span className="font-medium ml-1">{event.tagsCount}</span>
              </div>
            </div>
            
            {event.failedRelays.length > 0 && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Failed:</span>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    {getFailedRelaysDisplay(event.failedRelays)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
