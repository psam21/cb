import { Exhibition, ExhibitionsDataBundle } from '../types/content';

// Minimal base64 1x1 fallback (neutral tone) reused across artifacts
const FALLBACK_IMG =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmMmYyZjIiIC8+PC9zdmc+';

// Initial restored exhibitions dataset (can be expanded or replaced with fetch later)
export const exhibitions: Exhibition[] = [
  {
    id: 1,
    slug: 'navajo-weaving-patterns',
    title: 'Navajo Weaving Patterns',
    subtitle: 'Geometry, Story & Cosmic Order',
    culture: 'Navajo',
    region: 'Southwest United States',
    category: 'Traditional Arts',
    description:
      'Explore sacred Navajo weaving patterns, their symbolic relationship to landscape, memory, and cosmology—preserved through intergenerational mentorship.',
    featured: true,
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=800&h=500&fit=crop',
    fallback: FALLBACK_IMG,
    contributors: 14,
    artifacts: [
      {
        id: 11,
        title: 'Spider Woman Motif',
        type: 'image',
        description: 'Design referencing the origin story of weaving taught by Spider Woman.',
        media: 'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=600&h=400&fit=crop',
        fallback: FALLBACK_IMG,
        attribution: 'Collected from Grandmother Yazzie',
        tags: ['motif', 'myth', 'origin'],
      },
      {
        id: 12,
        title: 'Loom Assembly Audio Explanation',
        type: 'audio',
        description: 'Overview of ritual considerations when assembling a traditional loom.',
        media: 'https://example.com/audio/loom-assembly.mp3',
        fallback: FALLBACK_IMG,
        attribution: 'Elder Weaver Collective',
        tags: ['audio', 'ritual'],
      },
      {
        id: 13,
        title: 'Dyes & Natural Pigments Guide',
        type: 'text',
        description: 'Short reference on plant + mineral sources for traditional color palette.',
        media: 'https://example.com/text/dyes-guide',
        fallback: FALLBACK_IMG,
        tags: ['reference', 'materials'],
      },
    ],
    lastUpdated: '3 days ago',
    tags: ['weaving', 'geometry', 'cosmology', 'textiles'],
    difficulty: 'Intermediate',
  },
  {
    id: 2,
    slug: 'andean-oral-epics',
    title: 'Andean Oral Epics',
    subtitle: 'Mountains, Memory & Migration',
    culture: 'Quechua',
    region: 'Andes',
    category: 'Storytelling',
    description:
      'Multi-part oral history narratives capturing seasonal cycles, mountain spirits, and social memory across Andean highland communities.',
    featured: false,
    image: 'https://images.unsplash.com/photo-1606114741394-70d17f9fc14f?w=800&h=500&fit=crop',
    fallback: FALLBACK_IMG,
    contributors: 9,
    artifacts: [
      {
        id: 21,
        title: 'Opening Invocation (Audio)',
        type: 'audio',
        description: 'Ritual preface invoking Apus (mountain spirits) before epic narration.',
        media: 'https://example.com/audio/andean-invocation.mp3',
        fallback: FALLBACK_IMG,
        tags: ['ritual', 'invocation'],
      },
      {
        id: 22,
        title: 'Transcribed Segment: The River Crossing',
        type: 'text',
        description: 'Excerpt describing community migration during seasonal changes.',
        media: 'https://example.com/text/river-crossing',
        fallback: FALLBACK_IMG,
        tags: ['migration', 'excerpt'],
      },
    ],
    lastUpdated: '1 week ago',
    tags: ['oral tradition', 'migration', 'ritual'],
    difficulty: 'Introductory',
  },
  {
    id: 3,
    slug: 'japanese-tea-utensils',
    title: 'Japanese Tea Ceremony Utensils',
    subtitle: 'Embodied Aesthetics in Practice',
    culture: 'Japanese',
    region: 'Japan',
    category: 'Ceremony',
    description:
      'Selected utensils (chadōgu) illustrating wabi-sabi aesthetics, material selection, and seasonal rotation within the tea ceremony tradition.',
    featured: false,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
    fallback: FALLBACK_IMG,
    contributors: 11,
    artifacts: [
      {
        id: 31,
        title: 'Chawan (Tea Bowl) – Winter Glaze',
        type: 'image',
        description: 'Rustic iron-rich glaze emphasizing warmth during cold months.',
        media: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop',
        fallback: FALLBACK_IMG,
        tags: ['chawan', 'seasonal', 'wabi-sabi'],
      },
      {
        id: 32,
        title: 'Furo vs. Ro Usage Chart',
        type: 'text',
        description: 'Reference comparing summer (furo) and winter (ro) hearth usage timelines.',
        media: 'https://example.com/text/furo-ro-chart',
        fallback: FALLBACK_IMG,
        tags: ['seasonal', 'reference'],
      },
    ],
    lastUpdated: '5 days ago',
    tags: ['aesthetics', 'seasonal rotation', 'tea ceremony'],
    difficulty: 'Introductory',
  },
];

export const exhibitionCategories = [
  'All',
  'Traditional Arts',
  'Storytelling',
  'Ceremony',
  'Music & Dance',
];

export const exhibitionRegions = ['All', 'Southwest United States', 'Andes', 'Japan'];

export const exhibitionsData: ExhibitionsDataBundle = {
  exhibitions,
  categories: exhibitionCategories,
  regions: exhibitionRegions,
};

export default exhibitionsData;
