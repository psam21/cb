'use client';

import React, { useState } from 'react';
import Image from 'next/image';
// Removed blur import - using placeholder
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
const meetupTypes = [
  {
    icon: MessageSquare,
    title: 'Cultural Discussions',
    description:
      'Join themed discussion groups exploring cultural practices, stories, and shared values.',
  },
  {
    icon: Video,
    title: 'Workshop Meetups',
    description:
      'Participate in hands-on craft, music, language, and storytelling sessions with cultural practitioners.',
  },
  {
    icon: Users,
    title: 'Community Gatherings',
    description:
      'Connect with local and global communities for cultural exchange, reflection, and learning.',
  },
  {
    icon: Star,
    title: 'Cultural Mentorship',
    description: 'Receive personal guidance from cultural keepers in your areas of interest.',
  },
];

const meetupEvents = [
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

export default function MeetupsContent() {
  const [selectedType, setSelectedType] = useState<string>('All');

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const eventId = target.getAttribute('data-event-id');
    const event = meetupEvents.find((p) => p.id.toString() === eventId);
    if (event) target.src = event.fallback;
  };

  const eventTypes = ['All', 'Storytelling', 'Ceremony', 'Craft', 'Dance', 'Music'];
  const filteredEvents =
    selectedType === 'All'
      ? meetupEvents
      : meetupEvents.filter((p) => p.type === selectedType);

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
              Cultural <span className="text-accent-400">Meetups</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8">
              Join cultural meetups, community gatherings, and collaborative heritage events in your area and online.
            </p>
            <div className="flex items-center justify-center space-x-6 text-primary-200">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>Community Events</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>Local & Global</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Cultural Connection</span>
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
              Types of Meetups
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the type of cultural meetup that resonates with your interests and learning style.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {meetupTypes.map((type, index) => {
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
            {eventTypes.map((type) => (
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
              Upcoming Meetups
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join cultural meetups and community events with practitioners sharing their traditions and wisdom.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <Image
                    src={event.image}
                    alt={`${event.title} cultural meetup`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
                    className="object-cover"
                    data-event-id={event.id}
                    onError={handleImageError}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-primary-800">
                    {event.type}
                  </div>
                  <div className="absolute top-4 right-4 bg-accent-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-white">
                    {event.level}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <User className="w-4 h-4 mr-1" />
                    <span className="mr-4">{event.host}</span>
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{event.culture}</span>
                  </div>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {event.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{event.nextSession}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        {event.participants}/{event.maxParticipants} participants
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>{event.language}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-accent-400 fill-current" />
                      ))}
                    </div>
                    <Link
                      href={`/meetups/events/${event.id}`}
                      className="btn-primary"
                      aria-label={`Join meetup: ${event.title}`}
                    >
                      Join Meetup
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
              Ready to Connect?
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Join our global community of cultural learners and share your own traditions while
              discovering the beauty of other cultures through meetups and events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/meetups/events"
                className="btn-primary"
                aria-label="Browse all meetups"
              >
                Browse All Meetups
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/meetups/host"
                className="btn-outline"
                aria-label="Host a meetup"
              >
                Host a Meetup
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
