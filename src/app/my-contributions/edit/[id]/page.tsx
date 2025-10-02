'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchHeritageById } from '@/services/business/HeritageContentService';
import type { HeritageContribution } from '@/services/business/HeritageContentService';
import { HeritageContributionForm } from '@/components/heritage/HeritageContributionForm';
import type { GenericAttachment } from '@/types/attachments';
import { logger } from '@/services/core/LoggingService';

export default function HeritageEditPage() {
  const router = useRouter();
  const params = useParams();
  const contributionId = params.id as string;
  
  const { isAuthenticated, user } = useAuthStore();
  const [contribution, setContribution] = useState<HeritageContribution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch the contribution to edit
  useEffect(() => {
    const loadContribution = async () => {
      if (!contributionId) return;

      try {
        logger.info('Loading contribution for editing', {
          service: 'HeritageEditPage',
          method: 'loadContribution',
          contributionId,
        });

        const data = await fetchHeritageById(contributionId);
        
        if (data) {
          // Check if user owns this contribution
          if (user?.pubkey && data.pubkey !== user.pubkey) {
            logger.warn('User does not own this contribution', {
              service: 'HeritageEditPage',
              method: 'loadContribution',
              contributionId,
              userPubkey: user.pubkey,
              contributionPubkey: data.pubkey,
            });
            router.push('/my-contributions');
            return;
          }
          
          setContribution(data);
          logger.info('Contribution loaded for editing', {
            service: 'HeritageEditPage',
            method: 'loadContribution',
            contributionId,
            title: data.title,
          });
        } else {
          logger.warn('Contribution not found', {
            service: 'HeritageEditPage',
            method: 'loadContribution',
            contributionId,
          });
        }
      } catch (error) {
        logger.error('Error loading contribution', error instanceof Error ? error : new Error('Unknown error'), {
          service: 'HeritageEditPage',
          method: 'loadContribution',
          contributionId,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isClient && user) {
      loadContribution();
    }
  }, [contributionId, isClient, user, router]);

  // Convert HeritageContribution to form defaultValues (must be before early returns)
  const formDefaultValues = useMemo(() => {
    if (!contribution) return undefined;

    // Convert media to GenericAttachment format
    const attachments: GenericAttachment[] = contribution.media.map((media, index) => ({
      id: media.id,
      type: media.type as 'image' | 'video' | 'audio',
      name: media.source.name || `Media ${index + 1}`,
      size: media.source.size || 0, // Use actual size from media source if available
      mimeType: media.source.mimeType || 'application/octet-stream',
      url: media.source.url,
      hash: media.source.hash,
      createdAt: contribution.createdAt,
    }));

    return {
      title: contribution.title,
      description: contribution.description,
      category: contribution.category,
      heritageType: contribution.heritageType,
      language: contribution.language || '',
      communityGroup: contribution.communityGroup || '',
      region: contribution.regionOrigin,
      country: contribution.country || '',
      timePeriod: contribution.timePeriod,
      sourceType: contribution.sourceType,
      contributorRole: contribution.contributorRole || '',
      knowledgeKeeper: contribution.knowledgeKeeper || '',
      tags: contribution.tags,
      attachments,
      dTag: contribution.dTag,
      contributionId: contribution.dTag, // Add for selective operations in edit mode
    };
  }, [contribution]);

  const handleCancel = () => {
    logger.info('Cancelling contribution edit', {
      service: 'HeritageEditPage',
      method: 'handleCancel',
      contributionId,
    });
    router.push('/my-contributions');
  };

  const handleContributionUpdated = (updatedId: string) => {
    logger.info('Contribution updated successfully', {
      service: 'HeritageEditPage',
      method: 'handleContributionUpdated',
      contributionId: updatedId,
    });
    
    // Redirect to my contributions page after update
    setTimeout(() => {
      router.push('/my-contributions');
    }, 1500);
  };

  // Redirect if not authenticated
  if (isClient && (!isAuthenticated || !user)) {
    logger.warn('User not authenticated, redirecting to signin', {
      service: 'HeritageEditPage',
      method: 'render',
    });
    router.push('/signin');
    return null;
  }

  // Show loading during SSR or while fetching
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contribution...</p>
        </div>
      </div>
    );
  }

  // Show error if contribution not found
  if (!contribution) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Contribution Not Found</h3>
                <p className="text-red-600 mt-1">The heritage contribution you&apos;re trying to edit could not be found.</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/my-contributions')}
                className="btn-primary-sm"
              >
                Back to My Contributions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-800">Edit Heritage Contribution</h1>
              <p className="text-gray-600 mt-1">{contribution.title}</p>
            </div>
            <button
              onClick={handleCancel}
              className="btn-outline-sm flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to My Contributions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        <HeritageContributionForm
          defaultValues={formDefaultValues}
          isEditMode={true}
          onContributionCreated={handleContributionUpdated}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
