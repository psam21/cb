'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchAllHeritage } from '@/services/business/HeritageContentService';
import { HeritageCard, type HeritageCardData } from '@/components/heritage/HeritageCard';
import { HERITAGE_TYPES, TIME_PERIODS } from '@/config/heritage';
import { logger } from '@/services/core/LoggingService';

export default function HeritagePage() {
  const [contributions, setContributions] = useState<HeritageCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [heritageTypeFilter, setHeritageTypeFilter] = useState('all');
  const [timePeriodFilter, setTimePeriodFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc'>('newest');

  useEffect(() => {
    const loadContributions = async () => {
      try {
        logger.info('Loading heritage contributions', {
          service: 'HeritagePage',
          method: 'loadContributions',
        });

        const data = await fetchAllHeritage();
        
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
          pubkey: contrib.pubkey,
        }));

        setContributions(cardData);
        logger.info('Heritage contributions loaded', {
          service: 'HeritagePage',
          method: 'loadContributions',
          count: cardData.length,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load heritage contributions';
        logger.error('Error loading heritage contributions', err instanceof Error ? err : new Error(errorMsg), {
          service: 'HeritagePage',
          method: 'loadContributions',
        });
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadContributions();
  }, []);

  // Extract unique regions for filter dropdown
  const uniqueRegions = useMemo(() => {
    const regions = new Set<string>();
    contributions.forEach(c => {
      if (c.regionOrigin) regions.add(c.regionOrigin);
    });
    return Array.from(regions).sort();
  }, [contributions]);

  // Filter and sort contributions
  const filteredAndSortedContributions = useMemo(() => {
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

    // Apply time period filter
    if (timePeriodFilter !== 'all') {
      filtered = filtered.filter(c => c.timePeriod === timePeriodFilter);
    }

    // Apply region filter
    if (regionFilter !== 'all') {
      filtered = filtered.filter(c => c.regionOrigin === regionFilter);
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'newest':
        // Default order from API (already newest first)
        break;
      case 'oldest':
        sorted.reverse();
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return sorted;
  }, [contributions, searchQuery, heritageTypeFilter, timePeriodFilter, regionFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setHeritageTypeFilter('all');
    setTimePeriodFilter('all');
    setRegionFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-900 mb-2">Heritage Contributions</h1>
              <p className="text-gray-600 text-lg">
                Explore and preserve cultural heritage from around the world
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <a
                href="/contribute"
                className="btn-primary-sm"
              >
                Contribute Heritage
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        {/* Filters */}
        {!isLoading && !error && contributions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Contributions</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              {/* Time Period Filter */}
              <div>
                <label htmlFor="timePeriod" className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  id="timePeriod"
                  value={timePeriodFilter}
                  onChange={(e) => setTimePeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Periods</option>
                  {TIME_PERIODS.map(period => (
                    <option key={period.id} value={period.id}>{period.name}</option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  id="region"
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Regions</option>
                  {uniqueRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title-asc' | 'title-desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredAndSortedContributions.length}</span> of <span className="font-semibold text-gray-900">{contributions.length}</span> contributions
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading heritage contributions...</p>
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
        {!isLoading && !error && filteredAndSortedContributions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredAndSortedContributions.map(contribution => (
              <HeritageCard key={contribution.id} contribution={contribution} />
            ))}
          </div>
        )}

        {/* No Results State (when filters applied but no matches) */}
        {!isLoading && !error && contributions.length > 0 && filteredAndSortedContributions.length === 0 && (
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
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No heritage contributions yet</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Be the first to share cultural heritage knowledge!
            </p>
            <a
              href="/contribute"
              className="btn-primary-sm"
            >
              Contribute First Heritage
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
