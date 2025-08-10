import type { Metadata } from 'next';
import NostrContent from '@/components/pages/NostrContent';

export const metadata: Metadata = {
  title: 'Nostr Integration – Culture Bridge',
  description:
    'How Culture Bridge leverages the Nostr protocol to preserve and authenticate cultural heritage content.',
};

export default function NostrPage() {
  return <NostrContent />;
}
