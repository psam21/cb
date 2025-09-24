import type { Metadata } from 'next';
import MeetupsContent from '@/components/pages/MeetupsContent';

export const metadata: Metadata = {
  title: 'Meetups – Culture Bridge',
  description:
    'Join cultural meetups, community gatherings, and collaborative heritage events in your area.',
};

export default function MeetupsPage() {
  return <MeetupsContent />;
}
