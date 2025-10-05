'use client';

import { UserEventData } from '@/services/core/KVService';
import { useState } from 'react';

interface EventTableProps {
  events: UserEventData[];
  sortField: keyof UserEventData;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof UserEventData) => void;
}

export function EventTable({ events, sortField, sortDirection, onSort }: EventTableProps) {
  const [selectedRejections, setSelectedRejections] = useState<{ relays: string[]; reasons: Record<string, string> } | null>(null);
  const [selectedSilentFailures, setSelectedSilentFailures] = useState<string[] | null>(null);

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

  // Get rejection reasons display with truncation
  const getRejectionReasonsDisplay = (failedRelayReasons?: Record<string, string>) => {
    if (!failedRelayReasons || Object.keys(failedRelayReasons).length === 0) {
      return null;
    }

    const reasons = Object.entries(failedRelayReasons);
    const firstReason = reasons[0];
    const relayName = getRelayName(firstReason[0]);
    const reason = firstReason[1];
    
    // Truncate if longer than 40 characters
    const truncated = reason.length > 40 ? reason.substring(0, 40) + '...' : reason;
    
    if (reasons.length === 1) {
      return {
        display: `${relayName}: ${truncated}`,
        full: `${relayName}: ${reason}`,
        hasMore: false,
      };
    } else {
      return {
        display: `${relayName}: ${truncated} (+${reasons.length - 1} more)`,
        full: reasons.map(([url, r]) => `${getRelayName(url)}: ${r}`).join('\n'),
        hasMore: true,
      };
    }
  };

  // Get relay names list for display
  const getRelayNamesList = (relays: string[], maxDisplay: number = 3): string => {
    if (relays.length === 0) return '';
    const names = relays.map(getRelayName);
    if (names.length <= maxDisplay) {
      return names.join(', ');
    }
    return `${names.slice(0, maxDisplay).join(', ')} +${names.length - maxDisplay} more`;
  };

  // Note: We don't have per-relay response times in current data structure
  // These would need to be added to the event logging in GenericRelayService
  // For now, we show what's available

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
                Rejection Reasons
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
                <td className="px-6 py-4">
                  {(() => {
                    const rejectionInfo = getRejectionReasonsDisplay(event.failedRelayReasons);
                    if (!rejectionInfo) {
                      return <span className="text-sm text-gray-500">-</span>;
                    }
                    
                    return (
                      <div className="text-sm text-gray-900 max-w-sm">
                        <button
                          onClick={() => setSelectedRejections({
                            relays: event.failedRelays,
                            reasons: event.failedRelayReasons || {}
                          })}
                          className="text-left hover:text-primary-600 underline decoration-dotted cursor-help"
                          title="Click to see full rejection reasons"
                        >
                          {rejectionInfo.display}
                        </button>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {formatDuration(event.averageResponseTime)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    {/* Verified relays */}
                    {event.verifiedRelays && event.verifiedRelays.length > 0 && (
                      <div className="flex items-center space-x-1" title={event.verifiedRelays.map(getRelayName).join(', ')}>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✅ {event.verifiedRelays.length} verified
                        </span>
                        <span className="text-xs text-gray-600">({getRelayNamesList(event.verifiedRelays, 2)})</span>
                      </div>
                    )}
                    {/* Unverified relays (accepted but not yet verified) */}
                    {event.unverifiedRelays && event.unverifiedRelays.length > 0 && (
                      <div className="flex items-center space-x-1" title={event.unverifiedRelays.map(getRelayName).join(', ')}>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠️ {event.unverifiedRelays.length} unverified
                        </span>
                        <span className="text-xs text-gray-600">({getRelayNamesList(event.unverifiedRelays, 2)})</span>
                      </div>
                    )}
                    {/* Silent failures (accepted but didn't store) */}
                    {event.silentFailureRelays && event.silentFailureRelays.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setSelectedSilentFailures(event.silentFailureRelays || [])}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer"
                          title="Click to see details - these relays accepted the event but didn't store it"
                        >
                          🔇 {event.silentFailureRelays.length} silent fail
                        </button>
                        <span className="text-xs text-gray-600">({getRelayNamesList(event.silentFailureRelays, 2)})</span>
                      </div>
                    )}
                    {/* Failed relays */}
                    {event.failedRelays.length > 0 && (
                      <div className="flex items-center space-x-1" title={event.failedRelays.map(getRelayName).join(', ')}>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          ❌ {event.failedRelays.length} failed
                        </span>
                        <span className="text-xs text-gray-600">({getRelayNamesList(event.failedRelays, 2)})</span>
                      </div>
                    )}
                    {/* Fallback for old data without verification */}
                    {!event.verifiedRelays && !event.unverifiedRelays && !event.silentFailureRelays && (
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
                    )}
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
                {event.failedRelayReasons && Object.keys(event.failedRelayReasons).length > 0 && (
                  <div className="mt-1">
                    <button
                      onClick={() => setSelectedRejections({
                        relays: event.failedRelays,
                        reasons: event.failedRelayReasons || {}
                      })}
                      className="text-xs text-primary-600 hover:text-primary-700 underline"
                    >
                      View rejection reasons
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rejection Reasons Modal */}
      {selectedRejections && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto" 
          aria-labelledby="modal-title" 
          role="dialog" 
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setSelectedRejections(null)}
            ></div>

            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    Relay Rejection Reasons
                  </h3>
                  
                  <div className="mt-2 space-y-3">
                    {Object.entries(selectedRejections.reasons).map(([url, reason]) => (
                      <div key={url} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {getRelayName(url)}
                            </div>
                            <div className="text-xs text-gray-500 mb-2 font-mono break-all">
                              {url}
                            </div>
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                              {reason}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedRejections(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silent Failures Modal */}
      {selectedSilentFailures && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto" 
          aria-labelledby="modal-title" 
          role="dialog" 
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setSelectedSilentFailures(null)}
            ></div>

            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2" id="modal-title">
                    🔇 Silent Failures Detected
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    These relays accepted the event (sent OK=true) but did NOT return it when queried. 
                    This indicates the event was not properly stored or indexed.
                  </p>
                  
                  <div className="mt-2 space-y-3">
                    {selectedSilentFailures.map((url) => (
                      <div key={url} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {getRelayName(url)}
                            </div>
                            <div className="text-xs text-gray-500 mb-2 font-mono break-all">
                              {url}
                            </div>
                            <div className="text-sm text-orange-700 bg-orange-100 p-2 rounded border border-orange-300">
                              ⚠️ Relay claimed success but event not found on verification query
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                              <strong>Possible causes:</strong>
                              <ul className="list-disc ml-4 mt-1">
                                <li>Relay doesn&apos;t support this event kind (NIP)</li>
                                <li>Storage quota exceeded</li>
                                <li>Event accepted but not properly indexed</li>
                                <li>Relay clearing old events too quickly</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedSilentFailures(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
