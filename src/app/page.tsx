"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Globe, 
  Users, 
  BookOpen, 
  Mic, 
  Camera, 
  ArrowRight, 
  Star,
  Shield,
  Zap
} from 'lucide-react';

// Mock data for featured cultures
const featuredCultures = [
  {
    id: 1,
    name: 'Quechua Traditions',
    location: 'Peru',
    image: 'https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=400&h=300&fit=crop',
    contributors: 23,
    languages: 2,
    stories: 45,
    tags: ['Textiles', 'Music', 'Oral History'],
  },
  {
    id: 2,
    name: 'Maasai Heritage',
    location: 'Kenya & Tanzania',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop',
    contributors: 18,
    languages: 1,
    stories: 32,
    tags: ['Beadwork', 'Ceremonies', 'Pastoralism'],
  },
  {
    id: 3,
    name: 'Aboriginal Dreamtime',
    location: 'Australia',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    contributors: 12,
    languages: 3,
    stories: 28,
    tags: ['Art', 'Spirituality', 'Land Connection'],
  },
  {
    id: 4,
    name: 'Inuit Knowledge',
    location: 'Arctic',
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&h=300&fit=crop',
    contributors: 9,
    languages: 2,
    stories: 19,
    tags: ['Survival Skills', 'Ice Lore', 'Storytelling'],
  },
];

const stats = [
  { label: 'Cultural Communities', value: '127', icon: Users },
  { label: 'Languages Preserved', value: '89', icon: Globe },
  { label: 'Stories Collected', value: '2,340', icon: BookOpen },
  { label: 'Elder Contributors', value: '456', icon: Heart },
];

const features = [
  {
    icon: Shield,
    title: 'Community Sovereignty',
    description: 'Complete control over your cultural data with decentralized storage on Nostr.',
  },
  {
    icon: Users,
    title: 'Intergenerational Exchange',
    description: 'Connect elders with youth to ensure knowledge passes to future generations.',
  },
  {
    icon: Globe,
    title: 'Global Accessibility',
    description: 'Share your culture with the world while maintaining ownership and authenticity.',
  },
  {
    icon: Zap,
    title: 'Digital Resilience',
    description: 'Permanent, censorship-resistant preservation that survives institutional changes.',
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselImages = [
    {
      src: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=600&h=600&fit=crop",
      alt: "Indigenous elder teaching traditional knowledge to young people"
    },
    {
      src: "https://images.unsplash.com/photo-1573496358961-3c82861ab8f4?w=600&h=600&fit=crop", 
      alt: "Traditional craftsperson preserving ancestral techniques"
    },
    {
      src: "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=600&h=600&fit=crop",
      alt: "Community gathering preserving oral traditions"
    },
    {
      src: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop",
      alt: "Cultural documentation and storytelling session"
    },
    {
      src: "https://images.unsplash.com/photo-1588392382834-a891154bca4d?w=600&h=600&fit=crop",
      alt: "Traditional music preservation and teaching"
    },
    {
      src: "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=600&h=600&fit=crop",
      alt: "Intergenerational knowledge transfer"
    },
    {
      src: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&h=600&fit=crop",
      alt: "Cultural heritage documentation process"
    },
    {
      src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop",
      alt: "Community members preserving traditional practices together"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <div className="min-h-screen">
      {/* Stats Section */}
      <section className="section-padding bg-primary-50 pt-20">
        <div className="container-width">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-serif font-bold text-primary-800 mb-2">
                127
              </div>
              <div className="text-gray-600">Cultural Communities</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-serif font-bold text-primary-800 mb-2">
                89
              </div>
              <div className="text-gray-600">Languages Preserved</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-serif font-bold text-primary-800 mb-2">
                2,340
              </div>
              <div className="text-gray-600">Stories Collected</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-serif font-bold text-primary-800 mb-2">
                456
              </div>
              <div className="text-gray-600">Elder Contributors</div>
            </motion.div>
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
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-primary-800 mb-6">
              Preserve Heritage,{' '}
              <span className="text-gradient">Empower Communities</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              A platform that empowers indigenous and minority communities to permanently preserve their cultural practices, languages, and traditions — built on Nostr.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/explore" className="btn-primary text-lg px-8 py-4 flex items-center justify-center">
                Explore Cultures
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/contribute" className="btn-outline text-lg px-8 py-4 flex items-center justify-center">
                Share Your Heritage
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 floating-element">
          <div className="w-20 h-20 bg-accent-200 rounded-full opacity-60"></div>
        </div>
        <div className="absolute bottom-32 right-16 floating-element" style={{ animationDelay: '2s' }}>
          <div className="w-16 h-16 bg-primary-200 rounded-full opacity-40"></div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-6">
                Breaking Down Barriers to Cultural Preservation
              </h2>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                For too long, cultural preservation has been controlled by institutions and corporations. 
                Culture Bridge returns this power to communities themselves, using decentralized technology 
                to ensure traditions survive and thrive.
              </p>
              <div className="grid grid-cols-2 gap-8 mt-8 max-w-4xl mx-auto">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="flex flex-col items-center text-center space-y-4 p-6">
                      <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-8 h-8 text-primary-800" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary-800 mb-3 text-lg">{feature.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
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
              Discover the rich tapestry of human heritage through stories, languages, 
              and traditions shared by communities worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCultures.map((culture, index) => (
              <motion.div
                key={culture.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="culture-card group"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={culture.image}
                    alt={culture.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-accent-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                    Nostr Verified
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                    {culture.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{culture.location}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{culture.contributors} contributors</span>
                    <span>{culture.stories} stories</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {culture.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {culture.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                        +{culture.tags.length - 2} more
                      </span>
                    )}
                  </div>
                  
                  <Link 
                    href={`/explore/${culture.id}`}
                    className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center w-full justify-center py-2"
                  >
                    Explore Culture
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/explore" className="btn-secondary">
              View All Cultures
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        <div className="container-width text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Your Culture Matters. Your Story Deserves to Be Preserved.
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Join thousands of community members who are actively preserving their heritage 
              for future generations through our platform.
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
            className="max-w-4xl mx-auto text-center"
          >
            <div className="mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 border-4 border-accent-200">
                <img
                  src="https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=200&h=200&fit=crop&crop=face"
                  alt="Elder Maria Santos"
                  className="w-full h-full object-cover"
                />
              </div>
              <blockquote className="text-2xl md:text-3xl font-serif text-primary-800 italic leading-relaxed">
                "When an elder dies, a library burns to the ground. Culture Bridge ensures 
                our stories live forever, in our own voices, for our own people."
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
