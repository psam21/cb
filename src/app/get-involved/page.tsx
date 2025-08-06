'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Users, 
  BookOpen, 
  Mic,
  Camera,
  Code,
  Globe,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Star,
  Award,
  Clock,
  UserPlus
} from 'lucide-react';

const involvementTypes = [
  {
    icon: BookOpen,
    title: 'Cultural Storyteller',
    description: 'Share your cultural heritage, traditions, and family stories with the global community.',
    commitment: '2-4 hours/month',
    skills: 'Cultural knowledge, storytelling passion',
    impact: 'Preserve traditions for future generations',
    examples: ['Record family recipes', 'Share traditional ceremonies', 'Document local customs'],
    difficulty: 'Beginner',
    volunteers: 847
  },
  {
    icon: Users,
    title: 'Community Ambassador',
    description: 'Help connect your local community with global cultural exchange opportunities.',
    commitment: '4-6 hours/month',
    skills: 'Community organizing, communication',
    impact: 'Bridge local and global cultural connections',
    examples: ['Organize local events', 'Connect elders with platform', 'Facilitate cultural exchanges'],
    difficulty: 'Intermediate',
    volunteers: 234
  },
  {
    icon: Mic,
    title: 'Elder Interviewer',
    description: 'Record wisdom and stories from cultural elders in your community.',
    commitment: '3-5 hours/month',
    skills: 'Interviewing, audio recording basics',
    impact: 'Capture irreplaceable elder wisdom',
    examples: ['Interview community elders', 'Record traditional songs', 'Document cultural practices'],
    difficulty: 'Intermediate',
    volunteers: 156
  },
  {
    icon: Camera,
    title: 'Cultural Documentarian',
    description: 'Create visual documentation of cultural practices, crafts, and ceremonies.',
    commitment: '5-8 hours/month',
    skills: 'Photography/videography, cultural sensitivity',
    impact: 'Create visual archives of living culture',
    examples: ['Film traditional crafts', 'Photograph ceremonies', 'Document cultural sites'],
    difficulty: 'Advanced',
    volunteers: 89
  },
  {
    icon: Code,
    title: 'Platform Developer',
    description: 'Contribute to Culture Bridge\'s open-source codebase and Nostr implementation.',
    commitment: '6-10 hours/month',
    skills: 'Programming, web development, blockchain',
    impact: 'Build tools for global cultural preservation',
    examples: ['Improve user interface', 'Develop new features', 'Enhance accessibility'],
    difficulty: 'Advanced',
    volunteers: 67
  },
  {
    icon: Globe,
    title: 'Translation Volunteer',
    description: 'Help make cultural content accessible across language barriers.',
    commitment: '2-4 hours/month',
    skills: 'Multilingual abilities, cultural sensitivity',
    impact: 'Break down language barriers for cultural exchange',
    examples: ['Translate stories', 'Subtitle videos', 'Localize interface'],
    difficulty: 'Beginner',
    volunteers: 312
  }
];

const supportLevels = [
  {
    title: 'Cultural Supporter',
    amount: '$5/month',
    description: 'Help cover basic platform costs and keep cultural stories freely accessible.',
    benefits: [
      'Support global cultural preservation',
      'Keep platform ad-free',
      'Enable free access for all communities',
      'Monthly impact updates'
    ],
    popular: false
  },
  {
    title: 'Heritage Guardian',
    amount: '$15/month',
    description: 'Fund community outreach and elder recording programs in underserved areas.',
    benefits: [
      'All Cultural Supporter benefits',
      'Fund elder interview programs',
      'Support community ambassadors',
      'Quarterly detailed reports',
      'Early access to new features'
    ],
    popular: true
  },
  {
    title: 'Culture Champion',
    amount: '$50/month',
    description: 'Enable major cultural documentation projects and platform development.',
    benefits: [
      'All Heritage Guardian benefits',
      'Fund major documentation projects',
      'Support technical infrastructure',
      'Direct communication with team',
      'Influence platform roadmap',
      'Special recognition in community'
    ],
    popular: false
  }
];

const volunteerStories = [
  {
    name: 'Maria Elena Gutierrez',
    role: 'Elder Interviewer',
    location: 'Guatemala',
    story: 'I\'ve recorded over 30 hours of Mayan elder stories in the past year. Seeing grandchildren connect with their heritage through these recordings brings me incredible joy.',
    impact: '30+ hours recorded, 15 elders interviewed',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg=='
  },
  {
    name: 'Kenji Takahashi',
    role: 'Platform Developer',
    location: 'Tokyo, Japan',
    story: 'Contributing to Culture Bridge\'s Nostr integration has been incredibly rewarding. Knowing that my code helps preserve cultural heritage motivates me every day.',
    impact: '200+ commits, accessibility improvements',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg=='
  },
  {
    name: 'Amara Okafor',
    role: 'Community Ambassador',
    location: 'Lagos, Nigeria',
    story: 'I organize monthly cultural storytelling events in my community. We\'ve connected over 50 local storytellers with the global Culture Bridge network.',
    impact: '50+ storytellers connected, 12 events organized',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg=='
  }
];

export default function GetInvolvedPage() {
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedSupport, setSelectedSupport] = useState<number | null>(1);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const storyIndex = target.getAttribute('data-story-index');
    if (storyIndex) {
      const story = volunteerStories[parseInt(storyIndex)];
      if (story) {
        target.src = story.fallback;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-accent-600 to-accent-700 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Join the Cultural <span className="text-white">Bridge Movement</span>
            </h1>
            <p className="text-xl md:text-2xl text-accent-100 leading-relaxed mb-8">
              Help preserve and share the world's cultural heritage. Whether through time, 
              skills, or support, every contribution helps build bridges between cultures.
            </p>
            <div className="flex items-center justify-center space-x-6 text-accent-200">
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Make Impact</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>Join Community</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>Preserve Culture</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Volunteer Opportunities */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Volunteer Opportunities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find the perfect way to contribute your time and skills to global cultural preservation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {involvementTypes.map((type, index) => {
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
                      ? 'border-2 border-accent-400 bg-accent-50 shadow-lg transform scale-105' 
                      : 'hover:shadow-lg hover:transform hover:scale-102'
                  }`}
                  onClick={() => setSelectedType(isSelected ? null : index)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected 
                        ? 'bg-accent-600 text-white' 
                        : 'bg-primary-100 text-primary-800'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        type.difficulty === 'Beginner' ? 'text-green-600' :
                        type.difficulty === 'Intermediate' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {type.difficulty}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-3">
                    {type.title}
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    {type.description}
                  </p>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{type.commitment}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{type.volunteers} volunteers</span>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 border-t border-accent-200"
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">Skills Needed:</h4>
                          <p className="text-sm text-gray-600">{type.skills}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">Your Impact:</h4>
                          <p className="text-sm text-gray-600">{type.impact}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Examples:</h4>
                          <ul className="space-y-1">
                            {type.examples.map((example, idx) => (
                              <li key={idx} className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="w-3 h-3 mr-2 text-accent-600" />
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button className="w-full btn-primary mt-4">
                          Apply to Volunteer
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Support Cultural Preservation
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your financial support helps us maintain the platform, fund community programs, 
              and keep cultural stories freely accessible to all.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {supportLevels.map((level, index) => (
              <motion.div
                key={level.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`card p-6 text-center cursor-pointer transition-all duration-300 ${
                  selectedSupport === index
                    ? 'border-2 border-accent-400 bg-accent-50 shadow-lg transform scale-105'
                    : level.popular
                    ? 'border-2 border-primary-400 shadow-lg'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedSupport(index)}
              >
                {level.popular && (
                  <div className="bg-primary-800 text-white text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">
                  {level.title}
                </h3>
                <div className="text-3xl font-bold text-accent-600 mb-4">
                  {level.amount}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {level.description}
                </p>
                
                <ul className="space-y-2 mb-6">
                  {level.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 mr-2 text-accent-600 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full ${
                  selectedSupport === index ? 'btn-accent' : 'btn-outline'
                }`}>
                  Choose This Level
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Stories */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Stories from Our Community
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Meet the amazing volunteers who are making cultural preservation possible.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {volunteerStories.map((story, index) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="card p-6 text-center"
              >
                <img
                  src={story.image}
                  alt={story.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  data-story-index={index}
                  onError={handleImageError}
                />
                
                <h3 className="text-xl font-serif font-bold text-primary-800 mb-1">
                  {story.name}
                </h3>
                <p className="text-accent-600 font-medium mb-2">
                  {story.role}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  {story.location}
                </p>
                
                <blockquote className="bg-gray-50 border-l-4 border-accent-400 pl-4 py-3 mb-4 italic text-gray-700 text-sm leading-relaxed">
                  "{story.story}"
                </blockquote>
                
                <div className="bg-accent-50 rounded-lg p-3">
                  <div className="text-sm font-semibold text-accent-800 mb-1">Impact</div>
                  <div className="text-sm text-accent-700">{story.impact}</div>
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
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Your Culture Matters. Your Contribution Counts.
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Every story shared, every hour volunteered, and every dollar donated 
              helps preserve the beautiful diversity of human culture for future generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-accent">
                Start Volunteering Today
                <UserPlus className="w-5 h-5 ml-2" />
              </button>
              <button className="btn-outline-white">
                Support Our Mission
                <Heart className="w-5 h-5 ml-2" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
