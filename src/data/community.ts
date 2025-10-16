/**
 * Community Data
 * 
 * Static data for the community page including:
 * - Featured community members (cultural practitioners)
 * - Community statistics
 * - Upcoming events
 * 
 * Note: This is currently static data for demonstration purposes.
 * In the future, this could be fetched from Nostr events or a CMS.
 */

import {
  Users,
  MessageCircle,
  Globe,
  BookOpen,
  Music,
  Palette,
  Coffee,
} from 'lucide-react';
import type { CommunityMember, CommunityStat, CommunityEvent } from '@/types/community';

/**
 * Featured community members - cultural practitioners from around the world
 */
export const communityMembers: CommunityMember[] = [
  {
    id: 1,
    name: 'Carlos Mamani',
    role: 'Andean Storyteller',
    culture: 'Quechua',
    location: 'Sacred Valley, Peru',
    specialties: ['Oral Traditions', 'Mountain Spirituality', 'Ancient Stories'],
    bio: 'Master storyteller preserving the ancient tales of the Andes for future generations.',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 24,
    followers: 1840,
    icon: BookOpen,
  },
  {
    id: 2,
    name: 'Kenji Nakamura',
    role: 'Tea Master',
    culture: 'Japanese',
    location: 'Kyoto, Japan',
    specialties: ['Flamenco Dance', 'Spanish Guitar', 'Traditional Arts'],
    bio: 'Third-generation tea master sharing the way of tea and mindful living.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 18,
    followers: 2150,
    icon: Coffee,
  },
  {
    id: 3,
    name: 'Maria Begay',
    role: 'Master Weaver',
    culture: 'Navajo',
    location: 'Monument Valley, Arizona',
    specialties: ['Traditional Weaving', 'Sacred Patterns', 'Cultural Teaching'],
    bio: 'Preserving the sacred art of Navajo weaving and its spiritual significance.',
    image:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 32,
    followers: 1650,
    icon: Palette,
  },
  {
    id: 4,
    name: 'Sofia Rodriguez',
    role: 'Tango Instructor',
    culture: 'Argentine',
    location: 'Buenos Aires, Argentina',
    specialties: ['Tango Dance', 'Music History', 'Street Culture'],
    bio: 'Passionate tango instructor sharing the soul of Buenos Aires through dance.',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 27,
    followers: 1980,
    icon: Music,
  },
  {
    id: 5,
    name: "Aoife O'Connor",
    role: 'Folk Musician',
    culture: 'Irish',
    location: 'County Cork, Ireland',
    specialties: ['Traditional Music', 'Irish Language', 'Folk Stories'],
    bio: 'Keeping Irish folk traditions alive through music and storytelling.',
    image:
      'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 21,
    followers: 1420,
    icon: Music,
  },
  {
    id: 6,
    name: 'Maria Santos',
    role: 'Potter & Artist',
    culture: 'Zapotec',
    location: 'Oaxaca, Mexico',
    specialties: ['Traditional Pottery', 'Indigenous Art', 'Cultural Heritage'],
    bio: 'Master potter preserving ancient Zapotec techniques and cultural knowledge.',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjU1IiByPSIyNSIgZmlsbD0iIzhmYmM5NCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTEwIiByPSI0MCIgZmlsbD0iIzhmYmM5NCIvPjwvc3ZnPg==',
    contributions: 19,
    followers: 1120,
    icon: Palette,
  },
];

/**
 * Community statistics - overview metrics
 */
export const communityStats: CommunityStat[] = [
  { label: 'Active Members', value: '2,847', icon: Users },
  { label: 'Cultural Stories', value: '1,240', icon: BookOpen },
  { label: 'Languages Represented', value: '47', icon: Globe },
  { label: 'Monthly Exchanges', value: '156', icon: MessageCircle },
];

/**
 * Upcoming community events - workshops, gatherings, and cultural exchanges
 */
export const upcomingEvents: CommunityEvent[] = [
  {
    id: 1,
    title: 'Global Storytelling Circle',
    date: '2025-08-12',
    time: '19:00 GMT',
    participants: 24,
    description: 'Monthly gathering where community members share stories from their cultures.',
    type: 'Virtual',
    culture: 'Multicultural',
  },
  {
    id: 2,
    title: 'Tea Ceremony Workshop',
    date: '2025-08-15',
    time: '14:00 GMT',
    participants: 18,
    description: 'Learn the meditative art of Japanese tea ceremony with Master Kenji.',
    type: 'Workshop',
    culture: 'Japanese',
  },
  {
    id: 3,
    title: 'Weaving Patterns & Stories',
    date: '2025-08-20',
    time: '18:00 GMT',
    participants: 15,
    description: 'Explore the sacred patterns in Navajo weaving with Master Weaver Maria.',
    type: 'Cultural Exchange',
    culture: 'Navajo',
  },
];
