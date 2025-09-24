'use client';
import React from 'react';
import Image from 'next/image';
// Removed blur import - using placeholder
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Globe,
  BookOpen,
  Users,
  Heart,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const courses = [
  {
    id: 1,
    name: 'Andean Cultures',
    nativeName: 'Culturas Andinas',
    speakers: '8 million',
    region: 'Andes Mountains',
    description:
      'Explore the rich cultural heritage of Andean communities, including Quechua language, weaving traditions, and spiritual practices.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5BbmRlYW4gQ3VsdHVyZXM8L3RleHQ+PC9zdmc+',
    lessons: 24,
    level: 'Beginner to Intermediate',
    features: ['Language basics', 'Cultural context', 'Traditional crafts'],
  },
  {
    id: 2,
    name: 'Celtic Traditions',
    nativeName: 'Traidisiúin Cheilteacha',
    speakers: '1.7 million',
    region: 'Ireland & Scotland',
    description:
      'Discover Celtic culture through language, music, storytelling, and traditional practices from Ireland and Scotland.',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5DZWx0aWMgVHJhZGl0aW9uczwvdGV4dD48L3N2Zz4=',
    lessons: 18,
    level: 'All Levels',
    features: ['Language basics', 'Traditional music', 'Storytelling'],
  },
  {
    id: 3,
    name: 'Japanese Arts & Culture',
    nativeName: '日本の芸術と文化',
    speakers: '125 million',
    region: 'Japan',
    description:
      'Explore Japanese culture through traditional arts, tea ceremony, origami, calligraphy, and cultural practices.',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij7ml6XmnKzoqp48L3RleHQ+PC9zdmc+',
    lessons: 32,
    level: 'Beginner to Advanced',
    features: ['Traditional arts', 'Tea ceremony', 'Cultural etiquette'],
  },
  {
    id: 4,
    name: 'Oaxacan Traditions',
    nativeName: 'Tradiciones Oaxaqueñas',
    speakers: '460,000',
    region: 'Oaxaca, Mexico',
    description:
      'Explore the rich cultural heritage of Oaxaca through pottery, weaving, language, and traditional ceremonies.',
    image: 'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5PYXhhY2FuIFRyYWRpdGlvbnM8L3RleHQ+PC9zdmc+',
    lessons: 16,
    level: 'Beginner',
    features: ['Traditional crafts', 'Cultural ceremonies', 'Community stories'],
  },
  {
    id: 5,
    name: 'Navajo Culture & Traditions',
    nativeName: 'Diné bizaad',
    speakers: '170,000',
    region: 'Southwest United States',
    description:
      'Explore Navajo culture through weaving traditions, sacred stories, and deep connection to the land.',
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5OYXZham8gQ3VsdHVyZTwvdGV4dD48L3N2Zz4=',
    lessons: 20,
    level: 'Beginner to Intermediate',
    features: ['Weaving traditions', 'Sacred stories', 'Land connection'],
  },
  {
    id: 6,
    name: 'Argentine Culture & Tango',
    nativeName: 'Cultura Argentina y Tango',
    speakers: '47 million',
    region: 'Buenos Aires, Argentina',
    description:
      'Learn Argentine Spanish through the passionate language of tango and Buenos Aires street culture.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5Fc3Bhw7FvbDwvdGV4dD48L3N2Zz4=',
    lessons: 28,
    level: 'Intermediate to Advanced',
    features: ['Tango lyrics', 'Street expressions', 'Cultural history'],
  },
];

const learningMethods = [
  {
    icon: BookOpen,
    title: 'Structured Learning',
    description:
      'Follow organized courses with clear learning objectives and cultural milestones.',
  },
  {
    icon: Users,
    title: 'Community Practice',
    description: 'Learn alongside others and practice with cultural practitioners and experts.',
  },
  {
    icon: Heart,
    title: 'Cultural Immersion',
    description: 'Experience authentic cultural practices, traditions, and ways of life.',
  },
  {
    icon: Globe,
    title: 'Global Perspectives',
    description: 'Connect with diverse cultures and communities from around the world.',
  },
];

export default function CoursesContent() {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const courseId = target.getAttribute('data-course-id');
    const course = courses.find((c) => c.id.toString() === courseId);
    if (course) target.src = course.fallback;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="section-padding bg-gradient-to-br from-accent-400 to-accent-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container-width text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Cultural <span className="text-white">Courses</span>
            </h1>
            <p className="text-xl md:text-2xl text-accent-50 leading-relaxed mb-8">
              Learn about different cultures through structured courses, workshops, and educational programs led by cultural practitioners.
            </p>
            <div className="flex items-center justify-center space-x-6 text-accent-100">
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>6 Cultures</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                <span>Structured Learning</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                <span>Cultural Immersion</span>
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
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              How We Teach Cultures
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our approach connects cultural learning with hands-on experiences, making every
              course a bridge to new perspectives and understanding.
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
                  <p className="text-gray-700">{method.description}</p>
                </motion.div>
              );
            })}
          </div>
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
              Choose Your Cultural Learning Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each course is designed around authentic cultural practices, traditions, and hands-on learning experiences.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <Image
                    src={course.image}
                    alt={`${course.name} cultural course`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
                    className="object-cover"
                    data-course-id={course.id}
                    onError={handleImageError}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-primary-800">
                    {course.level}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-serif font-bold text-primary-800">
                      {course.name}
                    </h3>
                    <span className="text-gray-600 font-medium">{course.nativeName}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="mr-4">{course.speakers} speakers</span>
                    <Globe className="w-4 h-4 mr-1" />
                    <span>{course.region}</span>
                  </div>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {course.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    {course.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 mr-2 text-accent-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{course.lessons} lessons</span>
                    <Link
                      href={`/courses/learn/${course.id}`}
                      className="btn-primary"
                      aria-label={`Start learning ${course.name}`}
                    >
                      Start Learning
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
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
            className="container-width text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Share Your Language Heritage
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Do you speak a cultural language that deserves to be preserved? Help us create
              authentic learning experiences by contributing your native language knowledge and
              cultural insights.
            </p>
            <div className="flex justify-center">
              <Link
                href="/language/contribute"
                className="btn-accent"
                aria-label="Contribute your language resources"
              >
                Contribute Your Language
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
