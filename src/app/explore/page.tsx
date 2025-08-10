'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  BookOpen, 
  Heart,
  ArrowRight,
  Globe,
  Play,
  Volume2
} from 'lucide-react';

// Mock data for cultures based on the mocks
const cultures = [
  {
    id: 1,
    name: 'The Art of Storytelling in the Andes',
    location: 'Andean Communities',
    region: 'South America',
    image: 'https://images.unsplash.com/photo-1606114701010-e2b90b5ab7d8?w=400&h=300&fit=crop',
    contributors: 23,
    languages: 2,
    stories: 45,
    audioRecordings: 12,
    videos: 8,
    tags: ['Oral Tradition', 'Storytelling', 'Andean Culture', 'Community'],
    description: 'Ancient Andean storytelling traditions that preserve history, wisdom, and cultural values through generations of oral narrative.',
    featured: true,
    lastUpdated: '2 days ago',
  },
  {
    id: 2,
    name: 'Weaving Traditions of the Navajo Nation',
    location: 'Navajo Nation',
    region: 'North America',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop',
    contributors: 18,
    languages: 1,
    stories: 32,
    audioRecordings: 15,
    videos: 6,
    tags: ['Weaving', 'Textiles', 'Traditional Crafts', 'Indigenous Art'],
    description: 'Traditional Navajo weaving techniques passed down through generations, creating beautiful rugs and textiles with cultural significance.',
    featured: true,
    lastUpdated: '1 week ago',
  },
  {
    id: 3,
    name: 'Balinese Gamelan Orchestra',
    location: 'Indonesian Culture',
    region: 'Asia',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    contributors: 12,
    languages: 1,
    stories: 28,
    audioRecordings: 20,
    videos: 4,
    tags: ['Gamelan', 'Orchestra', 'Ritual', 'Indonesian Culture'],
    description: 'The traditional Balinese gamelan orchestra, where bronze instruments create hypnotic rhythms that accompany ceremonies and tell ancient stories.',
    featured: false,
    lastUpdated: '3 days ago',
  },
  {
    id: 4,
    name: 'The Tango of Buenos Aires',
    location: 'Argentinian Culture',
    region: 'South America',
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&h=300&fit=crop',
    contributors: 14,
    languages: 1,
    stories: 35,
    audioRecordings: 18,
    videos: 12,
    tags: ['Dance', 'Music', 'Tango', 'Urban Culture'],
    description: 'The passionate dance and music of Buenos Aires, expressing the soul of Argentine culture through movement and melody.',
    featured: false,
    lastUpdated: '2 days ago',
  },
  {
    id: 5,
    name: 'The Music of the Irish Pubs',
    location: 'Irish Culture',
    region: 'Europe',
    image: 'https://images.unsplash.com/photo-1570021979725-7a83c41ec1d0?w=400&h=300&fit=crop',
    contributors: 22,
    languages: 1,
    stories: 41,
    audioRecordings: 25,
    videos: 9,
    tags: ['Traditional Music', 'Folk Songs', 'Community', 'Irish Culture'],
    description: 'Traditional Irish music that brings communities together in pubs and gatherings, preserving centuries of musical heritage.',
    featured: false,
    lastUpdated: '1 day ago',
  },
  {
    id: 6,
    name: 'The Pottery of Oaxaca',
    location: 'Oaxacan Communities',
    region: 'North America',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    contributors: 16,
    languages: 2,
    stories: 29,
    audioRecordings: 8,
    videos: 11,
    tags: ['Pottery', 'Traditional Crafts', 'Indigenous Art', 'Ceramics'],
    description: 'Traditional pottery techniques from Oaxaca, Mexico, creating beautiful ceramics using ancestral methods and local clay.',
    featured: false,
    lastUpdated: '4 days ago',
  },
];

const regions = ['All Regions', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];
const contentTypes = ['All Content', 'Stories', 'Audio', 'Video', 'Images'];
const sortOptions = ['Recently Updated', 'Most Contributors', 'Most Stories', 'Alphabetical'];

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedContentType, setSelectedContentType] = useState('All Content');
  const [sortBy, setSortBy] = useState('Recently Updated');
  const [showFilters, setShowFilters] = useState(false);

  const filteredCultures = cultures.filter(culture => {
    const matchesSearch = culture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         culture.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         culture.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRegion = selectedRegion === 'All Regions' || culture.region === selectedRegion;
    
    return matchesSearch && matchesRegion;
  });

  const sortedCultures = [...filteredCultures].sort((a, b) => {
    switch (sortBy) {
      case 'Most Contributors':
        return b.contributors - a.contributors;
      case 'Most Stories':
        return b.stories - a.stories;
      case 'Alphabetical':
        return a.name.localeCompare(b.name);
      default:
        return 0; // Keep original order for "Recently Updated"
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
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
              Discover and learn about diverse cultural traditions from around the world. 
              Use the filters below to narrow your search and find content that resonates with you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white">
        <div className="container-width">
          <div className="space-y-6">
            {/* Main Search */}
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for traditions, communities, or regions"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-3 text-base rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 hover:border-primary-500">
                <span>Region</span>
                <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 hover:border-primary-500">
                <span>Community</span>
                <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 hover:border-primary-500">
                <span>Type of Tradition</span>
                <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Legacy Filters (keeping for functionality) */}
      <section className="py-6 bg-white border-b border-gray-200" style={{display: 'none'}}>
        <div className="container-width">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-wrap items-center gap-4"
                >
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedContentType}
                    onChange={(e) => setSelectedContentType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {contentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section-padding">
        <div className="container-width">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif font-bold text-primary-800">
              Featured Cultures
            </h2>
            <div className="text-gray-600">
              Showing {sortedCultures.length} of {cultures.length} cultures
            </div>
          </div>

          {/* Featured Cultures */}
          {sortedCultures.some(culture => culture.featured) && (
            <div className="mb-12">
              <h3 className="text-xl font-serif font-bold text-primary-800 mb-6">Featured Cultures</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {sortedCultures.filter(culture => culture.featured).map((culture, index) => (
                  <motion.div
                    key={culture.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="culture-card group p-0 overflow-hidden"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={culture.image}
                        alt={culture.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-accent-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Featured
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black bg-opacity-50 rounded-lg p-4 text-white">
                          <h3 className="text-xl font-serif font-bold mb-1">{culture.name}</h3>
                          <p className="text-sm opacity-90 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {culture.location}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-700 mb-4">{culture.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <Users className="w-4 h-4 text-primary-600 mr-1" />
                            <span className="font-semibold text-primary-800">{culture.contributors}</span>
                          </div>
                          <p className="text-xs text-gray-600">Contributors</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <BookOpen className="w-4 h-4 text-primary-600 mr-1" />
                            <span className="font-semibold text-primary-800">{culture.stories}</span>
                          </div>
                          <p className="text-xs text-gray-600">Stories</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <Volume2 className="w-4 h-4 text-primary-600 mr-1" />
                            <span className="font-semibold text-primary-800">{culture.audioRecordings}</span>
                          </div>
                          <p className="text-xs text-gray-600">Audio</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {culture.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {culture.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                            +{culture.tags.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Updated {culture.lastUpdated}</span>
                        <button className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center w-full justify-center py-2">
                          Explore Culture
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All Cultures Grid */}
          <div className="mb-8">
            <h3 className="text-xl font-serif font-bold text-primary-800 mb-6">All Cultures</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCultures.map((culture, index) => (
                <motion.div
                  key={culture.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="culture-card group"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={culture.image}
                      alt={culture.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-accent-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                      Nostr Verified
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                      {culture.name}
                    </h3>
                    <p className="text-gray-600 mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {culture.location}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {culture.contributors}
                        </span>
                        <span className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {culture.stories}
                        </span>
                      </div>
                      <span>Updated {culture.lastUpdated}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {culture.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {culture.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                          +{culture.tags.length - 2}
                        </span>
                      )}
                    </div>
                    
                    <button className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center w-full justify-center py-2">
                      Explore Culture
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Load More */}
          <div className="text-center">
            <button className="btn-outline">
              Load More Cultures
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
