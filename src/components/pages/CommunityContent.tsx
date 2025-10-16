'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  MessageCircle,
  Heart,
  Calendar,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { communityMembers, communityStats, upcomingEvents } from '@/data/community';

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
