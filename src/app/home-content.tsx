'use client';
import React from 'react';
import Image from 'next/image';
// Removed blur import - using placeholder
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, ImageIcon as ImageIconLucide, BookOpen } from 'lucide-react';
import {
  statMetrics as stats,
  featureList as features,
} from '../data/home';
import StatBlock from '../components/primitives/StatBlock';
import { useExploreHeritage } from '@/hooks/useExploreHeritage';

export default function HomeContent() {
  // Fetch latest 3 heritage contributions for home page
  const { heritageItems, isLoading, error } = useExploreHeritage();
  
  // Get latest 3 items (not featured, just latest)
  const latestContributions = heritageItems.slice(0, 3);
  
  return (
    <div className="min-h-screen">
      {/* Stats Section (refactored with primitives) */}
      <section className="section-padding bg-primary-50 pt-20">
        <div className="container-width">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, idx) => (
              <StatBlock
                key={s.label}
                icon={s.icon}
                value={s.value}
                label={s.label}
                delay={idx * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Hero Section - Centered and Moved Up */}
      <section className="hero-section bg-pattern flex items-center justify-center min-h-[70vh] pt-8 relative">
        <div className="container-width text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container-width"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-primary-800 mb-6">
              Preserve Heritage, <span className="text-gradient">Empower Communities</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              A platform that empowers indigenous and minority communities to permanently preserve
              their cultural practices, languages, and traditions — built on Nostr.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                href="/explore"
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center"
              >
                Explore Cultures
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/contribute"
                className="btn-outline text-lg px-8 py-4 flex items-center justify-center"
              >
                Share Your Heritage
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>

      </section>

      {/* Mission Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <div className="container-width text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-6">
                Breaking Down Barriers to Cultural Preservation
              </h2>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                For too long, cultural preservation has been controlled by institutions and
                corporations. Culture Bridge returns this power to communities themselves, using
                decentralized technology to ensure traditions survive and thrive.
              </p>
              <div className="grid grid-cols-2 gap-8 mt-8 container-width">
                {features.map((feature) => {
                  const Icon = feature.icon as React.ComponentType<{ className?: string }>;
                  return (
                    <div
                      key={feature.title}
                      className="flex flex-col items-center text-center space-y-4 p-6"
                    >
                      <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-8 h-8 text-primary-800" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary-800 mb-3 text-lg">{feature.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Cultures */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Explore Living Cultures
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the rich tapestry of human heritage through stories, languages, and
              traditions shared by communities worldwide.
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-12 text-gray-600">
              <p>Unable to load contributions. Please try again later.</p>
            </div>
          )}

          {/* Content - Show latest 3 contributions */}
          {!isLoading && !error && latestContributions.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {latestContributions.map((item, index) => (
                  <Link
                    key={item.id}
                    href={`/heritage/${item.dTag}`}
                    className="block"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="culture-card group cursor-pointer"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={item.image}
                          alt={`Cultural scene representing ${item.name}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={index < 2}
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
                              <ImageIconLucide className="w-4 h-4 mr-1" />
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

                        <span className="text-primary-800 font-medium group-hover:text-accent-600 transition-colors duration-200 flex items-center w-full justify-center py-2">
                          Explore Culture
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link href="/explore" className="btn-secondary">
                  View All Cultures
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </>
          )}

          {/* Empty State - Show if no contributions */}
          {!isLoading && !error && latestContributions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">No contributions yet. Be the first to share your culture!</p>
              <Link href="/contribute" className="btn-primary">
                Contribute Heritage
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        <div className="container-width text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container-width"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Your Culture Matters. Your Story Deserves to Be Preserved.
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Join thousands of community members who are actively preserving their heritage for
              future generations through our platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/contribute" className="btn-accent">
                Start Contributing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/about" className="btn-outline-white">
                Learn More
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Elder Quote */}
      <section className="section-padding bg-accent-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="container-width text-center"
          >
            <div className="mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 border-4 border-accent-200">
                <Image
                  src="https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=200&h=200&fit=crop&crop=face"
                  alt="Portrait of Elder María Santos smiling"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              </div>
              <blockquote className="text-2xl md:text-3xl font-serif text-primary-800 italic leading-relaxed">
                “When an elder dies, a library burns to the ground. Culture Bridge ensures our
                stories live forever, in our own voices, for our own people.”
              </blockquote>
            </div>
            <footer className="text-gray-600">
              <cite className="font-medium text-primary-800">María Santos</cite>
              <span className="block text-sm">Quechua Elder & Textile Master, Peru</span>
            </footer>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
