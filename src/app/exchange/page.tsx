'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Video, 
  Users, 
  Heart,
  Globe,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Star,
  CheckCircle,
  User
} from 'lucide-react';

const exchangePrograms = [
  {
    id: 1,
    title: 'Andean Storytelling Circle',
    host: 'Carlos Mamani',
    culture: 'Quechua',
    location: 'Virtual from Peru',
    description: 'Join master storyteller Carlos as he shares ancient tales of mountain spirits and teaches the art of oral tradition.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5TdG9yeXRlbGxpbmc8L3RleHQ+PC9zdmc+',
    nextSession: '2025-08-15',
    time: '19:00 GMT',
    participants: 24,
    maxParticipants: 30,
    type: 'Storytelling',
    level: 'All Levels',
    language: 'English & Quechua'
  },
  {
    id: 2,
    title: 'Aboriginal Dreamtime Stories',
    host: 'Margaret Williams',
    culture: 'Aboriginal Australian',
    location: 'Virtual from Alice Springs',
    description: 'Learn the ancient art of Dreamtime storytelling, discovering how Aboriginal Australians connect with ancestral wisdom and country.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5UZWEgQ2VyZW1vbnk8L3RleHQ+PC9zdmc+',
    nextSession: '2025-08-12',
    time: '14:00 GMT',
    participants: 18,
    maxParticipants: 20,
    type: 'Ceremony',
    level: 'Beginner',
    language: 'English & Japanese'
  },
  {
    id: 3,
    title: 'Navajo Weaving Workshop',
    host: 'Maria Begay',
    culture: 'Navajo',
    location: 'Virtual from Arizona',
    description: 'Discover the sacred patterns and stories woven into Navajo textiles, connecting with ancestral traditions.',
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5XZWF2aW5nPC90ZXh0Pjwvc3ZnPg==',
    nextSession: '2025-08-18',
    time: '18:00 GMT',
    participants: 15,
    maxParticipants: 25,
    type: 'Craft',
    level: 'Intermediate',
    language: 'English & Navajo'
  },
  {
    id: 4,
    title: 'Argentine Tango Stories',
    host: 'Sofia Rodriguez',
    culture: 'Argentine',
    location: 'Virtual from Buenos Aires',
    description: 'Feel the passion of Buenos Aires through tango, learning the dance that expresses the soul of the city.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5UYW5nbzwvdGV4dD48L3N2Zz4=',
    nextSession: '2025-08-20',
    time: '21:00 GMT',
    participants: 22,
    maxParticipants: 28,
    type: 'Dance',
    level: 'All Levels',
    language: 'English & Spanish'
  },
  {
    id: 5,
    title: 'Irish Pub Music Session',
    host: 'Aoife O\'Connor',
    culture: 'Irish',
    location: 'Virtual from Dublin',
    description: 'Join a traditional Irish music session, learning songs and stories that bind communities together.',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5JcmlzaCBNdXNpYzwvdGV4dD48L3N2Zz4=',
    nextSession: '2025-08-16',
    time: '20:00 GMT',
    participants: 19,
    maxParticipants: 25,
    type: 'Music',
    level: 'All Levels',
    language: 'English & Irish Gaelic'
  },
  {
    id: 6,
    title: 'Oaxacan Pottery Circle',
    host: 'Maria Santos',
    culture: 'Zapotec',
    location: 'Virtual from Oaxaca',
    description: 'Learn the ancient art of Oaxacan pottery, where each piece carries the spirit of indigenous craftsmanship.',
    image: 'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5Qb3R0ZXJ5PC90ZXh0Pjwvc3ZnPg==',
    nextSession: '2025-08-22',
    time: '17:00 GMT',
    participants: 12,
    maxParticipants: 20,
    type: 'Craft',
    level: 'Beginner',
    language: 'English & Spanish'
  }
];

const exchangeTypes = [
  {
    icon: MessageSquare,
    title: 'Cultural Conversations',
    description: 'Join intimate conversations with cultural practitioners sharing their wisdom and stories.'
  },
  {
    icon: Video,
    title: 'Live Workshops',
    description: 'Participate in hands-on workshops learning traditional crafts, music, and practices.'
  },
  {
    icon: Users,
    title: 'Community Circles',
    description: 'Connect with like-minded learners and create lasting friendships across cultures.'
  },
  {
    icon: Heart,
    title: 'Cultural Mentorship',
    description: 'Receive personal guidance from cultural keepers in your areas of interest.'
  }
];

export default function ExchangePage() {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const programId = target.getAttribute('data-program-id');
    const program = exchangePrograms.find(p => p.id.toString() === programId);
    if (program) {
      target.src = program.fallback;
    }
  };

  const filteredPrograms = selectedType === 'All' 
    ? exchangePrograms 
    : exchangePrograms.filter(program => program.type === selectedType);

  const programTypes = ['All', 'Storytelling', 'Ceremony', 'Craft', 'Dance', 'Music'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Cultural <span className="text-accent-400">Exchange Programs</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8">
              Connect directly with cultural practitioners from around the world. 
              Learn, share, and build bridges through authentic cultural experiences.
            </p>
            <div className="flex items-center justify-center space-x-6 text-primary-200">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>Live Sessions</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>Global Community</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Authentic Exchange</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Exchange Types */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Ways to Connect & Learn
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the type of cultural exchange that resonates with your learning style and interests.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {exchangeTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={type.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6 text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-3">
                    {type.title}
                  </h3>
                  <p className="text-gray-700">
                    {type.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Program Filters */}
      <section className="py-6 bg-gray-100 border-y border-gray-200">
        <div className="container-width">
          <div className="flex flex-wrap justify-center gap-3">
            {programTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedType === type
                    ? 'bg-primary-800 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Exchange Programs */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Upcoming Cultural Exchanges
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join live sessions with cultural practitioners sharing their traditions and wisdom.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <img
                    src={program.image}
                    alt={`${program.title} cultural exchange`}
                    className="w-full h-full object-cover"
                    data-program-id={program.id}
                    onError={handleImageError}
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-primary-800">
                    {program.type}
                  </div>
                  <div className="absolute top-4 right-4 bg-accent-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-white">
                    {program.level}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                    {program.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <User className="w-4 h-4 mr-1" />
                    <span className="mr-4">{program.host}</span>
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{program.culture}</span>
                  </div>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {program.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{program.nextSession}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{program.time}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{program.participants}/{program.maxParticipants} participants</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>{program.language}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-accent-400 fill-current" />
                      ))}
                    </div>
                    <button className="btn-primary">
                      Join Exchange
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
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-6">
              Ready to Bridge Cultures?
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Join our global community of cultural learners and share your own traditions 
              while discovering the beauty of other cultures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Browse All Programs
              </button>
              <button className="btn-outline">
                Host an Exchange
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
