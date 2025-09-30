/**
 * Heritage contribution configuration
 * Defines heritage types, time periods, source types, and contributor roles
 */

export interface HeritageType {
  id: string;
  name: string;
  description: string;
}

export interface TimePeriod {
  id: string;
  name: string;
  description: string;
}

export interface SourceType {
  id: string;
  name: string;
  description: string;
}

export interface ContributorRole {
  id: string;
  name: string;
  description: string;
}

// Heritage Types
export const HERITAGE_TYPES: HeritageType[] = [
  {
    id: 'oral-tradition',
    name: 'Oral Tradition',
    description: 'Stories, legends, and spoken knowledge',
  },
  {
    id: 'craft',
    name: 'Craft',
    description: 'Traditional crafts and artisan skills',
  },
  {
    id: 'ceremony',
    name: 'Ceremony',
    description: 'Rituals, celebrations, and ceremonial practices',
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Traditional songs, instruments, and musical practices',
  },
  {
    id: 'language',
    name: 'Language',
    description: 'Language preservation and linguistic knowledge',
  },
  {
    id: 'art',
    name: 'Art',
    description: 'Visual arts and artistic expressions',
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    description: 'Traditional knowledge and wisdom',
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Dance, theater, and performance arts',
  },
];

// Time Periods
export const TIME_PERIODS: TimePeriod[] = [
  {
    id: 'ancient',
    name: 'Ancient',
    description: 'Pre-1000 CE',
  },
  {
    id: 'pre-colonial',
    name: 'Pre-Colonial',
    description: '1000-1492 CE',
  },
  {
    id: 'colonial',
    name: 'Colonial Period',
    description: '1492-1800s',
  },
  {
    id: '19th-century',
    name: '19th Century',
    description: '1800-1899',
  },
  {
    id: 'early-20th',
    name: 'Early 20th Century',
    description: '1900-1949',
  },
  {
    id: 'mid-20th',
    name: 'Mid 20th Century',
    description: '1950-1999',
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    description: '2000-present',
  },
  {
    id: 'living-tradition',
    name: 'Living Tradition',
    description: 'Ongoing, timeless practice',
  },
  {
    id: 'recently-revived',
    name: 'Recently Revived',
    description: 'Restored after period of loss',
  },
  {
    id: 'unknown',
    name: 'Unknown/Ancestral',
    description: 'Time period uncertain',
  },
];

// Source Types
export const SOURCE_TYPES: SourceType[] = [
  {
    id: 'family',
    name: 'Passed Down Through Family',
    description: 'Inherited family tradition',
  },
  {
    id: 'elder-teaching',
    name: 'Elder Teaching',
    description: 'Directly taught by community elder',
  },
  {
    id: 'personal-experience',
    name: 'Personal Experience',
    description: 'First-hand participation or practice',
  },
  {
    id: 'community-practice',
    name: 'Community Practice',
    description: 'Actively practiced in community',
  },
  {
    id: 'historical-record',
    name: 'Historical Record',
    description: 'Documented in archives or books',
  },
  {
    id: 'archaeological',
    name: 'Archaeological Finding',
    description: 'Discovered through research',
  },
  {
    id: 'oral-history',
    name: 'Oral History Project',
    description: 'Collected through formal documentation',
  },
  {
    id: 'revival',
    name: 'Revival/Restoration',
    description: 'Reconstructed from historical sources',
  },
];

// Contributor Roles
export const CONTRIBUTOR_ROLES: ContributorRole[] = [
  {
    id: 'practitioner',
    name: 'Practitioner',
    description: 'Active practitioner of this tradition',
  },
  {
    id: 'elder',
    name: 'Elder',
    description: 'Community elder or knowledge keeper',
  },
  {
    id: 'student',
    name: 'Student',
    description: 'Learning or studying this tradition',
  },
  {
    id: 'historian',
    name: 'Historian',
    description: 'Researcher or cultural historian',
  },
  {
    id: 'family-member',
    name: 'Family Member',
    description: 'Family connection to this tradition',
  },
  {
    id: 'community-member',
    name: 'Community Member',
    description: 'Member of the cultural community',
  },
  {
    id: 'educator',
    name: 'Educator',
    description: 'Teaching or educating about this tradition',
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Academic or independent researcher',
  },
];

// Helper functions
export const getHeritageTypeById = (id: string): HeritageType | undefined => {
  return HERITAGE_TYPES.find(type => type.id === id);
};

export const getTimePeriodById = (id: string): TimePeriod | undefined => {
  return TIME_PERIODS.find(period => period.id === id);
};

export const getSourceTypeById = (id: string): SourceType | undefined => {
  return SOURCE_TYPES.find(type => type.id === id);
};

export const getContributorRoleById = (id: string): ContributorRole | undefined => {
  return CONTRIBUTOR_ROLES.find(role => role.id === id);
};
