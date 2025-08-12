'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield,
  Key,
  Network,
  Users,
  Globe,
  Server,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

const nostrBenefits = [
  {
    icon: Shield,
    title: 'Censorship Resistance',
    description:
      'Your cultural stories cannot be deleted, modified, or suppressed by any central authority.',
    detail: 'Stories are distributed across multiple relays, ensuring permanent preservation.',
  },
  {
    icon: Key,
    title: 'True Ownership',
    description: 'You own your cultural identity and content through cryptographic keys.',
    detail: 'Only you control what you share and how your cultural heritage is presented.',
  },
  {
    icon: Network,
    title: 'Global Distribution',
    description:
      'Cultural stories are replicated worldwide, ensuring they survive any single point of failure.',
    detail: 'Your heritage becomes part of a global, resilient network of human knowledge.',
  },
  {
    icon: Users,
    title: 'Community Control',
    description:
      'Communities collectively maintain their cultural narratives without external interference.',
    detail: 'Cultural sovereignty is preserved through decentralized governance and storage.',
  },
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
      'No platform dependency',
    ],
  },
  {
    title: 'Relay Network',
    description: 'Cultural stories are distributed across multiple global servers',
    icon: Server,
    benefits: [
      'Redundant storage',
      'Global accessibility',
      'Fault tolerance',
      'Community-run infrastructure',
    ],
  },
  {
    title: 'Event Signing',
    description: 'Every cultural story is cryptographically signed for authenticity',
    icon: Shield,
    benefits: [
      'Tamper-proof content',
      'Verified authorship',
      'Historical integrity',
      'Trust without intermediaries',
    ],
  },
  {
    title: 'Open Protocol',
    description: 'Culture Bridge is built on open standards anyone can implement',
    icon: Globe,
    benefits: [
      'No vendor lock-in',
      'Interoperable systems',
      'Innovation friendly',
      'Community-driven development',
    ],
  },
];

const culturalExamples = [
  {
    title: 'Andean Oral Traditions',
    challenge: 'Mountain communities risk losing ancient stories to urbanization',
    solution: 'Stories preserved permanently on Nostr, accessible to future generations globally',
    impact: "Quechua storytelling traditions become part of humanity's permanent record",
  },
  {
    title: 'Japanese Tea Ceremony',
    challenge: 'Traditional knowledge concentrated in few masters and institutions',
    solution: 'Detailed ceremony instructions and philosophy distributed across many relays',
    impact: 'Tea ceremony wisdom becomes globally accessible and preservation-guaranteed',
  },
  {
    title: 'Navajo Weaving Patterns',
    challenge: 'Sacred patterns vulnerable to cultural appropriation and misrepresentation',
    solution: 'Authentic patterns shared directly by Navajo weavers with verified authorship',
    impact: 'Cultural sovereignty maintained while enabling respectful sharing',
  },
];

export default function NostrContent() {
  const [expandedExample, setExpandedExample] = useState<number | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
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
              Culture Bridge uses decentralized technology to ensure your cultural stories are
              preserved forever, owned by communities, and free from censorship.
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

      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Why Nostr Matters for Cultural Preservation
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Traditional centralized platforms can delete, manipulate, or lose cultural content.
              Nostr ensures cultural knowledge lives beyond platforms, companies, and regimes.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {nostrBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-800 to-accent-600 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-primary-800 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-700 text-sm mb-2">{benefit.description}</p>
                  <p className="text-xs text-gray-500">{benefit.detail}</p>
                </motion.div>
              );
            })}
          </div>
          <div className="text-center">
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="btn-outline inline-flex items-center"
              aria-expanded={showTechnical}
              aria-controls="technical-features"
            >
              {showTechnical ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {showTechnical ? 'Hide Technical Details' : 'Show Technical Details'}
            </button>
          </div>
          {showTechnical && (
            <motion.div
              id="technical-features"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-12"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {technicalFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-primary-50 rounded-xl p-6"
                    >
                      <div className="flex items-center mb-4">
                        <Icon className="w-5 h-5 text-primary-700 mr-2" />
                        <h3 className="font-serif font-semibold text-primary-800">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{feature.description}</p>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {feature.benefits.map((b) => (
                          <li key={b} className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-accent-600" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
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
              Real Cultural Use Cases
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              How decentralized preservation directly protects living culture.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {culturalExamples.map((ex, index) => (
              <motion.div
                key={ex.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`card p-6 relative cursor-pointer ${expandedExample === index ? 'ring-2 ring-accent-500' : ''}`}
                onClick={() => setExpandedExample(expandedExample === index ? null : index)}
                aria-expanded={expandedExample === index}
              >
                <h3 className="text-xl font-serif font-bold text-primary-800 mb-3">{ex.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Challenge:</span> {ex.challenge}
                </p>
                {expandedExample === index && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2 text-sm text-gray-600"
                  >
                    <p>
                      <span className="font-semibold">Solution:</span> {ex.solution}
                    </p>
                    <p>
                      <span className="font-semibold">Impact:</span> {ex.impact}
                    </p>
                  </motion.div>
                )}
                <div className="mt-4 text-sm text-accent-600 font-medium flex items-center">
                  {expandedExample === index ? 'Click to collapse' : 'Click to expand'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-primary-800 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Own Your Cultural Narrative
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Join Culture Bridge and start publishing cultural stories with cryptographic
              authenticity and global permanence.
            </p>
            <div className="flex justify-center">
              <Link
                href="/contribute"
                className="btn-accent"
                aria-label="Contribute cultural content"
              >
                Start Contributing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
