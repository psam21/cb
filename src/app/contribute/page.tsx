'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Mic, 
  Camera, 
  FileText, 
  Image, 
  Video,
  CheckCircle,
  Globe,
  Shield,
  Heart,
  ArrowRight,
  Plus,
  X
} from 'lucide-react';

const contributionTypes = [
  {
    icon: FileText,
    title: 'Cultural Stories',
    description: 'Share the stories that make your culture unique - from ancient tales to modern traditions.',
    examples: ['Storytelling traditions', 'Family recipes', 'Cultural celebrations', 'Community wisdom'],
  },
  {
    icon: Mic,
    title: 'Audio Stories',
    description: 'Record voices, music, and sounds that capture the essence of your cultural heritage.',
    examples: ['Traditional songs', 'Elder stories', 'Language lessons', 'Cultural music'],
  },
  {
    icon: Video,
    title: 'Visual Stories',
    description: 'Show your culture in action through demonstrations, performances, and daily life.',
    examples: ['Craft techniques', 'Dance traditions', 'Cooking methods', 'Cultural practices'],
  },
  {
    icon: Image,
    title: 'Cultural Art',
    description: 'Share the visual beauty of your culture through traditional and contemporary art.',
    examples: ['Traditional crafts', 'Cultural symbols', 'Community photos', 'Artistic expressions'],
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

export default function ContributePage() {
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
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      // Show success message or redirect
    }, 3000);
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
              Share Your <span className="text-white">Cultural Story</span>
            </h1>
            <p className="text-xl md:text-2xl text-accent-50 leading-relaxed mb-8">
              Your culture has stories that can inspire and teach others. Share them with the world 
              and help build bridges of understanding between diverse communities.
            </p>
            <div className="flex items-center justify-center space-x-6 text-accent-100">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span>Authentic Stories</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>Global Reach</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Cultural Exchange</span>
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
              How Would You Like to Share?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every culture has unique ways of sharing knowledge. Choose the format that best captures your story.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contributionTypes.map((type, index) => {
              const Icon = type.icon;
              const isSelected = selectedType === index;
              return (
                <motion.div
                  key={type.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`card p-6 cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'border-2 border-accent-400 bg-accent-50 shadow-lg' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedType(index)}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isSelected 
                      ? 'bg-accent-400 text-white' 
                      : 'bg-primary-100 text-primary-800'
                  }`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-3 text-center">
                    {type.title}
                  </h3>
                  <p className="text-gray-700 text-center mb-4">
                    {type.description}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 text-center">Examples:</p>
                    {type.examples.map((example) => (
                      <p key={example} className="text-sm text-gray-500 text-center">
                        • {example}
                      </p>
                    ))}
                  </div>
                  {isSelected && (
                    <div className="mt-4 text-center">
                      <CheckCircle className="w-6 h-6 text-accent-600 mx-auto" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upload Form */}
      {selectedType !== null && (
        <section className="section-padding bg-primary-50">
          <div className="container-width">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-serif font-bold text-primary-800 mb-6">
                  Share Your {contributionTypes[selectedType].title}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* File Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-accent-400 transition-colors duration-300">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drag and drop your files here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported formats: JPG, PNG, MP3, MP4, PDF, TXT
                    </p>
                    <button 
                      type="button"
                      className="btn-primary"
                    >
                      Choose Files
                      <Upload className="w-5 h-5 ml-2" />
                    </button>
                  </div>

                  {/* Title and Description */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
                        placeholder="Give your contribution a meaningful title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <input
                        type="text"
                        value={formData.language}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
                        placeholder="e.g., Quechua, English, Mandarin"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
                      placeholder="Describe your contribution and its significance"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cultural Context *
                    </label>
                    <textarea
                      value={formData.culturalContext}
                      onChange={(e) => setFormData({...formData, culturalContext: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
                      placeholder="Explain the cultural significance, traditions, or historical context"
                      required
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center px-3 py-1 bg-accent-100 text-accent-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 hover:text-accent-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-accent-400"
                        placeholder="Add tags (e.g., music, ceremony, traditional)"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-accent-600 text-white rounded-r-lg hover:bg-accent-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Permissions *
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="permissions"
                          value="public"
                          checked={formData.permissions === 'public'}
                          onChange={(e) => setFormData({...formData, permissions: e.target.value})}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">Public Access</p>
                          <p className="text-sm text-gray-600">Anyone can view and learn from this content</p>
                        </div>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="permissions"
                          value="community"
                          checked={formData.permissions === 'community'}
                          onChange={(e) => setFormData({...formData, permissions: e.target.value})}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">Community Only</p>
                          <p className="text-sm text-gray-600">Only members of your cultural community can access</p>
                        </div>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="permissions"
                          value="restricted"
                          checked={formData.permissions === 'restricted'}
                          onChange={(e) => setFormData({...formData, permissions: e.target.value})}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">Restricted</p>
                          <p className="text-sm text-gray-600">Sacred or sensitive content with limited access</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSelectedType(null)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      ← Back to Content Types
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="btn-primary"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Publishing to Nostr...
                        </>
                      ) : (
                        <>
                          Publish to Nostr
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
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
              Our simple process ensures your cultural heritage is preserved with respect and permanence.
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
                <h3 className="text-lg font-serif font-bold text-primary-800 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-primary-800 text-white">
        <div className="container-width text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Ready to Share Your Heritage?
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Join thousands of community members who are actively preserving their cultural 
              heritage for future generations. Your story matters.
            </p>
            <button
              onClick={() => !selectedType && setSelectedType(0)}
              className="btn-accent"
            >
              Start Contributing Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
