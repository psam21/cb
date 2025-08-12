'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { DEFAULT_BLUR } from '@/lib/blur';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Globe,
  Heart,
  Star,
  ArrowRight,
  MessageSquare,
  Video,
  MapPin,
  Calendar,
  Clock,
  User,
} from 'lucide-react';

// Data extracted from original page (could be moved to data module later)
const exchangeTypes = [
  {
    icon: MessageSquare,
    title: 'Cultural Conversations',
    description:
      'Engage in themed dialogue sessions exploring cultural practices, stories, and shared values.',
  },
  {
    icon: Video,
    title: 'Live Workshops',
    description:
      'Participate in immersive craft, music, language, and storytelling workshops led by cultural practitioners.',
  },
  {
    icon: Users,
    title: 'Community Circles',
    description:
      'Join small-group circles for deeper cultural exchange, reflection, and learning across traditions.',
  },
  {
    icon: Star,
    title: 'Cultural Mentorship',
    description: 'Receive personal guidance from cultural keepers in your areas of interest.',
  },
];

const exchangePrograms = [
  {
    id: 1,
    title: 'Storytelling Circle: Ancestral Legends',
    host: 'Maria Gutierrez',
    culture: 'Mayan',
    description:
      'Share and listen to ancestral legends passed down through generations in this interactive circle.',
    type: 'Storytelling',
    level: 'All Levels',
    nextSession: 'Jan 18, 2025',
    time: '14:00 UTC',
    participants: 18,
    maxParticipants: 30,
    language: 'Spanish / English',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9IiM3MzRjMmQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiM3MzRjMmQiLz48dGV4dCB4PSIzMDAiIHk9IjIwMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiPkltYWdlPC90ZXh0Pjwvc3ZnPg==',
  },
  {
    id: 2,
    title: 'Workshop: Traditional Weaving Basics',
    host: 'Ana Lopez',
    culture: 'Quechua',
    description:
      'Learn foundational weaving patterns and the cultural meaning woven into traditional textiles.',
    type: 'Craft',
    level: 'Beginner',
    nextSession: 'Jan 20, 2025',
    time: '16:00 UTC',
    participants: 12,
    maxParticipants: 25,
    language: 'Quechua / English',
    image: 'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=600&h=400&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9IiM3MzRjMmQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiM3MzRjMmQiLz48dGV4dCB4PSIzMDAiIHk9IjIwMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiPkltYWdlPC90ZXh0Pjwvc3ZnPg==',
  },
  {
    id: 3,
    title: 'Dance Exchange: Maori Haka Basics',
    host: 'Rawiri Thompson',
    culture: 'Maori',
    description: 'Learn foundational haka movements with cultural context and meaning.',
    type: 'Dance',
    level: 'All Levels',
    nextSession: 'Jan 25, 2025',
    time: '09:00 UTC',
    participants: 22,
    maxParticipants: 40,
    language: 'English',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9IiM3MzRjMmQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiM3MzRjMmQiLz48dGV4dCB4PSIzMDAiIHk9IjIwMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiPkltYWdlPC90ZXh0Pjwvc3ZnPg==',
  },
];

export default function ExchangeContent() {
  const [selectedType, setSelectedType] = useState<string>('All');

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const programId = target.getAttribute('data-program-id');
    const program = exchangePrograms.find((p) => p.id.toString() === programId);
    if (program) target.src = program.fallback;
  };

  const programTypes = ['All', 'Storytelling', 'Ceremony', 'Craft', 'Dance', 'Music'];
  const filteredPrograms =
    selectedType === 'All'
      ? exchangePrograms
      : exchangePrograms.filter((p) => p.type === selectedType);

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
              Cultural <span className="text-accent-400">Exchange Programs</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8">
              Connect directly with cultural practitioners from around the world. Learn, share, and
              build bridges through authentic cultural experiences.
            </p>
            <div className="flex items-center justify-center space-x-6 text-primary-200">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>Live Sessions</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>Global Community</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Authentic Exchange</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Exchange Types */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Ways to Connect &amp; Learn
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the type of cultural exchange that resonates with your learning style and
              interests.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {exchangeTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={type.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6 text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-3">
                    {type.title}
                  </h3>
                  <p className="text-gray-700">{type.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Program Filters */}
      <section className="py-6 bg-gray-100 border-y border-gray-200">
        <div className="container-width">
          <div className="flex flex-wrap justify-center gap-3">
            {programTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedType === type
                    ? 'bg-primary-800 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Exchange Programs */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Upcoming Cultural Exchanges
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join live sessions with cultural practitioners sharing their traditions and wisdom.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <Image
                    src={program.image}
                    alt={`${program.title} cultural exchange`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
                    className="object-cover"
                    data-program-id={program.id}
                    onError={handleImageError}
                      placeholder="blur"
                      blurDataURL={DEFAULT_BLUR}
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-primary-800">
                    {program.type}
                  </div>
                  <div className="absolute top-4 right-4 bg-accent-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-white">
                    {program.level}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                    {program.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <User className="w-4 h-4 mr-1" />
                    <span className="mr-4">{program.host}</span>
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{program.culture}</span>
                  </div>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {program.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{program.nextSession}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{program.time}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        {program.participants}/{program.maxParticipants} participants
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>{program.language}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-accent-400 fill-current" />
                      ))}
                    </div>
                    <Link
                      href={`/exchange/programs/${program.id}`}
                      className="btn-primary"
                      aria-label={`Join exchange program: ${program.title}`}
                    >
                      Join Exchange
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-6">
              Ready to Bridge Cultures?
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Join our global community of cultural learners and share your own traditions while
              discovering the beauty of other cultures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/exchange/programs"
                className="btn-primary"
                aria-label="Browse all exchange programs"
              >
                Browse All Programs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/exchange/host"
                className="btn-outline"
                aria-label="Host an exchange program"
              >
                Host an Exchange
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
