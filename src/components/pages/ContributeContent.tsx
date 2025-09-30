'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  FileText,
  Image as ImageIcon,
  Video,
  CheckCircle,
  Shield,
  Heart,
} from 'lucide-react';
import { HeritageContributionForm } from '@/components/heritage/HeritageContributionForm';

// Extracted from original page (trimmed for relocation). In a future refactor, move data to src/data.
const contributionTypes = [
  {
    icon: FileText,
    title: 'Cultural Stories',
    description:
      'Share the stories that make your culture unique - from ancient tales to modern traditions.',
    examples: [
      'Storytelling traditions',
      'Family recipes',
      'Cultural celebrations',
      'Community wisdom',
    ],
  },
  {
    icon: Mic,
    title: 'Audio Stories',
    description:
      'Record voices, music, and sounds that capture the essence of your cultural heritage.',
    examples: ['Traditional songs', 'Elder stories', 'Language lessons', 'Cultural music'],
  },
  {
    icon: Video,
    title: 'Visual Stories',
    description:
      'Show your culture in action through demonstrations, performances, and daily life.',
    examples: ['Craft techniques', 'Dance traditions', 'Cooking methods', 'Cultural practices'],
  },
  {
    icon: ImageIcon,
    title: 'Cultural Art',
    description:
      'Share the visual beauty of your culture through traditional and contemporary art.',
    examples: [
      'Traditional crafts',
      'Cultural symbols',
      'Community photos',
      'Artistic expressions',
    ],
  },
];

const uploadSteps = [
  {
    number: 1,
    title: 'Choose Your Story',
    description: 'Select the type of cultural story you want to share with the world.',
  },
  {
    number: 2,
    title: 'Add Cultural Context',
    description: 'Help others understand the significance and meaning behind your story.',
  },
  {
    number: 3,
    title: 'Share Respectfully',
    description: 'Set sharing preferences to honor your culture while building bridges.',
  },
  {
    number: 4,
    title: 'Connect Cultures',
    description: 'Your story joins the global tapestry of cultural exchange and understanding.',
  },
];

export default function ContributeContent() {
  const [selectedType, setSelectedType] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-accent-400 to-accent-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container-width text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Contribute Your <span className="text-white">Heritage</span>
            </h1>
            <p className="text-xl md:text-2xl text-accent-100 leading-relaxed mb-8">
              Help preserve your culture for future generations. Share stories, media, and wisdom
              with a global community dedicated to cultural continuity.
            </p>
            <div className="flex items-center justify-center space-x-6 text-accent-200">
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Preserve Heritage</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span>Respect Ownership</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Verify Authenticity</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contribution Types */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              What Can You Contribute?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select the type of cultural contribution you want to share. Each option supports
              meaningful preservation and respectful sharing.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contributionTypes.map((type, index) => {
              const Icon = type.icon;
              const active = selectedType === index;
              return (
                <motion.button
                  key={type.title}
                  type="button"
                  onClick={() => setSelectedType(index)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`p-6 rounded-xl border transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-accent-500 ${
                    active
                      ? 'bg-primary-800 text-white border-primary-700 shadow-lg'
                      : 'bg-white hover:shadow-md border-gray-200'
                  }`}
                  aria-pressed={active}
                >
                  <Icon
                    className={`w-8 h-8 mb-4 ${active ? 'text-accent-300' : 'text-primary-700'}`}
                  />
                  <h3 className="font-serif font-bold text-lg mb-2">{type.title}</h3>
                  <p
                    className={`text-sm mb-3 leading-relaxed ${active ? 'text-accent-100' : 'text-gray-600'}`}
                  >
                    {type.description}
                  </p>
                  <ul
                    className={`text-xs space-y-1 ${active ? 'text-accent-200' : 'text-gray-500'}`}
                  >
                    {type.examples.map((ex) => (
                      <li key={ex} className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2" /> {ex}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Heritage Contribution Form */}
      {selectedType !== null && (
        <section className="section-padding bg-gray-50">
          <div className="container-width">
            <HeritageContributionForm />
          </div>
        </section>
      )}

      {/* Process Steps */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our simple process ensures your cultural heritage is preserved with respect and
              permanence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {uploadSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-primary-800 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
