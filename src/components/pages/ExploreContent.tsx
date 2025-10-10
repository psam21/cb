/**
 * ExploreContent Component
 * Layer 2: Component (UI Rendering)
 * 
 * SOA Compliance:
 * - ✅ Renders UI based on hook data
 * - ✅ Handles user interactions (search, loadMore)
 * - ✅ Displays loading/error/empty states
 * - ❌ NO business logic (use hook)
 * - ❌ NO service calls (use hook)
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Users,
  BookOpen,
  Layers,
  Activity,
  Play,
  Headphones,
  Image as ImageIcon,
  ArrowRight,
  Loader2,
  AlertCircle,
  Globe,
} from 'lucide-react';

// Hook for data fetching (SOA Layer 3)
import { useExploreHeritage } from '@/hooks/useExploreHeritage';

export default function ExploreContent() {
  // Local UI state (search filter)
  const [searchTerm, setSearchTerm] = useState('');

  // Hook provides all data and actions (SOA compliance)
  const {
    heritageItems,
    isLoading,
    error,
    refetch,
    loadMore,
    isLoadingMore,
    hasMore,
  } = useExploreHeritage();

  // Client-side search filtering
  const filteredItems = heritageItems.filter((item) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      item.region.toLowerCase().includes(term) ||
      item.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  });

  // Split into featured (first 2) and grid (rest)
  const featured = filteredItems.slice(0, 2);
  const grid = filteredItems.slice(2);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="section-padding bg-primary-50 border-b border-gray-200">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary-800 mb-6">
              Explore Cultural Heritage
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Discover and learn about diverse cultural traditions from around the world. Use the
              filters below to find content that resonates with you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-primary-700">
              <div
                className="flex items-center text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
                title="Multiple dimensions of cultural data"
              >
                <Layers className="w-4 h-4 mr-2 text-accent-500" />
                <span>Deep Discovery</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
                title="Real-time sense of community growth & updates"
              >
                <Activity className="w-4 h-4 mr-2 text-accent-500" />
                <span>Live Activity</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
                title="Rich media formats: stories, audio, video, imagery"
              >
                <Play className="w-4 h-4 mr-1 text-accent-500" />
                <Headphones className="w-4 h-4 -ml-1 mr-1 text-accent-500" />
                <ImageIcon className="w-4 h-4 -ml-1 mr-2 text-accent-500" />
                <span>Rich Media</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-white">
        <div className="container-width">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for traditions, communities, or regions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-3 text-base rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="section-padding">
        <div className="container-width">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading heritage contributions...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Heritage</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={refetch}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Globe className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Results Found' : 'No Heritage Content Yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `No heritage contributions match "${searchTerm}"`
                  : 'Be the first to share your culture\'s story!'}
              </p>
              {!searchTerm && (
                <Link href="/contribute" className="btn-primary">
                  Contribute Heritage →
                </Link>
              )}
            </div>
          )}

          {/* Content: Featured + Grid */}
          {!isLoading && !error && filteredItems.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold text-primary-800">
                  Discover Cultural Heritage
                </h2>
                <div className="text-gray-600">
                  {searchTerm 
                    ? `${filteredItems.length} result${filteredItems.length !== 1 ? 's' : ''}`
                    : `${filteredItems.length} contribution${filteredItems.length !== 1 ? 's' : ''}`}
                </div>
              </div>

              {/* Featured Cards (First 2) */}
              {featured.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-6">
                    Featured Cultures
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    {featured.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="culture-card group p-0 overflow-hidden"
                      >
                        <div className="relative aspect-video">
                          <Image
                            src={item.image}
                            alt={`Cultural scene representing ${item.name}`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 right-4 bg-accent-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Featured
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-black/50 rounded-lg p-4 text-white">
                              <h3 className="text-xl font-serif font-bold mb-1">{item.name}</h3>
                              <p className="text-sm opacity-90 flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {item.location} · {item.region}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-gray-700 mb-4 line-clamp-3">{item.description}</p>
                          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                            <div>
                              <div className="flex items-center justify-center mb-1">
                                <Users className="w-4 h-4 text-primary-600 mr-1" />
                                <span className="font-semibold text-primary-800">
                                  {item.contributors}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">Contributor</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center mb-1">
                                <ImageIcon className="w-4 h-4 text-primary-600 mr-1" />
                                <span className="font-semibold text-primary-800">
                                  {item.mediaCount}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">Media</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center mb-1">
                                <BookOpen className="w-4 h-4 text-primary-600 mr-1" />
                                <span className="font-semibold text-primary-800">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">Category</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{item.tags.length - 3} more
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{item.relativeTime}</span>
                            <Link
                              href={`/heritage/${item.dTag}`}
                              className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center w-full justify-center py-2"
                              aria-label={`Explore culture: ${item.name}`}
                            >
                              Explore Culture
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Cultures Grid */}
              {grid.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-6">
                    All Cultures
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grid.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="culture-card group"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={item.image}
                            alt={`Cultural scene representing ${item.name}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                            {item.name}
                          </h3>
                          <p className="text-gray-600 mb-4 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {item.location}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center">
                                <ImageIcon className="w-4 h-4 mr-1" />
                                {item.mediaCount}
                              </span>
                              <span className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-1" />
                                {item.category}
                              </span>
                            </div>
                            <span>{item.relativeTime}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {item.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/heritage/${item.dTag}`}
                            className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center w-full justify-center py-2"
                            aria-label={`Explore culture: ${item.name}`}
                          >
                            Explore Culture
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Load More Button */}
              {hasMore && !searchTerm && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading More...
                      </>
                    ) : (
                      <>
                        Load More Cultures
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
