'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Shield, 
  Users, 
  Globe, 
  Zap, 
  BookOpen,
  Target,
  Eye,
  Award
} from 'lucide-react';

const timeline = [
  {
    year: '2023',
    title: 'Inspiration Strikes',
    description: 'Witnessing the beauty of cross-cultural storytelling in diverse communities worldwide.',
  },
  {
    year: '2024',
    title: 'Platform Development',
    description: 'Building bridges between traditional storytelling and modern digital connection.',
  },
  {
    year: '2024',
    title: 'Community Growth',
    description: 'Welcoming storytellers from Andean villages, Japanese tea masters, and Irish musicians.',
  },
  {
    year: 'Future',
    title: 'Global Cultural Exchange',
    description: 'Expanding to connect every corner of our diverse world through authentic stories.',
  },
];

const team = [
  {
    name: 'Dr. Sofia Ramirez',
    role: 'Founder & Cultural Bridge Builder',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face',
    bio: 'Anthropologist passionate about connecting diverse communities through shared storytelling.',
  },
  {
    name: 'Kenji Nakamura',
    role: 'Cultural Exchange Coordinator',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
    bio: 'Indigenous rights advocate bridging traditional Maori culture with modern global connections.',
  },
  {
    name: 'Maria Santos',
    role: 'Community Storytelling Lead',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    bio: 'Weaving expert from Oaxaca helping artisans share their craft stories with the world.',
  },
  {
    name: 'Aoife O\'Connor',
    role: 'Music & Tradition Specialist',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
    bio: 'Irish musician and cultural historian preserving musical traditions through digital storytelling.',
  },
];

const values = [
  {
    icon: Shield,
    title: 'Authentic Stories',
    description: 'Every story shared on Culture Bridge comes directly from community members, ensuring authenticity and respect.',
  },
  {
    icon: Heart,
    title: 'Cultural Exchange',
    description: 'Fostering meaningful connections between diverse communities through shared experiences and traditions.',
  },
  {
    icon: Users,
    title: 'Inclusive Community',
    description: 'Welcoming storytellers from all backgrounds, from master artisans to passionate cultural enthusiasts.',
  },
  {
    icon: Zap,
    title: 'Living Traditions',
    description: 'Celebrating culture as it lives and breathes today, honoring both ancient wisdom and modern expressions.',
  },
  {
    icon: Globe,
    title: 'Global Connection',
    description: 'Building bridges that span continents, connecting diverse traditions like Maori haka ceremonies in New Zealand with storytelling in the Andes.',
  },
  {
    icon: BookOpen,
    title: 'Shared Learning',
    description: 'Creating spaces where everyone can both teach and learn, fostering mutual respect and understanding.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary-800 mb-6">
              Bridging Cultures{' '}
              <span className="text-gradient">Through Authentic Stories</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              Culture Bridge connects communities worldwide through the power of authentic storytelling, 
              preserving traditions while fostering meaningful cultural exchange between diverse peoples.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <div className="grid lg:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                To ignite a cultural renaissance—where every community becomes the guardian of its own legacy. 
                We empower storytellers to etch their truths into the fabric of the internet, unaltered and eternal. 
                No tradition forgotten. No voice lost. Just timeless bridges between the wisdom of elders and 
                the curiosity of youth, carrying heritage forward—forever.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed">
                A just world where no culture is silenced, no story erased, and no heritage locked 
                behind paywalls or institutions. A world where communities reclaim their narratives, 
                celebrate their identities, and stand united in the dignity of shared knowledge.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">Our Impact</h2>
              <p className="text-gray-700 leading-relaxed">
                We spark cultural awakenings—joyful, powerful, and long overdue. Where stories once silenced 
                now sing across time. We weave memory into the sacred threads of human connection, honoring 
                the wisdom carried through generations while lighting the way for those yet to come. Cultures 
                breathe, grow, and pass their truths from heart to heart—alive, unbroken, and free from borders or silence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From recognition of the problem to building a global solution for cultural preservation.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`flex items-center mb-12 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                <div className="w-full md:w-5/12">
                  <div className={`${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="text-3xl font-serif font-bold text-accent-600 mb-2">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                </div>
                <div className="w-full md:w-2/12 flex justify-center">
                  <div className="w-4 h-4 bg-accent-600 rounded-full border-4 border-white shadow-lg"></div>
                </div>
                <div className="w-full md:w-5/12"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide every decision we make and every feature we build.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6 text-center hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-primary-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A diverse group of cultural advocates, technologists, and community leaders 
              united by a shared mission.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-6 text-center"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-accent-200">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-serif font-bold text-primary-800 mb-1">
                  {member.name}
                </h3>
                <p className="text-accent-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-700 text-sm leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
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
              Join Us in Building a Better Future for Cultural Heritage
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Whether you're a community elder, young culture keeper, developer, or supporter, 
              there's a place for you in the Culture Bridge network.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <a href="/get-involved" className="bg-accent-600 text-white px-8 py-4 rounded-default font-medium hover:bg-accent-700 transition-colors duration-300 text-lg">
                Get Involved
              </a>
              <a href="/contribute" className="border-2 border-white text-white px-8 py-4 rounded-default font-medium hover:bg-white hover:text-primary-800 transition-all duration-300 text-lg">
                Start Contributing
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
