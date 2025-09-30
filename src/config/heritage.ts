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

export interface Continent {
  id: string;
  name: string;
}

export interface Country {
  id: string;
  name: string;
  continent: string;
}

// Continents
export const CONTINENTS: Continent[] = [
  { id: 'africa', name: 'Africa' },
  { id: 'asia', name: 'Asia' },
  { id: 'europe', name: 'Europe' },
  { id: 'north-america', name: 'North America' },
  { id: 'south-america', name: 'South America' },
  { id: 'oceania', name: 'Oceania' },
  { id: 'antarctica', name: 'Antarctica' },
];

// Countries (organized by continent)
export const COUNTRIES: Country[] = [
  // Africa
  { id: 'egypt', name: 'Egypt', continent: 'africa' },
  { id: 'ethiopia', name: 'Ethiopia', continent: 'africa' },
  { id: 'ghana', name: 'Ghana', continent: 'africa' },
  { id: 'kenya', name: 'Kenya', continent: 'africa' },
  { id: 'morocco', name: 'Morocco', continent: 'africa' },
  { id: 'nigeria', name: 'Nigeria', continent: 'africa' },
  { id: 'south-africa', name: 'South Africa', continent: 'africa' },
  { id: 'tanzania', name: 'Tanzania', continent: 'africa' },
  
  // Asia
  { id: 'china', name: 'China', continent: 'asia' },
  { id: 'india', name: 'India', continent: 'asia' },
  { id: 'indonesia', name: 'Indonesia', continent: 'asia' },
  { id: 'japan', name: 'Japan', continent: 'asia' },
  { id: 'korea', name: 'South Korea', continent: 'asia' },
  { id: 'mongolia', name: 'Mongolia', continent: 'asia' },
  { id: 'nepal', name: 'Nepal', continent: 'asia' },
  { id: 'philippines', name: 'Philippines', continent: 'asia' },
  { id: 'thailand', name: 'Thailand', continent: 'asia' },
  { id: 'tibet', name: 'Tibet', continent: 'asia' },
  { id: 'vietnam', name: 'Vietnam', continent: 'asia' },
  
  // Europe
  { id: 'france', name: 'France', continent: 'europe' },
  { id: 'germany', name: 'Germany', continent: 'europe' },
  { id: 'greece', name: 'Greece', continent: 'europe' },
  { id: 'ireland', name: 'Ireland', continent: 'europe' },
  { id: 'italy', name: 'Italy', continent: 'europe' },
  { id: 'norway', name: 'Norway', continent: 'europe' },
  { id: 'poland', name: 'Poland', continent: 'europe' },
  { id: 'russia', name: 'Russia', continent: 'europe' },
  { id: 'spain', name: 'Spain', continent: 'europe' },
  { id: 'sweden', name: 'Sweden', continent: 'europe' },
  { id: 'uk', name: 'United Kingdom', continent: 'europe' },
  
  // North America
  { id: 'canada', name: 'Canada', continent: 'north-america' },
  { id: 'mexico', name: 'Mexico', continent: 'north-america' },
  { id: 'usa', name: 'United States', continent: 'north-america' },
  { id: 'guatemala', name: 'Guatemala', continent: 'north-america' },
  { id: 'cuba', name: 'Cuba', continent: 'north-america' },
  
  // South America
  { id: 'argentina', name: 'Argentina', continent: 'south-america' },
  { id: 'bolivia', name: 'Bolivia', continent: 'south-america' },
  { id: 'brazil', name: 'Brazil', continent: 'south-america' },
  { id: 'chile', name: 'Chile', continent: 'south-america' },
  { id: 'colombia', name: 'Colombia', continent: 'south-america' },
  { id: 'ecuador', name: 'Ecuador', continent: 'south-america' },
  { id: 'peru', name: 'Peru', continent: 'south-america' },
  
  // Oceania
  { id: 'australia', name: 'Australia', continent: 'oceania' },
  { id: 'fiji', name: 'Fiji', continent: 'oceania' },
  { id: 'new-zealand', name: 'New Zealand (Aotearoa)', continent: 'oceania' },
  { id: 'papua-new-guinea', name: 'Papua New Guinea', continent: 'oceania' },
  { id: 'samoa', name: 'Samoa', continent: 'oceania' },
  { id: 'tonga', name: 'Tonga', continent: 'oceania' },
];

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

export const getContinentById = (id: string): Continent | undefined => {
  return CONTINENTS.find(continent => continent.id === id);
};

export const getCountryById = (id: string): Country | undefined => {
  return COUNTRIES.find(country => country.id === id);
};

export const getCountriesByContinent = (continentId: string): Country[] => {
  return COUNTRIES.filter(country => country.continent === continentId);
};
