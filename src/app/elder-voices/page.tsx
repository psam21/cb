'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  Heart, 
  Clock,
  MapPin,
  User,
  Quote,
  Headphones,
  Star,
  ArrowRight,
  Calendar
} from 'lucide-react';

const elderStories = [
  {
    id: 1,
    title: 'Mountain Spirits and Ancient Paths',
    elder: 'Mama Quispe',
    age: 82,
    culture: 'Quechua',
    location: 'Sacred Valley, Peru',
    description: 'Mama Quispe shares the ancient stories of mountain spirits that have guided her people for generations.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5NYW1hIFF1aXNwZTwvdGV4dD48L3N2Zz4=',
    duration: '24:15',
    category: 'Spiritual Wisdom',
    language: 'Quechua with English subtitles',
    featured: true,
    listens: 2840,
    rating: 4.9,
    recorded: '2024-12-10',
    quote: 'The mountains speak to those who know how to listen. Every stone has a story, every wind carries wisdom.'
  },
  {
    id: 2,
    title: 'The Way of Tea and Mindfulness',
    elder: 'Tanaka-san',
    age: 89,
    culture: 'Japanese',
    location: 'Kyoto, Japan',
    description: 'Master Tanaka shares 60 years of tea ceremony wisdom, teaching the path to inner peace through ritual.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5UYW5ha2Etc2FuPC90ZXh0Pjwvc3ZnPg==',
    duration: '18:42',
    category: 'Philosophy',
    language: 'Japanese with English subtitles',
    featured: true,
    listens: 1920,
    rating: 4.8,
    recorded: '2024-12-08',
    quote: 'In each movement of the tea ceremony, we find harmony. In each sip, we taste the present moment.'
  },
  {
    id: 3,
    title: 'Weaving Stories in Sacred Patterns',
    elder: 'Grandmother Yazzie',
    age: 76,
    culture: 'Navajo',
    location: 'Monument Valley, Arizona',
    description: 'Grandmother Yazzie reveals the sacred meanings behind Navajo weaving patterns passed down through generations.',
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5HcmFuZG1vdGhlcjwvdGV4dD48L3N2Zz4=',
    duration: '31:28',
    category: 'Traditional Arts',
    language: 'English and Navajo',
    featured: false,
    listens: 1540,
    rating: 4.9,
    recorded: '2024-12-05',
    quote: 'Each thread carries the memory of my ancestors. When I weave, I am never alone.'
  },
  {
    id: 4,
    title: 'Tango of Memory and Passion',
    elder: 'Don Carlos',
    age: 84,
    culture: 'Argentine',
    location: 'La Boca, Buenos Aires',
    description: 'Don Carlos recounts the golden age of tango, sharing stories of passion, loss, and the soul of Buenos Aires.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5Eb24gQ2FybG9zPC90ZXh0Pjwvc3ZnPg==',
    duration: '26:53',
    category: 'Music & Dance',
    language: 'Spanish with English subtitles',
    featured: false,
    listens: 1180,
    rating: 4.7,
    recorded: '2024-12-02',
    quote: 'Tango is not just dance - it is the heartbeat of our city, the story of our people written in movement.'
  },
  {
    id: 5,
    title: 'Songs of the Ancient Pub',
    elder: 'Seamus O\'Sullivan',
    age: 91,
    culture: 'Irish',
    location: 'County Cork, Ireland',
    description: 'Seamus shares traditional Irish songs and stories from a lifetime of gathering in village pubs.',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ci8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5TZWFtdXM8L3RleHQ+PC9zdmc+',
    duration: '22:17',
    category: 'Folk Traditions',
    language: 'English and Irish Gaelic',
    featured: false,
    listens: 980,
    rating: 4.8,
    recorded: '2024-11-28',
    quote: 'In the pub, we are all equal. The music brings us together, and the stories keep us whole.'
  },
  {
    id: 6,
    title: 'Clay Wisdom from Ancient Hands',
    elder: 'Abuela Esperanza',
    age: 78,
    culture: 'Zapotec',
    location: 'Oaxaca, Mexico',
    description: 'Abuela Esperanza shares the spiritual connection between potter and clay in the ancient traditions of Oaxaca.',
    image: 'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=400&h=300&fit=crop',
    fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ci8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5BYnVlbGE8L3RleHQ+PC9zdmc+',
    duration: '19:35',
    category: 'Traditional Arts',
    language: 'Spanish with English subtitles',
    featured: false,
    listens: 820,
    rating: 4.9,
    recorded: '2024-11-25',
    quote: 'The clay teaches patience. It knows when it is ready, and we must learn to listen.'
  }
];

const categories = ['All Stories', 'Spiritual Wisdom', 'Philosophy', 'Traditional Arts', 'Music & Dance', 'Folk Traditions'];

export default function ElderVoicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Stories');
  const [playingId, setPlayingId] = useState<number | null>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const storyId = target.getAttribute('data-story-id');
    const story = elderStories.find(s => s.id.toString() === storyId);
    if (story) {
      target.src = story.fallback;
    }
  };

  const filteredStories = selectedCategory === 'All Stories' 
    ? elderStories 
    : elderStories.filter(story => story.category === selectedCategory);

  const featuredStories = elderStories.filter(story => story.featured);

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
            className="max-w-4xl mx-auto text-center"
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
                      <img
                        src={story.image}
                        alt={`${story.elder} sharing ${story.title}`}
                        className="w-full h-full object-cover"
                        data-story-id={story.id}
                        onError={handleImageError}
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
                      <span className="mr-4">{story.elder}, {story.age}</span>
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{story.location}</span>
                    </div>
                    <div className="bg-gray-50 border-l-4 border-accent-400 pl-4 py-2 mb-4 italic text-gray-700">
                      "{story.quote}"
                    </div>
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                      {story.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(story.rating) ? 'text-accent-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {story.rating} ({story.listens.toLocaleString()} listens)
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
                  <img
                    src={story.image}
                    alt={`${story.elder} sharing ${story.title}`}
                    className="w-full h-full object-cover"
                    data-story-id={story.id}
                    onError={handleImageError}
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
                    <span className="mr-4">{story.elder}, {story.age}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{story.culture} • {story.location}</span>
                  </div>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed line-clamp-2">
                    {story.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(story.rating) ? 'text-accent-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
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
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Share Your Elder's Wisdom
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Do you know an elder with stories to share? Help us preserve their wisdom 
              for future generations through the Elder Voices program.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-accent">
                Record an Elder Story
              </button>
              <button className="btn-outline-white">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
