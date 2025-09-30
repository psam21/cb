/**
 * Centralized category configuration for both shop products and heritage contributions
 * Used across the platform for consistent categorization
 */

export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string; // Optional icon name for UI
  applicableTo: ('shop' | 'heritage')[];
}

export const CATEGORIES: Category[] = [
  // Universal Categories (applicable to both shop and heritage)
  {
    id: 'art',
    name: 'Art & Crafts',
    description: 'Visual arts, crafts, and artistic creations',
    applicableTo: ['shop', 'heritage'],
  },
  {
    id: 'textiles',
    name: 'Textiles & Clothing',
    description: 'Woven goods, traditional clothing, and fabric arts',
    applicableTo: ['shop', 'heritage'],
  },
  {
    id: 'jewelry',
    name: 'Jewelry & Accessories',
    description: 'Jewelry, beadwork, and personal adornments',
    applicableTo: ['shop', 'heritage'],
  },
  {
    id: 'pottery',
    name: 'Pottery & Ceramics',
    description: 'Clay work, pottery, and ceramic arts',
    applicableTo: ['shop', 'heritage'],
  },
  {
    id: 'woodwork',
    name: 'Woodwork & Carving',
    description: 'Carved items, wooden crafts, and sculptures',
    applicableTo: ['shop', 'heritage'],
  },
  {
    id: 'basketry',
    name: 'Basketry & Weaving',
    description: 'Baskets, woven items, and traditional weaving',
    applicableTo: ['shop', 'heritage'],
  },
  {
    id: 'music',
    name: 'Music & Instruments',
    description: 'Musical instruments and music-related items',
    applicableTo: ['shop', 'heritage'],
  },
  {
    id: 'books',
    name: 'Books & Literature',
    description: 'Books, manuscripts, and written materials',
    applicableTo: ['shop', 'heritage'],
  },
  {
    id: 'tools',
    name: 'Tools & Implements',
    description: 'Traditional tools and practical implements',
    applicableTo: ['shop', 'heritage'],
  },
  {
    id: 'home',
    name: 'Home & Decor',
    description: 'Home goods, decorative items, and furnishings',
    applicableTo: ['shop', 'heritage'],
  },
  
  // Shop-Specific Categories
  {
    id: 'digital',
    name: 'Digital Products',
    description: 'E-books, courses, and digital downloads',
    applicableTo: ['shop'],
  },
  {
    id: 'food',
    name: 'Food & Beverages',
    description: 'Traditional foods, spices, and beverages',
    applicableTo: ['shop'],
  },
  {
    id: 'wellness',
    name: 'Wellness & Beauty',
    description: 'Natural remedies, cosmetics, and wellness products',
    applicableTo: ['shop'],
  },
  
  // Heritage-Specific Categories
  {
    id: 'oral-tradition',
    name: 'Oral Traditions',
    description: 'Stories, legends, and spoken knowledge',
    applicableTo: ['heritage'],
  },
  {
    id: 'ceremony',
    name: 'Ceremonies & Rituals',
    description: 'Traditional ceremonies and ritual practices',
    applicableTo: ['heritage'],
  },
  {
    id: 'dance',
    name: 'Dance & Performance',
    description: 'Traditional dances and performance arts',
    applicableTo: ['heritage'],
  },
  {
    id: 'language',
    name: 'Language & Writing',
    description: 'Language preservation and writing systems',
    applicableTo: ['heritage'],
  },
  {
    id: 'knowledge',
    name: 'Traditional Knowledge',
    description: 'Indigenous knowledge and wisdom',
    applicableTo: ['heritage'],
  },
  {
    id: 'architecture',
    name: 'Architecture & Structures',
    description: 'Traditional building methods and structures',
    applicableTo: ['heritage'],
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Farming',
    description: 'Traditional farming and agricultural practices',
    applicableTo: ['heritage'],
  },
  {
    id: 'medicine',
    name: 'Traditional Medicine',
    description: 'Healing practices and medicinal knowledge',
    applicableTo: ['heritage'],
  },
  {
    id: 'navigation',
    name: 'Navigation & Wayfinding',
    description: 'Traditional navigation and orientation methods',
    applicableTo: ['heritage'],
  },
  {
    id: 'games',
    name: 'Games & Sports',
    description: 'Traditional games and sporting activities',
    applicableTo: ['heritage'],
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Items that don\'t fit other categories',
    applicableTo: ['shop', 'heritage'],
  },
];

// Helper functions
export const getShopCategories = (): Category[] => {
  return CATEGORIES.filter(cat => cat.applicableTo.includes('shop'));
};

export const getHeritageCategories = (): Category[] => {
  return CATEGORIES.filter(cat => cat.applicableTo.includes('heritage'));
};

export const getCategoryById = (id: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryByName = (name: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.name === name);
};

// Format category for dropdown display
export const formatCategoryDisplay = (category: Category): string => {
  return category.name;
};
