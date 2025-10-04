'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchHeritageByAuthor, deleteHeritageContribution } from '@/services/business/HeritageContentService';
import { MyContributionCard } from '@/components/heritage/MyContributionCard';
import { DeleteConfirmationModal } from '@/components/heritage/DeleteConfirmationModal';
import type { HeritageCardData } from '@/components/heritage/HeritageCard';
import { HERITAGE_TYPES } from '@/config/heritage';
import { getHeritageCategories } from '@/config/categories';
import { logger } from '@/services/core/LoggingService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNostrSigner } from '@/hooks/useNostrSigner';

export default function MyContributionsPage() {
  const [contributions, setContributions] = useState<HeritageCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contributionToDelete, setContributionToDelete] = useState<HeritageCardData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [heritageTypeFilter, setHeritageTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const router = useRouter();
  const { user } = useAuthStore();
  const { getSigner } = useNostrSigner();

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

  // Filter contributions
  const filteredContributions = useMemo(() => {
    let filtered = contributions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply heritage type filter
    if (heritageTypeFilter !== 'all') {
      filtered = filtered.filter(c => c.heritageType === heritageTypeFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    return filtered;
  }, [contributions, searchQuery, heritageTypeFilter, categoryFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    contributions.forEach(c => {
      byType[c.heritageType] = (byType[c.heritageType] || 0) + 1;
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    return {
      total: contributions.length,
      byType,
      byCategory,
    };
  }, [contributions]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setHeritageTypeFilter('all');
    setCategoryFilter('all');
  };

  const handleEdit = (contribution: HeritageCardData) => {
    logger.info('Navigate to edit', {
      service: 'MyContributionsPage',
      method: 'handleEdit',
      contributionId: contribution.id,
    });
    router.push(`/my-contributions/edit/${contribution.dTag}`);
  };

  const handleDelete = (contribution: HeritageCardData) => {
    logger.info('Opening delete confirmation', {
      service: 'MyContributionsPage',
      method: 'handleDelete',
      contributionId: contribution.id,
    });
    setContributionToDelete(contribution);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contributionToDelete || !user?.pubkey) return;

    setIsDeleting(true);
    try {
      logger.info('Deleting contribution', {
        service: 'MyContributionsPage',
        method: 'handleDeleteConfirm',
        contributionId: contributionToDelete.id,
      });

      const signer = await getSigner();
      if (!signer) {
        throw new Error('No Nostr signer available');
      }

      // Find the full contribution to get eventId
      const fullContributions = await fetchHeritageByAuthor(user.pubkey);
      const fullContribution = fullContributions.find(c => c.dTag === contributionToDelete.dTag);
      
      if (!fullContribution) {
        throw new Error('Contribution not found');
      }

      const result = await deleteHeritageContribution(
        fullContribution.eventId,
        signer,
        user.pubkey,
        contributionToDelete.title
      );

      if (result.success) {
        logger.info('Contribution deleted successfully', {
          service: 'MyContributionsPage',
          method: 'handleDeleteConfirm',
          contributionId: contributionToDelete.id,
          publishedRelays: result.publishedRelays?.length,
        });

        // Remove from local state
        setContributions(prev => prev.filter(c => c.id !== contributionToDelete.id));
        
        // Close modal
        setDeleteModalOpen(false);
        setContributionToDelete(null);
      } else {
        throw new Error(result.error || 'Failed to delete contribution');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete contribution';
      logger.error('Error deleting contribution', err instanceof Error ? err : new Error(errorMsg), {
        service: 'MyContributionsPage',
        method: 'handleDeleteConfirm',
      });
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
    }
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
        {/* Statistics Dashboard */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Contributions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{statistics.total}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            {/* By Heritage Type */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <p className="text-sm font-medium text-gray-600 mb-3">By Heritage Type</p>
              <div className="space-y-2">
                {Object.entries(statistics.byType).slice(0, 3).map(([type, count]) => {
                  const heritageType = HERITAGE_TYPES.find(t => t.id === type);
                  return (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{heritageType?.name || type}</span>
                      <span className="font-semibold text-primary-900">{count}</span>
                    </div>
                  );
                })}
                {Object.keys(statistics.byType).length > 3 && (
                  <p className="text-xs text-gray-500 pt-1">+{Object.keys(statistics.byType).length - 3} more types</p>
                )}
              </div>
            </div>

            {/* By Category */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <p className="text-sm font-medium text-gray-600 mb-3">By Category</p>
              <div className="space-y-2">
                {Object.entries(statistics.byCategory).slice(0, 3).map(([category, count]) => {
                  const cat = getHeritageCategories().find(c => c.id === category);
                  return (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{cat?.name || category}</span>
                      <span className="font-semibold text-primary-900">{count}</span>
                    </div>
                  );
                })}
                {Object.keys(statistics.byCategory).length > 3 && (
                  <p className="text-xs text-gray-500 pt-1">+{Object.keys(statistics.byCategory).length - 3} more categories</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Your Contributions</h2>
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear All
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or tags..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Heritage Type Filter */}
              <div>
                <label htmlFor="heritageType" className="block text-sm font-medium text-gray-700 mb-2">
                  Heritage Type
                </label>
                <select
                  id="heritageType"
                  value={heritageTypeFilter}
                  onChange={(e) => setHeritageTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  {HERITAGE_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Categories</option>
                  {getHeritageCategories().map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredContributions.length}</span> of <span className="font-semibold text-gray-900">{contributions.length}</span> contributions
              </p>
            </div>
          </div>
        )}

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
        {!isLoading && !error && filteredContributions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredContributions.map(contribution => (
              <MyContributionCard 
                key={contribution.id} 
                contribution={contribution}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* No Results State (when filters applied but no matches) */}
        {!isLoading && !error && contributions.length > 0 && filteredContributions.length === 0 && (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={handleClearFilters}
              className="btn-primary-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setContributionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={contributionToDelete?.title || ''}
        message="This will publish a deletion event to Nostr relays. This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
}
