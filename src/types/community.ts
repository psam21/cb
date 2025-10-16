import type { LucideIcon } from 'lucide-react';

/**
 * Community member profile
 * Represents a cultural practitioner featured on the community page
 */
export interface CommunityMember {
  id: number;
  name: string;
  role: string;
  culture: string;
  location: string;
  specialties: string[];
  bio: string;
  image: string;
  fallback: string; // Base64 encoded fallback image
  contributions: number;
  followers: number;
  icon: LucideIcon;
}

/**
 * Community statistics displayed at the top of the community page
 */
export interface CommunityStat {
  label: string;
  value: string;
  icon: LucideIcon;
}

/**
 * Upcoming community event
 */
export interface CommunityEvent {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM GMT format
  participants: number;
  description: string;
  type: 'Virtual' | 'Workshop' | 'Cultural Exchange';
  culture: string;
}
