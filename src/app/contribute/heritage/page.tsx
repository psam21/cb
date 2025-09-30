import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contribute Heritage – Culture Bridge',
  description:
    'Share your cultural heritage, traditions, and knowledge to preserve them for future generations.',
};

import { HeritageContributionForm } from '@/components/heritage/HeritageContributionForm';

export default function ContributeHeritagePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container-width">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Contribute Your Heritage
            </h1>
            <p className="text-xl text-primary-100 leading-relaxed">
              Preserve and share your cultural knowledge, traditions, and stories with the global 
              community. Your contribution helps maintain cultural continuity for future generations.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="container-width">
          <HeritageContributionForm />
        </div>
      </section>
    </div>
  );
}
