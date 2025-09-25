'use client';

import { logger } from '@/services/core/LoggingService';
import { BaseCard, BaseCardData } from '@/components/ui/BaseCard';

export interface Event {
  id: string;
  title: string;
  description: string;
  organizer: {
    name: string;
    pubkey: string;
    npub: string;
  };
  startDate: number;
  endDate: number;
  location: string;
  tags: string[];
  image?: string;
  attendees: number;
  maxAttendees?: number;
  eventId: string;
  isOnline: boolean;
}

interface EventCardProps {
  event: Event;
  onAttend?: (event: Event) => void;
  onShare?: (event: Event) => void;
}

export const EventCard = ({ event, onAttend, onShare }: EventCardProps) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAttend = () => {
    logger.info('Attend event clicked', {
      service: 'EventCard',
      method: 'handleAttend',
      eventId: event.id,
      title: event.title,
    });
    onAttend?.(event);
  };

  const handleShare = () => {
    logger.info('Share event clicked', {
      service: 'EventCard',
      method: 'handleShare',
      eventId: event.id,
      title: event.title,
    });
    onShare?.(event);
  };

  const handleNjumpClick = () => {
    logger.info('Njump link clicked', {
      service: 'EventCard',
      method: 'handleNjumpClick',
      eventId: event.id,
      eventNostrId: event.eventId,
    });
    
    window.open(`https://njump.me/${event.eventId}`, '_blank');
  };

  // Convert Event to BaseCardData
  const cardData: BaseCardData = {
    id: event.id,
    title: event.title,
    description: event.description,
    image: event.image,
    tags: event.tags,
    publishedAt: event.startDate, // Use start date as the "published" time
    author: event.organizer,
    metadata: {
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      attendees: event.attendees,
      maxAttendees: event.maxAttendees,
      eventId: event.eventId,
      isOnline: event.isOnline,
    },
  };

  const isFull = event.maxAttendees && event.attendees >= event.maxAttendees;
  const isPast = event.endDate < Math.floor(Date.now() / 1000);

  return (
    <BaseCard
      data={cardData}
      className="h-full flex flex-col"
      contentClassName="flex-1 flex flex-col"
    >
      {/* Event Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(event.startDate)}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.isOnline ? 'Online Event' : event.location}
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {event.attendees} attendees
          {event.maxAttendees && ` / ${event.maxAttendees} max`}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 mb-4">
        {isPast && (
          <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            Past Event
          </span>
        )}
        {isFull && (
          <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
            Full
          </span>
        )}
        {event.isOnline && (
          <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
            Online
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {!isPast && !isFull && (
          <button
            onClick={handleAttend}
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
          >
            Attend
          </button>
        )}
        <button
          onClick={handleShare}
          className="flex-1 bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors duration-200"
        >
          Share
        </button>
        <button
          onClick={handleNjumpClick}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
          title="View on Nostr"
        >
          📱
        </button>
      </div>
    </BaseCard>
  );
};
