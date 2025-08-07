'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Heart, 
  Share2, 
  Bookmark, 
  Play, 
  Volume2,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Filter,
  Grid,
  List,
  Star
} from 'lucide-react';

// Mock data for exhibits
const exhibits = [
  {
    id: 1,
    title: 'The Art of Storytelling in the Andes',
    curator: 'Carlos Mamani',
    culture: 'Quechua',
    location: 'Peru',
    description: 'Journey through the ancient tradition of Andean storytelling, where tales of mountains, spirits, and ancestral wisdom come alive through master storytellers.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
    items: 24,
    visitors: 1240,
    featured: true,
    category: 'Oral Traditions',
    createdAt: '2024-12-15',
    tags: ['Storytelling', 'Andean Culture', 'Oral History', 'Mountain Spirits'],
  },
  {
    id: 2,
    title: 'Weaving Traditions of the Navajo Nation',
    curator: 'Maria Begay',
    culture: 'Navajo',
    location: 'Southwest United States',
    description: 'Explore the sacred art of Navajo weaving, where each pattern tells a story and every thread connects weavers to their ancestors and the earth.',
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=600&h=400&fit=crop',
    items: 32,
    visitors: 1890,
    featured: true,
    category: 'Textiles & Crafts',
    createdAt: '2024-12-12',
    tags: ['Weaving', 'Sacred Patterns', 'Traditional Arts', 'Ancestral Connection'],
  },
  {
    id: 3,
    title: 'The Haka of New Zealand',
    curator: 'Rawiri Thompson',
    culture: 'Maori',
    location: 'New Zealand',
    description: 'Experience the powerful Maori haka, a ceremonial dance that embodies strength, unity, and ancestral connection.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
    items: 18,
    visitors: 1580,
    featured: true,
    category: 'Ceremonies & Rituals',
    createdAt: '2024-12-10',
    tags: ['Haka', 'Dance', 'Maori Culture', 'Ceremony'],
  },
  {
    id: 4,
    title: 'The Tango of Buenos Aires',
    curator: 'Sofia Rodriguez',
    culture: 'Argentine',
    location: 'Buenos Aires, Argentina',
    description: 'Feel the passion and melancholy of Argentine tango, a dance born in the streets that expresses the soul of Buenos Aires and its people.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
    items: 27,
    visitors: 1420,
    featured: false,
    category: 'Music & Dance',
    createdAt: '2024-12-08',
    tags: ['Tango', 'Street Culture', 'Passionate Dance', 'Urban Heritage'],
  },
  {
    id: 5,
    title: 'The Music of the Irish Pubs',
    curator: 'Aoife O\'Connor',
    culture: 'Irish',
    location: 'Ireland',
    description: 'Immerse yourself in the heart of Irish culture through traditional pub music, where stories are sung and community bonds are strengthened.',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&h=400&fit=crop',
    items: 21,
    visitors: 1160,
    featured: false,
    category: 'Music & Performance',
    createdAt: '2024-12-05',
    tags: ['Traditional Music', 'Community Gathering', 'Folk Songs', 'Irish Heritage'],
  },
  {
    id: 6,
    title: 'The Pottery of Oaxaca',
    curator: 'Maria Santos',
    culture: 'Zapotec',
    location: 'Oaxaca, Mexico',
    description: 'Discover the ancient pottery traditions of Oaxaca, where clay becomes art and each piece carries the spirit of indigenous craftsmanship.',
    image: 'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=600&h=400&fit=crop',
    items: 29,
    visitors: 980,
    featured: false,
    category: 'Ceramics & Pottery',
    createdAt: '2024-12-02',
    tags: ['Traditional Pottery', 'Indigenous Art', 'Clay Working', 'Mexican Heritage'],
  },
];

const categories = ['All Categories', 'Textiles & Crafts', 'Oral Traditions', 'Ceremonies & Rituals', 'Music & Dance', 'Ceramics & Pottery'];

export default function ExhibitionsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');

  const filteredExhibits = exhibits.filter(exhibit => 
    selectedCategory === 'All Categories' || exhibit.category === selectedCategory
  );

  const sortedExhibits = [...filteredExhibits].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.visitors - a.visitors;
      case 'items':
        return b.items - a.items;
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const featuredExhibits = exhibits.filter(exhibit => exhibit.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Cultural <span className="text-accent-400">Stories Exhibitions</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8">
              Step into living exhibitions where authentic cultural stories come alive. 
              Each collection is curated by community storytellers sharing their heritage with the world.
            </p>
            <div className="flex items-center justify-center space-x-8 text-primary-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{exhibits.length}</div>
                <div className="text-sm">Active Exhibits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {exhibits.reduce((sum, exhibit) => sum + exhibit.visitors, 0).toLocaleString()}
                </div>
                <div className="text-sm">Total Visitors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {exhibits.reduce((sum, exhibit) => sum + exhibit.items, 0)}
                </div>
                <div className="text-sm">Cultural Items</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Exhibitions */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Featured Cultural Exhibitions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Immerse yourself in these exceptional cultural exhibitions, thoughtfully curated by communities around the world.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {featuredExhibits.map((exhibit, index) => (
              <motion.div
                key={exhibit.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="card overflow-hidden group cursor-pointer"
              >
                <div className="relative aspect-video">
                  <img
                    src={exhibit.image}
                    alt={exhibit.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-accent-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                    {exhibit.items} items
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                      {exhibit.category}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Eye className="w-4 h-4 mr-1" />
                      {exhibit.visitors.toLocaleString()}
                    </div>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                    {exhibit.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{exhibit.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      <span className="mr-3">Curated by {exhibit.curator}</span>
                      <MapPin className="w-4 h-4 mr-1" />
                      {exhibit.location}
                    </div>
                    <button className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center">
                      Explore
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Exhibitions */}
      <section className="section-padding bg-primary-50">
        <div className="container-width">
          {/* Filters and Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-4">
              <h3 className="text-xl font-serif font-bold text-primary-800">All Exhibitions</h3>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="recent">Recently Added</option>
                <option value="popular">Most Popular</option>
                <option value="items">Most Items</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Exhibits Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedExhibits.map((exhibit, index) => (
                <motion.div
                  key={exhibit.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="culture-card group"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={exhibit.image}
                      alt={exhibit.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {exhibit.featured && (
                      <div className="absolute top-3 right-3 bg-accent-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">
                        {exhibit.category}
                      </span>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Eye className="w-4 h-4 mr-1" />
                        {exhibit.visitors.toLocaleString()}
                      </div>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-primary-800 mb-2">
                      {exhibit.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exhibit.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{exhibit.items} items</span>
                      <span>By {exhibit.curator}</span>
                    </div>
                    <button className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center w-full justify-center">
                      View Exhibition
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedExhibits.map((exhibit, index) => (
                <motion.div
                  key={exhibit.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={exhibit.image}
                        alt={exhibit.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-serif font-bold text-primary-800">
                          {exhibit.title}
                        </h3>
                        {exhibit.featured && (
                          <span className="px-2 py-1 bg-accent-100 text-accent-700 rounded-md text-xs font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{exhibit.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {exhibit.curator}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {exhibit.location}
                          </span>
                          <span>{exhibit.items} items</span>
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {exhibit.visitors.toLocaleString()}
                          </span>
                        </div>
                        <button className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center">
                          View Exhibition
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Your Own Exhibit */}
      <section className="section-padding bg-white">
        <div className="container-width text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-6">
              Curate Your Own Cultural Exhibition
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Share your culture's story by creating a personalized digital exhibition. 
              Combine photos, audio, video, and text to create an immersive experience.
            </p>
            <div className="flex justify-center">
              <button className="btn-primary">
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
