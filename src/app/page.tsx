import type { Metadata } from 'next';
import HomeContent from './home-content';

export const metadata: Metadata = {
  title: 'Culture Bridge – Preserve Heritage, Empower Communities',
  description:
    'A decentralized platform built on Nostr to permanently preserve cultural practices, languages, and traditions. Empowering communities to self-document their heritage.',
};

export default function HomePage() {
  return <HomeContent />;
}
