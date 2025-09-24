'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  HelpCircle,
  MessageCircle,
  Mail,
  BookOpen,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    questions: [
      {
        question: 'How do I create an account?',
        answer: 'Culture Bridge uses Nostr for authentication. Simply click "Sign In" and connect with your Nostr extension (like Alby or nos2x). No traditional account creation needed!',
      },
      {
        question: 'What is Nostr and why do we use it?',
        answer: 'Nostr is a decentralized protocol that gives you full control over your data. Unlike traditional platforms, your cultural content belongs to you and can\'t be censored or deleted by us.',
      },
      {
        question: 'How do I share my cultural stories?',
        answer: 'Navigate to the "Contribute" page and select the type of content you want to share. Follow the guided process to upload your cultural materials and stories.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: HelpCircle,
    questions: [
      {
        question: 'I\'m having trouble with my Nostr extension',
        answer: 'Make sure you have a compatible Nostr extension installed (Alby, nos2x, or similar). Try refreshing the page or clearing your browser cache. If issues persist, contact our support team.',
      },
      {
        question: 'Why can\'t I see my uploaded content?',
        answer: 'Content may take a few minutes to appear as it gets distributed across Nostr relays. Check your internet connection and try refreshing the page. If content still doesn\'t appear after 10 minutes, contact support.',
      },
      {
        question: 'How do I backup my cultural content?',
        answer: 'Your content is automatically backed up across multiple Nostr relays. You can also export your data using your Nostr extension. Your content is decentralized and resilient.',
      },
    ],
  },
  {
    id: 'community',
    title: 'Community & Culture',
    icon: Users,
    questions: [
      {
        question: 'How do I join cultural meetups?',
        answer: 'Visit the "Meetups" page to see upcoming cultural events and gatherings. You can filter by location, culture, or event type. Click "Join Meetup" to participate.',
      },
      {
        question: 'Can I create my own cultural course?',
        answer: 'Yes! Visit the "Courses" page and click "Host a Course" to create your own cultural learning experience. Share your knowledge with the global community.',
      },
      {
        question: 'How do I connect with other cultural practitioners?',
        answer: 'Use the "Community" page to find other users, join discussions, and connect with cultural practitioners from around the world. You can also participate in meetups and courses.',
      },
    ],
  },
];

const supportOptions = [
  {
    title: 'Browse FAQ',
    description: 'Find answers to common questions',
    icon: HelpCircle,
    href: '#faq',
    color: 'bg-primary-600',
  },
  {
    title: 'Community Forum',
    description: 'Get help from other users',
    icon: MessageCircle,
    href: '#community',
    color: 'bg-accent-600',
  },
  {
    title: 'Contact Support',
    description: 'Reach out to our team',
    icon: Mail,
    href: '#contact',
    color: 'bg-green-600',
  },
  {
    title: 'Documentation',
    description: 'Technical guides and tutorials',
    icon: BookOpen,
    href: '#docs',
    color: 'bg-purple-600',
  },
];

export default function SupportContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container-width text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              How can we <span className="text-accent-400">help you?</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8">
              Find answers, get support, and connect with our community
            </p>
          </motion.div>
        </div>
      </section>

      {/* Support Options */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6 text-center hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                >
                  <div className={`w-16 h-16 ${option.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-gray-600">{option.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Search FAQ */}
      <section className="py-8 bg-gray-100">
        <div className="container-width">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-white" id="faq">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about Culture Bridge and our platform
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {filteredCategories.map((category, categoryIndex) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  className="card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary-600" />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-primary-800">
                        {category.title}
                      </h3>
                    </div>
                    {expandedCategory === category.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedCategory === category.id && (
                    <div className="border-t border-gray-200">
                      {category.questions.map((faq, questionIndex) => (
                        <div key={questionIndex} className="border-b border-gray-100 last:border-b-0">
                          <button
                            onClick={() => setExpandedQuestion(
                              expandedQuestion === `${category.id}-${questionIndex}` 
                                ? null 
                                : `${category.id}-${questionIndex}`
                            )}
                            className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-primary-800 pr-4">
                              {faq.question}
                            </span>
                            {expandedQuestion === `${category.id}-${questionIndex}` ? (
                              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          {expandedQuestion === `${category.id}-${questionIndex}` && (
                            <div className="px-6 pb-6">
                              <p className="text-gray-700 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="section-padding bg-gradient-to-br from-accent-50 to-primary-50" id="contact">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="container-width text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-6">
              Still need help?
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Our support team is here to help you preserve and share your cultural heritage
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@culturebridge.org"
                className="btn-primary"
              >
                <Mail className="w-5 h-5 mr-2" />
                Email Support
              </a>
              <a
                href="#community"
                className="btn-outline"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Community Forum
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
