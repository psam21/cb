// Shared TypeScript interfaces (F2)
// Narrow initial scope: cultures, stats, features, carousel images.

export interface CultureSummary {
  id: number;
  name: string;
  location: string;
  image: string; // URL (to be migrated to next/image compatible loader)
  contributors: number;
  languages: number;
  stories: number;
  tags: string[];
}

import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatMetric {
  label: string;
  value: string | number;
  icon: ComponentType<unknown> | LucideIcon; // lucide-react icon component
}

export interface FeatureInfo {
  icon: ComponentType<unknown> | LucideIcon;
  title: string;
  description: string;
}

export interface CarouselImage {
  src: string;
  alt: string;
}

// Aggregate bundles for potential future data fetch abstractions
export interface HomePageData {
  cultures: CultureSummary[];
  stats: StatMetric[];
  features: FeatureInfo[];
  carousel: CarouselImage[];
}

// About page specific types
export interface TimelineEntry {
  year: string;
  title: string;
  description: string;
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

export interface ValueDefinition {
  icon: ComponentType<unknown> | LucideIcon;
  title: string;
  description: string;
}

export interface AboutPageData {
  timeline: TimelineEntry[];
  team: TeamMember[];
  values: ValueDefinition[];
}

// Resource / downloads page types (extracted from previous inline arrays)
export interface ResourceItem {
  id: number;
  title: string;
  type: string; // e.g., PDF Guide, Video Course
  category: string;
  culture: string;
  description: string;
  image: string;
  fallback: string;
  author: string;
  downloads: number;
  rating: number; // 0-5 float
  date: string; // ISO or YYYY-MM-DD
  featured: boolean;
  icon: ComponentType<unknown> | LucideIcon; // lucide-react icon component
  // Optional fields depending on resource type
  size?: string;
  pages?: number;
  duration?: string;
  episodes?: number;
  images?: number;
  tracks?: number;
  songs?: number;
}

// Elder Voices story type
export interface ElderStory {
  id: number;
  title: string;
  elder: string;
  age: number;
  culture: string;
  location: string;
  description: string;
  image: string;
  fallback: string;
  duration: string; // mm:ss or similar
  category: string;
  language: string;
  featured: boolean;
  listens: number;
  rating: number; // 0-5 float
  recorded: string; // date string
  quote: string;
}

// Exhibitions types (restoring full exhibitions logic with proper typing)
export interface ExhibitionArtifact {
  id: number;
  title: string;
  type: 'image' | 'audio' | 'video' | 'text';
  description: string;
  media: string; // url for media asset (image/video/audio placeholder)
  fallback: string; // lightweight base64 fallback
  attribution?: string; // creator / contributor
  year?: string; // optional year or period
  tags: string[];
}

export interface Exhibition {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  culture: string;
  region: string;
  category: string; // e.g., Crafts, Music, Ritual, Storytelling
  description: string;
  featured: boolean;
  image: string; // hero / cover image
  fallback: string;
  contributors: number;
  artifacts: ExhibitionArtifact[];
  lastUpdated: string; // relative or date string
  tags: string[];
  difficulty?: 'Introductory' | 'Intermediate' | 'Advanced'; // for learning depth / curation
}

export interface ExhibitionsDataBundle {
  exhibitions: Exhibition[];
  categories: string[]; // includes 'All'
  regions: string[]; // derived or explicit list
}

// Explore page types
export interface ExploreCulture {
  id: number;
  name: string;
  location: string;
  region: string;
  image: string;
  contributors: number;
  languages: number;
  stories: number;
  audioRecordings: number;
  videos: number;
  tags: string[];
  description: string;
  featured: boolean;
  lastUpdated: string;
}
