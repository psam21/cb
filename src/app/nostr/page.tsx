'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Key, 
  Network, 
  Users,
  Globe,
  Lock,
  Unlock,
  Server,
  ArrowRight,
  CheckCircle,
  Zap,
  Database,
  Eye,
  EyeOff
} from 'lucide-react';

const nostrBenefits = [
  {
    icon: Shield,
    title: 'Censorship Resistance',
    description: 'Your cultural stories cannot be deleted, modified, or suppressed by any central authority.',
    detail: 'Stories are distributed across multiple relays, ensuring permanent preservation.'
  },
  {
    icon: Key,
    title: 'True Ownership',
    description: 'You own your cultural identity and content through cryptographic keys.',
    detail: 'Only you control what you share and how your cultural heritage is presented.'
  },
  {
    icon: Network,
    title: 'Global Distribution',
    description: 'Cultural stories are replicated worldwide, ensuring they survive any single point of failure.',
    detail: 'Your heritage becomes part of a global, resilient network of human knowledge.'
  },
  {
    icon: Users,
    title: 'Community Control',
    description: 'Communities collectively maintain their cultural narratives without external interference.',
    detail: 'Cultural sovereignty is preserved through decentralized governance and storage.'
  }
];

const technicalFeatures = [
  {
    title: 'Decentralized Identity',
    description: 'Each cultural practitioner has a unique cryptographic identity',
    icon: Key,
    benefits: [
      'Verifiable authenticity',
      'Cross-platform recognition',
      'Self-sovereign identity',
      'No platform dependency'
    ]
  },
  {
    title: 'Relay Network',
    description: 'Cultural stories are distributed across multiple global servers',
    icon: Server,
    benefits: [
      'Redundant storage',
      'Global accessibility',
      'Fault tolerance',
      'Community-run infrastructure'
    ]
  },
  {
    title: 'Event Signing',
    description: 'Every cultural story is cryptographically signed for authenticity',
    icon: Shield,
    benefits: [
      'Tamper-proof content',
      'Verified authorship',
      'Historical integrity',
      'Trust without intermediaries'
    ]
  },
  {
    title: 'Open Protocol',
    description: 'Culture Bridge is built on open standards anyone can implement',
    icon: Globe,
    benefits: [
      'No vendor lock-in',
      'Interoperable systems',
      'Innovation friendly',
      'Community-driven development'
    ]
  }
];

const culturalExamples = [
  {
    title: 'Andean Oral Traditions',
    challenge: 'Mountain communities risk losing ancient stories to urbanization',
    solution: 'Stories preserved permanently on Nostr, accessible to future generations globally',
    impact: 'Quechua storytelling traditions become part of humanity\'s permanent record'
  },
  {
    title: 'Japanese Tea Ceremony',
    challenge: 'Traditional knowledge concentrated in few masters and institutions',
    solution: 'Detailed ceremony instructions and philosophy distributed across many relays',
    impact: 'Tea ceremony wisdom becomes globally accessible and preservation-guaranteed'
  },
  {
    title: 'Navajo Weaving Patterns',
    challenge: 'Sacred patterns vulnerable to cultural appropriation and misrepresentation',
    solution: 'Authentic patterns shared directly by Navajo weavers with verified authorship',
    impact: 'Cultural sovereignty maintained while enabling respectful sharing'
  }
];

export default function NostrPage() {
  const [expandedExample, setExpandedExample] = useState<number | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary-900 to-primary-800 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Powered by <span className="text-accent-400">Nostr Protocol</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8">
              Culture Bridge uses decentralized technology to ensure your cultural stories 
              are preserved forever, owned by communities, and free from censorship.
            </p>
            <div className="flex items-center justify-center space-x-6 text-primary-200">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span>Censorship Resistant</span>
              </div>
              <div className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                <span>Community Owned</span>
              </div>
              <div className="flex items-center">
                <Network className="w-5 h-5 mr-2" />
                <span>Globally Distributed</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Decentralization Matters */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Why Cultural Stories Need Decentralization
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Traditional platforms can disappear, be censored, or change ownership. 
              Decentralized storage ensures cultural heritage survives any institutional changes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {nostrBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="card p-8"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-primary-800 mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {benefit.description}
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    {benefit.detail}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cultural Examples */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Real Cultural Impact
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how decentralized storage solves real challenges facing cultural communities.
            </p>
          </motion.div>

          <div className="space-y-6">
            {culturalExamples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card overflow-hidden"
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedExample(expandedExample === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-serif font-bold text-primary-800">
                      {example.title}
                    </h3>
                    <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                      {expandedExample === index ? (
                        <EyeOff className="w-4 h-4 text-accent-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-accent-600" />
                      )}
                    </div>
                  </div>
                </div>
                
                {expandedExample === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-6"
                  >
                    <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                      <div>
                        <h4 className="font-semibold text-red-700 mb-2">Challenge</h4>
                        <p className="text-sm text-gray-700">{example.challenge}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2">Nostr Solution</h4>
                        <p className="text-sm text-gray-700">{example.solution}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">Cultural Impact</h4>
                        <p className="text-sm text-gray-700">{example.impact}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Features Toggle */}
      <section className="py-8 bg-white border-y border-gray-200">
        <div className="container-width text-center">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="btn-outline inline-flex items-center"
          >
            {showTechnical ? (
              <>
                <EyeOff className="w-5 h-5 mr-2" />
                Hide Technical Details
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 mr-2" />
                Show Technical Details
              </>
            )}
          </button>
        </div>
      </section>

      {/* Technical Features */}
      {showTechnical && (
        <section className="section-padding bg-white">
          <div className="container-width">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
                How Nostr Works for Culture Bridge
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Understanding the technical foundation that makes cultural preservation possible.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {technicalFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="card p-6"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-800 to-accent-600 rounded-lg flex items-center justify-center mr-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-bold text-primary-800">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 mr-2 text-accent-600" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="section-padding bg-primary-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Simple for Users, Powerful for Communities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              You don't need to understand the technology to benefit from it. 
              Culture Bridge makes decentralization invisible and intuitive.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-primary-800 mb-4">
                Share Your Story
              </h3>
              <p className="text-gray-700">
                Upload cultural content just like any other platform. 
                The decentralized magic happens automatically behind the scenes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-primary-800 mb-4">
                Global Distribution
              </h3>
              <p className="text-gray-700">
                Your story is automatically replicated across multiple relays worldwide, 
                ensuring it can never be lost or censored.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-primary-800 mb-4">
                Forever Accessible
              </h3>
              <p className="text-gray-700">
                Your cultural heritage becomes part of humanity's permanent record, 
                accessible to future generations regardless of platform changes.
              </p>
            </motion.div>
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
              Preserve Your Culture Forever
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Join the decentralized cultural revolution. Your stories deserve permanent preservation 
              and community ownership, not corporate control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-accent">
                Start Sharing Stories
              </button>
              <button className="btn-outline-white">
                Learn About Nostr
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
