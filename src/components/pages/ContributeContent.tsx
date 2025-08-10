'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Mic,
  FileText,
  Image as ImageIcon,
  Video,
  CheckCircle,
  Shield,
  Heart,
  X,
} from 'lucide-react';

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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    culturalContext: '',
    permissions: 'community',
    tags: [] as string[],
    language: '',
    region: '',
  });
  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tagToRemove) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-accent-400 to-accent-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
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

      {/* Upload Form */}
      {selectedType !== null && (
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-20">
          <div className="container-width">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                Share Your {contributionTypes[selectedType].title}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">
                      Title
                    </label>
                    <input
                      id="title"
                      className="w-full rounded-md bg-primary-800 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-accent-400 px-4 py-2"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium mb-2">
                      Language
                    </label>
                    <input
                      id="language"
                      className="w-full rounded-md bg-primary-800 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-accent-400 px-4 py-2"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium mb-2">
                      Region / Community
                    </label>
                    <input
                      id="region"
                      className="w-full rounded-md bg-primary-800 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-accent-400 px-4 py-2"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="permissions" className="block text-sm font-medium mb-2">
                      Sharing Preference
                    </label>
                    <select
                      id="permissions"
                      className="w-full rounded-md bg-primary-800 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-accent-400 px-4 py-2"
                      value={formData.permissions}
                      onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                    >
                      <option value="community">Community (default)</option>
                      <option value="restricted">Restricted (permission required)</option>
                      <option value="public">Public (wide educational use)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    className="w-full rounded-md bg-primary-800 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-accent-400 px-4 py-2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="culturalContext" className="block text-sm font-medium mb-2">
                    Cultural Context
                  </label>
                  <textarea
                    id="culturalContext"
                    rows={4}
                    className="w-full rounded-md bg-primary-800 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-accent-400 px-4 py-2"
                    value={formData.culturalContext}
                    onChange={(e) => setFormData({ ...formData, culturalContext: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newTag" className="block text-sm font-medium mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      id="newTag"
                      className="flex-1 rounded-md bg-primary-800 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-accent-400 px-4 py-2"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag (e.g., language, craft)"
                      aria-describedby="tags-help"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-colors duration-200"
                    >
                      Add
                    </button>
                  </div>
                  <p id="tags-help" className="text-xs text-primary-200 mb-2">
                    Add descriptive tags to help others discover this contribution.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-primary-700 text-primary-100 rounded-full text-xs flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-accent-300"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="btn-accent inline-flex items-center px-6 py-3"
                  >
                    {isUploading ? 'Uploading…' : 'Submit Contribution'}
                    <Upload className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </form>
            </motion.div>
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
