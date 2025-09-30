import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contribute Heritage – Culture Bridge',
  description:
    'Share your cultural heritage, traditions, and knowledge to preserve them for future generations.',
};

import { HeritageContributionForm } from '@/components/heritage/HeritageContributionForm';

export default function ContributeHeritagePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-width">
        <HeritageContributionForm />
      </div>
    </div>
  );
}
