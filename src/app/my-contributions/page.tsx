'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchHeritageByAuthor } from '@/services/business/HeritageContentService';
import { MyContributionCard } from '@/components/heritage/MyContributionCard';
import type { HeritageCardData } from '@/components/heritage/HeritageCard';
import { logger } from '@/services/core/LoggingService';
import { useAuthStore } from '@/stores/useAuthStore';

export default function MyContributionsPage() {
  const [contributions, setContributions] = useState<HeritageCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const loadContributions = async () => {
      if (!user?.pubkey) {
        setIsLoading(false);
        return;
      }

      try {
        logger.info('Loading user heritage contributions', {
          service: 'MyContributionsPage',
          method: 'loadContributions',
          pubkey: user.pubkey,
        });

        const data = await fetchHeritageByAuthor(user.pubkey);
        
        // Map to HeritageCardData format
        const cardData: HeritageCardData[] = data.map(contrib => ({
          id: contrib.id,
          dTag: contrib.dTag,
          title: contrib.title,
          description: contrib.description,
          heritageType: contrib.heritageType,
          category: contrib.category,
          timePeriod: contrib.timePeriod,
          regionOrigin: contrib.regionOrigin,
          country: contrib.country,
          imageUrl: contrib.media[0]?.source.url,
          tags: contrib.tags,
        }));

        setContributions(cardData);
        logger.info('User heritage contributions loaded', {
          service: 'MyContributionsPage',
          method: 'loadContributions',
          count: cardData.length,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load contributions';
        logger.error('Error loading user contributions', err instanceof Error ? err : new Error(errorMsg), {
          service: 'MyContributionsPage',
          method: 'loadContributions',
        });
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadContributions();
  }, [user?.pubkey]);

  const handleEdit = (contribution: HeritageCardData) => {
    logger.info('Navigate to edit', {
      service: 'MyContributionsPage',
      method: 'handleEdit',
      contributionId: contribution.id,
    });
    router.push(`/my-contributions/edit/${contribution.dTag}`);
  };

  const handleDelete = (contribution: HeritageCardData) => {
    logger.info('Delete contribution', {
      service: 'MyContributionsPage',
      method: 'handleDelete',
      contributionId: contribution.id,
    });
    // TODO: Implement delete modal/confirmation
    alert(`Delete functionality coming soon for: ${contribution.title}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-16">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to view your heritage contributions.
            </p>
            <a href="/signin" className="btn-primary-sm">
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-900 mb-2">My Heritage Contributions</h1>
              <p className="text-gray-600 text-lg">
                Manage and edit your cultural heritage contributions
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <a
                href="/contribute"
                className="btn-primary-sm"
              >
                Add New Contribution
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your contributions...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Contributions</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contributions Grid */}
        {!isLoading && !error && contributions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {contributions.map(contribution => (
              <MyContributionCard 
                key={contribution.id} 
                contribution={contribution}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && contributions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-primary-300 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No contributions yet</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Start sharing your cultural heritage knowledge with the world!
            </p>
            <a
              href="/contribute"
              className="btn-primary-sm"
            >
              Create First Contribution
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
