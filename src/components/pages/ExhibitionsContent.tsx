'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
// Removed blur import - using placeholder
import { motion } from 'framer-motion';
import { ArrowRight, Filter, Layers, MapPin, Search, Tag } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Discovery sidebar removed
import type { Exhibition } from '../../types/content';
let staticData: { exhibitions: Exhibition[]; categories: string[]; regions: string[] } | undefined;
if (typeof process !== 'undefined' && process.env.APP_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  staticData = require('../../data/exhibitions').exhibitionsData;
}

// Utility filtering helpers (pure functions for easier future testing)
function filterExhibitions(
  items: Exhibition[],
  { search, category, region }: { search: string; category: string; region: string }
): Exhibition[] {
  const term = search.toLowerCase().trim();
  return items.filter((ex: Exhibition) => {
    const title = (ex.title || '').toString();
    const culture = (ex.culture || '').toString();
    const tags: string[] = Array.isArray(ex.tags) ? ex.tags : [];
    const matchesTerm =
      !term ||
      title.toLowerCase().includes(term) ||
      culture.toLowerCase().includes(term) ||
      tags.some((t) => (t || '').toLowerCase().includes(term));
    const matchesCategory = category === 'All' || ex.category === category;
    const matchesRegion = region === 'All' || ex.region === region;
    return matchesTerm && matchesCategory && matchesRegion;
  });
}

function sortExhibitions(items: Exhibition[], sort: string): Exhibition[] {
  switch (sort) {
    case 'Newest':
      return [...items]; // placeholder (would need date ordering if dates added)
    case 'Contributors':
      return [...items].sort((a, b) => b.contributors - a.contributors);
    case 'Title':
      return [...items].sort((a, b) => a.title.localeCompare(b.title));
    default:
      return items;
  }
}

const SORT_OPTIONS = ['Featured First', 'Contributors', 'Title'];

export default function ExhibitionsContent() {
  // Live Nostr data removed; use static seed data only
  const exhibitions = useMemo(() => staticData?.exhibitions ?? [], []);
  const categories = useMemo(() => staticData?.categories ?? ['All'], []);
  const regions = useMemo(() => staticData?.regions ?? ['All'], []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [category, setCategory] = useState(() => searchParams.get('cat') || 'All');
  const [region, setRegion] = useState(() => searchParams.get('reg') || 'All');
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'Featured First');
  const [showFilters, setShowFilters] = useState(false);

  // Sync state -> query params (debounced for search)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (category && category !== 'All') params.set('cat', category);
      if (region && region !== 'All') params.set('reg', region);
      if (sort && sort !== 'Featured First') params.set('sort', sort);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, category, region, sort, router, pathname]);

  const filtered = useMemo(
    () => filterExhibitions(exhibitions, { search, category, region }),
    [exhibitions, search, category, region]
  );
  const sorted = useMemo(() => {
    let base = filtered;
    if (sort === 'Featured First') {
      base = [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured));
    } else {
      base = sortExhibitions(filtered, sort);
    }
    return base;
  }, [filtered, sort]);

  const featured = sorted.filter((e: Exhibition) => e.featured);
  const regular = sorted.filter((e: Exhibition) => !e.featured);

  // Discovery sidebar removed: keep state local if needed in future

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-primary-900 to-primary-800 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container-width text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Curated <span className="text-accent-400">Exhibitions</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8">
              Deep dives into living cultural practices—woven from artifacts, media and oral
              history.
            </p>
            <div className="flex items-center justify-center space-x-6 text-primary-200">
              <div className="flex items-center">
                <Layers className="w-5 h-5 mr-2" />
                Multi-Format
              </div>
              <div className="flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Tagged
              </div>
              <div className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filterable
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search + Filters */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container-width space-y-6">
          <div className="container-width relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exhibitions by title, culture, tag"
              className="w-full pl-14 pr-4 py-3 text-base rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              aria-label="Search exhibitions"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
              aria-expanded={showFilters}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-4"
              >
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Filter by category"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Filter by region"
                >
                  {regions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Sort exhibitions"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </motion.div>
            )}
          </div>
          <div className="text-sm text-gray-600">{`${sorted.length} exhibition(s) found`}</div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="section-padding bg-gray-50">
          <div className="container-width">
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-8">Featured</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featured.map((ex, idx) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="group overflow-hidden card p-0"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={ex.image}
                      alt={`Exhibition cover for ${ex.title}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    />
                    <div className="absolute top-4 left-4 bg-accent-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center text-sm text-gray-600 mb-3 gap-x-4 gap-y-1">
                      <span className="font-medium text-accent-600">{ex.category || 'Uncategorized'}</span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {ex.region || 'Unknown'}
                      </span>
                      <span>{ex.contributors ?? 0} contributors</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                      {ex.title}
                    </h3>
                    <p className="text-gray-700 mb-4 line-clamp-3">{ex.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ex.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs"
                        >
                          {t}
                        </span>
                      ))}
                      {ex.tags.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                          +{ex.tags.length - 4}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/exhibitions/${ex.slug}`}
                      className="btn-primary w-full flex items-center justify-center"
                      aria-label={`Open exhibition ${ex.title}`}
                    >
                      View Exhibition <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Exhibitions + Discovery Side Panel */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <div>
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-8">All Exhibitions</h2>
            {regular.length === 0 && featured.length === 0 && (
              <div className="flex flex-col items-center text-center py-16">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                    <Search className="w-14 h-14 text-primary-500" />
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-primary-800 mb-3">No Results</h3>
                <p className="text-gray-600 max-w-md mb-4">
                  We couldn&apos;t find any exhibitions matching your current filters. Try adjusting
                  your search terms, category or region.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setCategory('All');
                    setRegion('All');
                    setSort('Featured First');
                  }}
                  className="btn-outline"
                >
                  Reset Filters
                </button>
              </div>
            )}
            {regular.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regular.map((ex, idx) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                    className="culture-card group"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      {ex.image ? (
                        <Image
                          src={ex.image}
                          alt={`Exhibition cover for ${ex.title}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 text-sm">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-serif font-bold text-primary-800 mb-2">
                        {ex.title}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{ex.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {ex.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs"
                          >
                            {t}
                          </span>
                        ))}
                        {ex.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                            +{ex.tags.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{ex.contributors ?? 0} contributors</span>
                        <span>{ex.lastUpdated || ''}</span>
                      </div>
                      <Link
                        href={`/exhibitions/${ex.slug}`}
                        className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center w-full justify-center py-2"
                        aria-label={`Open exhibition ${ex.title}`}
                      >
                        View Exhibition <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
