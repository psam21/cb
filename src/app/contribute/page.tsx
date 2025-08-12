import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contribute Your Heritage – Culture Bridge',
  description:
    'Guidelines and tools for communities to document and share language, stories, and practices on Culture Bridge.',
};

import ContributeContent from '@/components/pages/ContributeContent';

export default function ContributePage() {
  return <ContributeContent />;
}
// (No leftover JSX; build-ready)
