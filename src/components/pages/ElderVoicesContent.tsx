'use client';

import React, { useState } from 'react';
import Image from 'next/image';
// Removed blur import - using placeholder
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Heart,
  Clock,
  MapPin,
  User,
  Quote,
  Headphones,
  ArrowRight,
} from 'lucide-react';
import StarRating from '../primitives/StarRating';
import { elderStories } from '../../data/elderStories';

const categories = [
  'All Stories',
  'Spiritual Wisdom',
  'Philosophy',
  'Traditional Arts',
  'Music & Dance',
  'Folk Traditions',
];

export default function ElderVoicesContent() {
  const [selectedCategory, setSelectedCategory] = useState('All Stories');
  const [playingId, setPlayingId] = useState<number | null>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const storyId = target.getAttribute('data-story-id');
    const story = elderStories.find((s) => s.id.toString() === storyId);
    if (story) {
      target.src = story.fallback;
    }
  };

  const filteredStories =
    selectedCategory === 'All Stories'
      ? elderStories
      : elderStories.filter((story) => story.category === selectedCategory);

  const featuredStories = elderStories.filter((story) => story.featured);

  const handlePlayToggle = (id: number) => {
    setPlayingId(playingId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary-900 to-primary-800 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container-width text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Elder <span className="text-accent-400">Voices</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8">
              Listen to the wisdom of cultural elders sharing stories, traditions, and life lessons
              that have been passed down through generations.
            </p>
            <div className="flex items-center justify-center space-x-6 text-primary-200">
              <div className="flex items-center">
                <Headphones className="w-5 h-5 mr-2" />
                <span>Audio Stories</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Elder Wisdom</span>
              </div>
              <div className="flex items-center">
                <Quote className="w-5 h-5 mr-2" />
                <span>Authentic Voices</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Featured Elder Stories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Listen to these exceptional stories from cultural elders around the world.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {featuredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="lg:flex">
                  <div className="lg:w-1/2">
                    <div className="relative h-64 lg:h-full">
                      <Image
                        src={story.image}
                        alt={`${story.elder} sharing ${story.title}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                        data-story-id={story.id}
                        onError={handleImageError}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        priority={index < 2}
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <button
                          onClick={() => handlePlayToggle(story.id)}
                          className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200"
                        >
                          {playingId === story.id ? (
                            <Pause className="w-8 h-8 text-primary-800" />
                          ) : (
                            <Play className="w-8 h-8 text-primary-800 ml-1" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-1/2 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-accent-600 bg-accent-50 px-3 py-1 rounded-full">
                        {story.category}
                      </span>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{story.duration}</span>
                      </div>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-serif font-bold text-primary-800 mb-3">
                      {story.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <User className="w-4 h-4 mr-1" />
                      <span className="mr-4">
                        {story.elder}, {story.age}
                      </span>
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{story.location}</span>
                    </div>
                    <div className="bg-gray-50 border-l-4 border-accent-400 pl-4 py-2 mb-4 italic text-gray-700">
                      &ldquo;{story.quote}&rdquo;
                    </div>
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                      {story.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <StarRating value={story.rating} label="Story rating" />
                        <span className="ml-2 text-sm text-gray-600">
                          {story.rating.toFixed(1)} ({story.listens.toLocaleString()} listens)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-6 bg-gray-100 border-y border-gray-200">
        <div className="container-width">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category
                    ? 'bg-primary-800 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* All Stories */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              All Elder Stories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore the complete collection of wisdom from cultural elders worldwide.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <Image
                    src={story.image}
                    alt={`${story.elder} sharing ${story.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
                    className="object-cover"
                    data-story-id={story.id}
                    onError={handleImageError}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <button
                      onClick={() => handlePlayToggle(story.id)}
                      className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200"
                    >
                      {playingId === story.id ? (
                        <Pause className="w-6 h-6 text-primary-800" />
                      ) : (
                        <Play className="w-6 h-6 text-primary-800 ml-0.5" />
                      )}
                    </button>
                  </div>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-primary-800">
                    {story.category}
                  </div>
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-white">
                    {story.duration}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-serif font-bold text-primary-800 mb-2">
                    {story.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <User className="w-4 h-4 mr-1" />
                    <span className="mr-4">
                      {story.elder}, {story.age}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>
                      {story.culture} • {story.location}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed line-clamp-2">
                    {story.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <StarRating value={story.rating} label="Story rating" />
                      <span className="ml-2 text-sm text-gray-600" aria-hidden="true">
                        {story.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      {story.listens.toLocaleString()} listens
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
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
            className="container-width text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Share Your Elder&apos;s Wisdom
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Do you know an elder with stories to share? Help us preserve their wisdom for future
              generations through the Elder Voices program.
            </p>
            <div className="flex justify-center">
              <Link
                href="/elder-voices/submit"
                className="btn-accent"
                aria-label="Record and submit an elder story"
              >
                Record an Elder Story
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
