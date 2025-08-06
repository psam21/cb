'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Play, 
  Volume2, 
  BookOpen, 
  Users, 
  Heart,
  Mic,
  Headphones,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const languages = [
  {
    id: 1,
    name: 'Quechua',
    nativeName: 'Runasimi',
    speakers: '8 million',
    region: 'Andes Mountains',
    description: 'Learn the ancient language of the Incas, still spoken by millions across Peru, Bolivia, and Ecuador.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5RdWVjaHVhPC90ZXh0Pjwvc3ZnPg==',
    lessons: 24,
    level: 'Beginner to Intermediate',
    features: ['Audio pronunciation', 'Cultural context', 'Elder recordings']
  },
  {
    id: 2,
    name: 'Irish Gaelic',
    nativeName: 'Gaeilge',
    speakers: '1.7 million',
    region: 'Ireland',
    description: 'Discover the Celtic language that carries centuries of Irish culture, music, and storytelling traditions.',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5HYWVpbGdlPC90ZXh0Pjwvc3ZnPg==',
    lessons: 18,
    level: 'All Levels',
    features: ['Traditional songs', 'Pub conversations', 'Poetry readings']
  },
  {
    id: 3,
    name: 'Japanese',
    nativeName: '日本語',
    speakers: '125 million',
    region: 'Japan',
    description: 'Learn Japanese through the lens of traditional origami, calligraphy, and cultural practices.',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij7ml6XmnKzoqp48L3RleHQ+PC9zdmc+',
    lessons: 32,
    level: 'Beginner to Advanced',
    features: ['Origami language', 'Calligraphy basics', 'Cultural etiquette']
  },
  {
    id: 4,
    name: 'Zapotec',
    nativeName: 'Diidxazá',
    speakers: '460,000',
    region: 'Oaxaca, Mexico',
    description: 'Connect with the indigenous language of Oaxacan pottery masters and weaving traditions.',
    image: 'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5EaWlkeGF6w6E8L3RleHQ+PC9zdmc+',
    lessons: 16,
    level: 'Beginner',
    features: ['Pottery vocabulary', 'Traditional ceremonies', 'Community stories']
  },
  {
    id: 5,
    name: 'Navajo',
    nativeName: 'Diné bizaad',
    speakers: '170,000',
    region: 'Southwest United States',
    description: 'Learn the sacred language of Navajo weaving traditions and connection to the land.',
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5EaW7DqSBiaXphYWQ8L3RleHQ+PC9zdmc+',
    lessons: 20,
    level: 'Beginner to Intermediate',
    features: ['Weaving terms', 'Land connection', 'Sacred stories']
  },
  {
    id: 6,
    name: 'Spanish (Tango)',
    nativeName: 'Español Rioplatense',
    speakers: '47 million',
    region: 'Buenos Aires, Argentina',
    description: 'Learn Argentine Spanish through the passionate language of tango and Buenos Aires street culture.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5Fc3Bhw7FvbDwvdGV4dD48L3N2Zz4=',
    lessons: 28,
    level: 'Intermediate to Advanced',
    features: ['Tango lyrics', 'Street expressions', 'Cultural history']
  }
];

const learningMethods = [
  {
    icon: Headphones,
    title: 'Listen & Learn',
    description: 'Immerse yourself in authentic recordings from native speakers and cultural practitioners.'
  },
  {
    icon: Mic,
    title: 'Speak with Purpose',
    description: 'Practice pronunciation with cultural context and meaningful conversations.'
  },
  {
    icon: BookOpen,
    title: 'Cultural Stories',
    description: 'Learn through traditional stories, songs, and cultural narratives.'
  },
  {
    icon: Users,
    title: 'Community Practice',
    description: 'Connect with native speakers and fellow learners from around the world.'
  }
];

export default function LanguagePage() {
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const languageId = target.getAttribute('data-language-id');
    const language = languages.find(l => l.id.toString() === languageId);
    if (language) {
      target.src = language.fallback;
    }
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
              Learn Languages Through <span className="text-white">Cultural Stories</span>
            </h1>
            <p className="text-xl md:text-2xl text-accent-50 leading-relaxed mb-8">
              Master languages by immersing yourself in authentic cultural practices. 
              Learn from masters, storytellers, artisans, and cultural keepers.
            </p>
            <div className="flex items-center justify-center space-x-6 text-accent-100">
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>6 Languages</span>
              </div>
              <div className="flex items-center">
                <Volume2 className="w-5 h-5 mr-2" />
                <span>Native Speakers</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Cultural Context</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Learning Methods */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              How We Teach Languages
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our approach connects language learning with cultural understanding, 
              making every lesson a bridge to new perspectives.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {learningMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6 text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-3">
                    {method.title}
                  </h3>
                  <p className="text-gray-700">
                    {method.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Language Selection */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Choose Your Cultural Language Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each language course is designed around authentic cultural practices and traditions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {languages.map((language, index) => (
              <motion.div
                key={language.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <img
                    src={language.image}
                    alt={`${language.name} cultural landscape`}
                    className="w-full h-full object-cover"
                    data-language-id={language.id}
                    onError={handleImageError}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-primary-800">
                    {language.level}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-serif font-bold text-primary-800">
                      {language.name}
                    </h3>
                    <span className="text-gray-600 font-medium">
                      {language.nativeName}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="mr-4">{language.speakers} speakers</span>
                    <Globe className="w-4 h-4 mr-1" />
                    <span>{language.region}</span>
                  </div>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {language.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    {language.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 mr-2 text-accent-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {language.lessons} lessons
                    </span>
                    <button className="btn-primary">
                      Start Learning
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
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
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Ready to Start Your Cultural Language Journey?
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Join thousands of learners who are discovering languages through the beauty of authentic cultural experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-accent">
                Browse All Languages
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="btn-outline-white">
                Learn More
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
