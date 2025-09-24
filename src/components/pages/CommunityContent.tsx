'use client';

import React from 'react';
import Image from 'next/image';
// Removed blur import - using placeholder
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  MessageCircle,
  Heart,
  Globe,
  Calendar,
  MapPin,
  ArrowRight,
  BookOpen,
  Music,
  Palette,
  Coffee,
} from 'lucide-react';

// Extracted from original community page. TODO: externalize data & typing.

const communityMembers = [
  {
    id: 1,
    name: 'Carlos Mamani',
    role: 'Andean Storyteller',
    culture: 'Quechua',
    location: 'Sacred Valley, Peru',
    specialties: ['Oral Traditions', 'Mountain Spirituality', 'Ancient Stories'],
    bio: 'Master storyteller preserving the ancient tales of the Andes for future generations.',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 24,
    followers: 1840,
    icon: BookOpen,
  },
  {
    id: 2,
    name: 'Kenji Nakamura',
    role: 'Tea Master',
    culture: 'Japanese',
    location: 'Kyoto, Japan',
    specialties: ['Flamenco Dance', 'Spanish Guitar', 'Traditional Arts'],
    bio: 'Third-generation tea master sharing the way of tea and mindful living.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 18,
    followers: 2150,
    icon: Coffee,
  },
  {
    id: 3,
    name: 'Maria Begay',
    role: 'Master Weaver',
    culture: 'Navajo',
    location: 'Monument Valley, Arizona',
    specialties: ['Traditional Weaving', 'Sacred Patterns', 'Cultural Teaching'],
    bio: 'Preserving the sacred art of Navajo weaving and its spiritual significance.',
    image:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 32,
    followers: 1650,
    icon: Palette,
  },
  {
    id: 4,
    name: 'Sofia Rodriguez',
    role: 'Tango Instructor',
    culture: 'Argentine',
    location: 'Buenos Aires, Argentina',
    specialties: ['Tango Dance', 'Music History', 'Street Culture'],
    bio: 'Passionate tango instructor sharing the soul of Buenos Aires through dance.',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 27,
    followers: 1980,
    icon: Music,
  },
  {
    id: 5,
    name: "Aoife O'Connor",
    role: 'Folk Musician',
    culture: 'Irish',
    location: 'County Cork, Ireland',
    specialties: ['Traditional Music', 'Irish Language', 'Folk Stories'],
    bio: 'Keeping Irish folk traditions alive through music and storytelling.',
    image:
      'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 21,
    followers: 1420,
    icon: Music,
  },
  {
    id: 6,
    name: 'Maria Santos',
    role: 'Potter & Artist',
    culture: 'Zapotec',
    location: 'Oaxaca, Mexico',
    specialties: ['Traditional Pottery', 'Indigenous Art', 'Cultural Heritage'],
    bio: 'Master potter preserving ancient Zapotec techniques and cultural knowledge.',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 19,
    followers: 1120,
    icon: Palette,
  },
];

const communityStats = [
  { label: 'Active Members', value: '2,847', icon: Users },
  { label: 'Cultural Stories', value: '1,240', icon: BookOpen },
  { label: 'Languages Represented', value: '47', icon: Globe },
  { label: 'Monthly Exchanges', value: '156', icon: MessageCircle },
];

const upcomingEvents = [
  {
    id: 1,
    title: 'Global Storytelling Circle',
    date: '2025-08-12',
    time: '19:00 GMT',
    participants: 24,
    description: 'Monthly gathering where community members share stories from their cultures.',
    type: 'Virtual',
    culture: 'Multicultural',
  },
  {
    id: 2,
    title: 'Tea Ceremony Workshop',
    date: '2025-08-15',
    time: '14:00 GMT',
    participants: 18,
    description: 'Learn the meditative art of Japanese tea ceremony with Master Kenji.',
    type: 'Workshop',
    culture: 'Japanese',
  },
  {
    id: 3,
    title: 'Weaving Patterns & Stories',
    date: '2025-08-20',
    time: '18:00 GMT',
    participants: 15,
    description: 'Explore the sacred patterns in Navajo weaving with Master Weaver Maria.',
    type: 'Cultural Exchange',
    culture: 'Navajo',
  },
];

export default function CommunityContent() {
  // Live Nostr community stats removed; using static values only
  // removed unused selectedMember state (was placeholder)

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const memberId = target.getAttribute('data-member-id');
    const member = communityMembers.find((m) => m.id.toString() === memberId);
    if (member) target.src = member.fallback;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="section-padding bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container-width text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Global Cultural <span className="text-accent-400">Community</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8">
              Connect with cultural practitioners, storytellers, and learners from around the world.
              Share your heritage and discover new perspectives in our vibrant community.
            </p>
            <div className="flex items-center justify-center space-x-6 text-primary-200">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>Global Network</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Cultural Exchange</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                <span>Active Discussions</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="container-width">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {communityStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-primary-800 mb-2">{stat.value}</div>
                  <div className="text-gray-600 mb-1">{stat.label}</div>
                  {/* Live metrics removed */}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Meet Our Cultural Practitioners
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with passionate individuals sharing their cultural heritage and traditions.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {communityMembers.map((member, index) => {
              const Icon = member.icon;
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6 text-center hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative mb-4">
                    <Image
                      src={member.image}
                      alt={`Portrait of ${member.name}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      data-member-id={member.id}
                      onError={handleImageError}
                    />
                    <div className="absolute bottom-0 right-1/2 translate-x-6 translate-y-2 bg-white rounded-full p-2 shadow-lg">
                      <Icon className="w-4 h-4 text-accent-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-accent-600 font-medium mb-2">{member.role}</p>
                  <div className="flex items-center justify-center text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>
                      {member.culture} • {member.location}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">{member.bio}</p>
                  <div className="flex flex-wrap gap-1 justify-center mb-4">
                    {member.specialties.slice(0, 2).map((spec, i) => (
                      <span
                        key={i}
                        className="text-xs bg-accent-50 text-accent-700 px-2 py-1 rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>{member.contributions} contributions</span>
                    <span>{member.followers} followers</span>
                  </div>
                  <div className="flex justify-center">
                    <Link
                      href={`/community/members/${member.id}`}
                      className="btn-primary"
                      aria-label={`View profile and connect with ${member.name}`}
                    >
                      Connect
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Upcoming Community Events
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join our regular community gatherings and cultural exchange sessions.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-accent-600 bg-accent-50 px-3 py-1 rounded-full">
                    {event.type}
                  </span>
                  <span className="text-sm text-gray-600">{event.culture}</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-primary-800 mb-3">
                  {event.title}
                </h3>
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {event.date} at {event.time}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{event.participants} participants</span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">{event.description}</p>
                <div className="flex justify-center">
                  <Link
                    href={`/community/events/${event.id}`}
                    className="btn-outline"
                    aria-label={`View details and join event: ${event.title}`}
                  >
                    Join Event
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="section-padding bg-accent-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="container-width text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Join Our Global Cultural Family
            </h2>
            <p className="text-xl text-accent-100 mb-8 leading-relaxed">
              Become part of a vibrant community where cultural exchange happens every day. Share
              your stories, learn from others, and help build bridges between cultures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/community"
                className="btn-white"
                aria-label="View the community overview"
              >
                Community Overview
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/exchange"
                className="btn-outline-white"
                aria-label="Explore cultural exchange programs"
              >
                Explore Exchange
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
