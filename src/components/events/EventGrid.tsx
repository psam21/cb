'use client';

import { logger } from '@/services/core/LoggingService';
import { BaseGrid, BaseGridData } from '@/components/ui/BaseGrid';
import { EventCard, Event } from './EventCard';

interface EventGridProps {
  events: Event[];
  onAttend?: (event: Event) => void;
  onShare?: (event: Event) => void;
}

export const EventGrid = ({ events, onAttend, onShare }: EventGridProps) => {
  // Convert Event to BaseGridData
  const gridData: BaseGridData[] = events.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.isOnline ? 'Online Event' : 'In-Person Event',
    tags: event.tags,
    publishedAt: event.startDate, // Use start date for sorting
    // Include all event data for filtering
    organizer: event.organizer,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    attendees: event.attendees,
    maxAttendees: event.maxAttendees,
    eventId: event.eventId,
    isOnline: event.isOnline,
  }));

  const renderEvent = (item: BaseGridData) => {
    // Convert back to Event for the card
    const event: Event = {
      id: item.id,
      title: item.title,
      description: item.description,
      organizer: (item.organizer as { name: string; pubkey: string; npub: string }) || { name: 'Anonymous', pubkey: '', npub: '' },
      startDate: (item.startDate as number) || 0,
      endDate: (item.endDate as number) || 0,
      location: (item.location as string) || '',
      tags: item.tags || [],
      image: item.image as string | undefined,
      attendees: (item.attendees as number) || 0,
      maxAttendees: item.maxAttendees as number | undefined,
      eventId: (item.eventId as string) || '',
      isOnline: (item.isOnline as boolean) || false,
    };

    return (
      <EventCard
        key={event.id}
        event={event}
        onAttend={onAttend}
        onShare={onShare}
      />
    );
  };

  const searchFields = [
    { key: 'title', label: 'Title', weight: 3 },
    { key: 'description', label: 'Description', weight: 2 },
    { key: 'location', label: 'Location', weight: 1 },
    { key: 'tags', label: 'Tags', weight: 1 },
  ];

  const filterFields = [
    { key: 'category', label: 'Event Type', type: 'select' as const },
    { key: 'isOnline', label: 'Location', type: 'select' as const },
  ];

  const sortOptions = [
    { key: 'startDate', label: 'Soonest First', direction: 'asc' as const },
    { key: 'startDate', label: 'Latest First', direction: 'desc' as const },
    { key: 'attendees', label: 'Most Popular', direction: 'desc' as const },
  ];

  const emptyState = {
    title: 'No events found',
    description: 'No events have been created yet',
    action: {
      label: 'Create First Event',
      onClick: () => {
        logger.info('Create first event clicked', {
          service: 'EventGrid',
          method: 'emptyState.action.onClick',
        });
        // This would need to be passed as a prop or handled by parent
      },
    },
  };

  return (
    <BaseGrid
      data={gridData}
      renderItem={renderEvent}
      searchFields={searchFields}
      filterFields={filterFields}
      sortOptions={sortOptions}
      emptyState={emptyState}
      searchPlaceholder="Search events..."
      gridClassName="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
    />
  );
};
