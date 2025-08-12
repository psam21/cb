import { TimelineEntry, TeamMember, ValueDefinition, AboutPageData } from '../types/content';
import { Shield, Heart, Users, Zap, Globe, BookOpen } from 'lucide-react';

export const timeline: TimelineEntry[] = [
  {
    year: '2023',
    title: 'Inspiration Strikes',
    description:
      'Witnessing the beauty of cross-cultural storytelling in diverse communities worldwide.',
  },
  {
    year: '2024',
    title: 'Platform Development',
    description: 'Building bridges between traditional storytelling and modern digital connection.',
  },
  {
    year: '2024',
    title: 'Community Growth',
    description:
      'Welcoming storytellers from Andean villages, Japanese tea masters, and Irish musicians.',
  },
  {
    year: 'Future',
    title: 'Global Cultural Exchange',
    description:
      'Expanding to connect every corner of our diverse world through authentic stories.',
  },
];

export const team: TeamMember[] = [
  {
    name: 'Dr. Sofia Ramirez',
    role: 'Founder & Cultural Bridge Builder',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face',
    bio: 'Anthropologist passionate about connecting diverse communities through shared storytelling.',
  },
  {
    name: 'Kenji Nakamura',
    role: 'Cultural Exchange Coordinator',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
    bio: 'Indigenous rights advocate bridging traditional Maori culture with modern global connections.',
  },
  {
    name: 'Maria Santos',
    role: 'Community Storytelling Lead',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    bio: 'Weaving expert from Oaxaca helping artisans share their craft stories with the world.',
  },
  {
    name: "Aoife O'Connor",
    role: 'Music & Tradition Specialist',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
    bio: 'Irish musician and cultural historian preserving musical traditions through digital storytelling.',
  },
];

export const values: ValueDefinition[] = [
  {
    icon: Shield,
    title: 'Authentic Stories',
    description:
      'Every story shared on Culture Bridge comes directly from community members, ensuring authenticity and respect.',
  },
  {
    icon: Heart,
    title: 'Cultural Exchange',
    description:
      'Fostering meaningful connections between diverse communities through shared experiences and traditions.',
  },
  {
    icon: Users,
    title: 'Inclusive Community',
    description:
      'Welcoming storytellers from all backgrounds, from master artisans to passionate cultural enthusiasts.',
  },
  {
    icon: Zap,
    title: 'Living Traditions',
    description:
      'Celebrating culture as it lives and breathes today, honoring both ancient wisdom and modern expressions.',
  },
  {
    icon: Globe,
    title: 'Global Connection',
    description:
      'Building bridges that span continents, connecting diverse traditions like Maori haka ceremonies in New Zealand with storytelling in the Andes.',
  },
  {
    icon: BookOpen,
    title: 'Shared Learning',
    description:
      'Creating spaces where everyone can both teach and learn, fostering mutual respect and understanding.',
  },
];

export const aboutPageData: AboutPageData = { timeline, team, values };
