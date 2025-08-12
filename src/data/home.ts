// Home page mock data extracted (MR1 precursor while still counted under F3 later)
// For now this supports F2 data typing demonstration.
import {
  CultureSummary,
  StatMetric,
  FeatureInfo,
  CarouselImage,
  HomePageData,
} from '../types/content';
import { Users, Globe, BookOpen, Heart, Shield, Zap } from 'lucide-react';

export const cultures: CultureSummary[] = [
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

export const statMetrics: StatMetric[] = [
  { label: 'Cultural Communities', value: '127', icon: Users },
  { label: 'Languages Preserved', value: '89', icon: Globe },
  { label: 'Stories Collected', value: '2,340', icon: BookOpen },
  { label: 'Elder Contributors', value: '456', icon: Heart },
];

export const featureList: FeatureInfo[] = [
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
    description:
      'Permanent, censorship-resistant preservation that survives institutional changes.',
  },
];

export const carouselImages: CarouselImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=600&h=600&fit=crop',
    alt: 'Indigenous elder teaching traditional knowledge to young people',
  },
  {
    src: 'https://images.unsplash.com/photo-1573496358961-3c82861ab8f4?w=600&h=600&fit=crop',
    alt: 'Traditional craftsperson preserving ancestral techniques',
  },
  {
    src: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=600&h=600&fit=crop',
    alt: 'Community gathering preserving oral traditions',
  },
  {
    src: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop',
    alt: 'Cultural documentation and storytelling session',
  },
  {
    src: 'https://images.unsplash.com/photo-1588392382834-a891154bca4d?w=600&h=600&fit=crop',
    alt: 'Traditional music preservation and teaching',
  },
  {
    src: 'https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=600&h=600&fit=crop',
    alt: 'Intergenerational knowledge transfer',
  },
  {
    src: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&h=600&fit=crop',
    alt: 'Cultural heritage documentation process',
  },
  {
    src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop',
    alt: 'Community members preserving traditional practices together',
  },
];

export const homePageData: HomePageData = {
  cultures,
  stats: statMetrics,
  features: featureList,
  carousel: carouselImages,
};
