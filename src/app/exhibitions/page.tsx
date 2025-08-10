import type { Metadata } from 'next';
import ExhibitionsContent from '@/components/pages/ExhibitionsContent';

export const metadata: Metadata = {
  title: 'Exhibitions – Culture Bridge',
  description:
    'Curated cultural exhibitions showcasing artifacts, traditions, and stories from global communities.',
};

export default function ExhibitionsPage() {
  return <ExhibitionsContent />;
}
