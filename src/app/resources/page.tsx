'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Download, 
  Video, 
  FileText,
  Headphones,
  Image,
  ExternalLink,
  Search,
  Filter,
  Star,
  User,
  Calendar,
  ArrowRight,
  Globe,
  Heart
} from 'lucide-react';

const resources = [
  {
    id: 1,
    title: 'Quechua Language Learning Guide',
    type: 'PDF Guide',
    category: 'Language',
    culture: 'Quechua',
    description: 'Complete beginner\'s guide to learning Quechua, the language of the Andes, with cultural context and pronunciation guides.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMTUwIiB5PSIxNDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0Ij5RdWVjaHVhPC90ZXh0Pjwvc3ZnPg==',
    author: 'Carlos Mamani',
    downloads: 1580,
    rating: 4.8,
    size: '2.4 MB',
    pages: 48,
    date: '2024-12-10',
    featured: true,
    icon: FileText
  },
  {
    id: 2,
    title: 'Japanese Tea Ceremony Video Series',
    type: 'Video Course',
    category: 'Ceremony',
    culture: 'Japanese',
    description: '6-part video series covering the complete Japanese tea ceremony, from preparation to mindful practice.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMTUwIiB5PSIxNDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0Ij5UZWEgQ2VyZW1vbnk8L3RleHQ+PC9zdmc+',
    author: 'Kenji Nakamura',
    downloads: 2340,
    rating: 4.9,
    duration: '3.5 hours',
    episodes: 6,
    date: '2024-12-08',
    featured: true,
    icon: Video
  },
  {
    id: 3,
    title: 'Navajo Weaving Pattern Library',
    type: 'Image Collection',
    category: 'Traditional Arts',
    culture: 'Navajo',
    description: 'Comprehensive collection of traditional Navajo weaving patterns with meanings and cultural significance.',
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=300&h=200&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjOGZiYzk0Ci8+PHRleHQgeD0iMTUwIiB5PSIxNDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0Ij5XZWF2aW5nPC90ZXh0Pjwvc3ZnPg==',
    author: 'Maria Begay',
    downloads: 890,
    rating: 4.7,
    images: 124,
    size: '45 MB',
    date: '2024-12-05',
    featured: false,
    icon: Image
  },
  {
    id: 4,
    title: 'Tango Music & Movement Audio Guide',
    type: 'Audio Course',
    category: 'Music & Dance',
    culture: 'Argentine',
    description: 'Audio guide to understanding tango rhythms, movements, and the cultural context of Buenos Aires dance.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjOGZiYzk0Ci8+PHRleHQgeD0iMTUwIiB5PSIxNDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0Ij5UYW5nbzwvdGV4dD48L3N2Zz4=',
    author: 'Sofia Rodriguez',
    downloads: 1240,
    rating: 4.6,
    duration: '2.1 hours',
    tracks: 12,
    date: '2024-12-02',
    featured: false,
    icon: Headphones
  },
  {
    id: 5,
    title: 'Irish Folk Song Collection',
    type: 'Music Archive',
    category: 'Folk Traditions',
    culture: 'Irish',
    description: 'Traditional Irish folk songs with lyrics, meanings, and historical context from pub sessions across Ireland.',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=300&h=200&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjOGZiYzk0Ci8+PHRleHQgeD0iMTUwIiB5PSIxNDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0Ij5JcmlzaCBNdXNpYzwvdGV4dD48L3N2Zz4=',
    author: 'Aoife O\'Connor',
    downloads: 1820,
    rating: 4.8,
    songs: 87,
    size: '156 MB',
    date: '2024-11-28',
    featured: true,
    icon: Headphones
  },
  {
    id: 6,
    title: 'Oaxacan Pottery Techniques Manual',
    type: 'Craft Guide',
    category: 'Traditional Arts',
    culture: 'Zapotec',
    description: 'Step-by-step guide to traditional Oaxacan pottery techniques, clay preparation, and indigenous firing methods.',
    image: 'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=300&h=200&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjOGZiYzk0Ci8+PHRleHQgeD0iMTUwIiB5PSIxNDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0Ij5Qb3R0ZXJ5PC90ZXh0Pjwvc3ZnPg==',
    author: 'Maria Santos',
    downloads: 650,
    rating: 4.9,
    pages: 72,
    size: '8.2 MB',
    date: '2024-11-25',
    featured: false,
    icon: FileText
  }
];

const categories = ['All Resources', 'Language', 'Ceremony', 'Traditional Arts', 'Music & Dance', 'Folk Traditions'];
const resourceTypes = ['All Types', 'PDF Guide', 'Video Course', 'Audio Course', 'Image Collection', 'Music Archive', 'Craft Guide'];

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Resources');
  const [selectedType, setSelectedType] = useState('All Types');

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const resourceId = target.getAttribute('data-resource-id');
    const resource = resources.find(r => r.id.toString() === resourceId);
    if (resource) {
      target.src = resource.fallback;
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.culture.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Resources' || resource.category === selectedCategory;
    const matchesType = selectedType === 'All Types' || resource.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const featuredResources = resources.filter(resource => resource.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-accent-600 to-accent-700 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Cultural <span className="text-white">Resources</span>
            </h1>
            <p className="text-xl md:text-2xl text-accent-100 leading-relaxed mb-8">
              Discover guides, videos, audio courses, and tools to deepen your understanding 
              of cultures from around the world.
            </p>
            <div className="flex items-center justify-center space-x-6 text-accent-200">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                <span>Learning Materials</span>
              </div>
              <div className="flex items-center">
                <Download className="w-5 h-5 mr-2" />
                <span>Free Downloads</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>Global Cultures</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container-width">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources, cultures, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-base rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-accent-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap justify-center gap-3">
              {resourceTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                    selectedType === type
                      ? 'bg-primary-800 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Featured Resources
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our most popular and comprehensive cultural learning materials.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {featuredResources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex">
                    <div className="w-1/3">
                      <div className="relative h-32">
                        <img
                          src={resource.image}
                          alt={resource.title}
                          className="w-full h-full object-cover"
                          data-resource-id={resource.id}
                          onError={handleImageError}
                        />
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-2">
                          <Icon className="w-4 h-4 text-accent-600" />
                        </div>
                      </div>
                    </div>
                    <div className="w-2/3 p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-accent-600 bg-accent-50 px-2 py-1 rounded">
                          {resource.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {resource.type}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-primary-800 mb-2">
                        {resource.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <User className="w-4 h-4 mr-1" />
                        <span className="mr-4">{resource.author}</span>
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{resource.date}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-4">
                        {resource.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(resource.rating) ? 'text-accent-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {resource.rating} ({resource.downloads} downloads)
                          </span>
                        </div>
                        <button className="btn-primary-sm">
                          Download
                          <Download className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Resources */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              All Cultural Resources
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse our complete collection of cultural learning materials.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative h-48">
                    <img
                      src={resource.image}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                      data-resource-id={resource.id}
                      onError={handleImageError}
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2">
                      <Icon className="w-5 h-5 text-accent-600" />
                    </div>
                    <div className="absolute top-4 right-4 bg-accent-600/90 backdrop-blur-sm rounded px-3 py-1 text-sm font-medium text-white">
                      {resource.type}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-accent-600 bg-accent-50 px-3 py-1 rounded-full">
                        {resource.category}
                      </span>
                      <span className="text-sm text-gray-600">
                        {resource.culture}
                      </span>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-primary-800 mb-2">
                      {resource.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <User className="w-4 h-4 mr-1" />
                      <span>{resource.author}</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Downloads: {resource.downloads}</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-accent-400 fill-current mr-1" />
                          <span>{resource.rating}</span>
                        </div>
                      </div>
                      {resource.size && (
                        <div className="text-sm text-gray-600">
                          Size: {resource.size}
                        </div>
                      )}
                    </div>
                    <button className="btn-primary">
                      Download Resource
                      <Download className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-primary-800 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Share Your Cultural Resources
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Have cultural knowledge, guides, or materials to share? 
              Help expand our global library of cultural learning resources.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-accent">
                Contribute Resources
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="btn-outline-white">
                Learn More
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
