import { ElderStory } from '../types/content';

export const elderStories: ElderStory[] = [
  {
    id: 1,
    title: 'Mountain Spirits and Ancient Paths',
    elder: 'Mama Quispe',
    age: 82,
    culture: 'Quechua',
    location: 'Sacred Valley, Peru',
    description:
      'Mama Quispe shares the ancient stories of mountain spirits that have guided her people for generations.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5NYW1hIFF1aXNwZTwvdGV4dD48L3N2Zz4=',
    duration: '24:15',
    category: 'Spiritual Wisdom',
    language: 'Quechua with English subtitles',
    featured: true,
    listens: 2840,
    rating: 4.9,
    recorded: '2024-12-10',
    quote:
      'The mountains speak to those who know how to listen. Every stone has a story, every wind carries wisdom.',
  },
  {
    id: 2,
    title: 'The Way of Tea and Mindfulness',
    elder: 'Tanaka-san',
    age: 89,
    culture: 'Japanese',
    location: 'Kyoto, Japan',
    description:
      'Master Tanaka shares 60 years of tea ceremony wisdom, teaching the path to inner peace through ritual.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5UYW5ha2Etc2FuPC90ZXh0Pjwvc3ZnPg==',
    duration: '18:42',
    category: 'Philosophy',
    language: 'Japanese with English subtitles',
    featured: true,
    listens: 1920,
    rating: 4.8,
    recorded: '2024-12-08',
    quote:
      'In each movement of the tea ceremony, we find harmony. In each sip, we taste the present moment.',
  },
  {
    id: 3,
    title: 'Weaving Stories in Sacred Patterns',
    elder: 'Grandmother Yazzie',
    age: 76,
    culture: 'Navajo',
    location: 'Monument Valley, Arizona',
    description:
      'Grandmother Yazzie reveals the sacred meanings behind Navajo weaving patterns passed down through generations.',
    image: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5HcmFuZG1vdGhlcjwvdGV4dD48L3N2Zz4=',
    duration: '31:28',
    category: 'Traditional Arts',
    language: 'English and Navajo',
    featured: false,
    listens: 1540,
    rating: 4.9,
    recorded: '2024-12-05',
    quote: 'Each thread carries the memory of my ancestors. When I weave, I am never alone.',
  },
  {
    id: 4,
    title: 'Tango of Memory and Passion',
    elder: 'Don Carlos',
    age: 84,
    culture: 'Argentine',
    location: 'La Boca, Buenos Aires',
    description:
      'Don Carlos recounts the golden age of tango, sharing stories of passion, loss, and the soul of Buenos Aires.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ii8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5Eb24gQ2FybG9zPC90ZXh0Pjwvc3ZnPg==',
    duration: '26:53',
    category: 'Music & Dance',
    language: 'Spanish with English subtitles',
    featured: false,
    listens: 1180,
    rating: 4.7,
    recorded: '2024-12-02',
    quote:
      'Tango is not just dance - it is the heartbeat of our city, the story of our people written in movement.',
  },
  {
    id: 5,
    title: 'Songs of the Ancient Pub',
    elder: "Seamus O'Sullivan",
    age: 91,
    culture: 'Irish',
    location: 'County Cork, Ireland',
    description:
      'Seamus shares traditional Irish songs and stories from a lifetime of gathering in village pubs.',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ci8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5TZWFtdXM8L3RleHQ+PC9zdmc+',
    duration: '22:17',
    category: 'Folk Traditions',
    language: 'English and Irish Gaelic',
    featured: false,
    listens: 980,
    rating: 4.8,
    recorded: '2024-11-28',
    quote:
      'In the pub, we are all equal. The music brings us together, and the stories keep us whole.',
  },
  {
    id: 6,
    title: 'Clay Wisdom from Ancient Hands',
    elder: 'Abuela Esperanza',
    age: 78,
    culture: 'Zapotec',
    location: 'Oaxaca, Mexico',
    description:
      'Abuela Esperanza shares the spiritual connection between potter and clay in the ancient traditions of Oaxaca.',
    image: 'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=400&h=300&fit=crop',
    fallback:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM3MzRjMmQiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSIjOGZiYzk0Ci8+PHRleHQgeD0iMjAwIiB5PSIyMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5BYnVlbGE8L3RleHQ+PC9zdmc+',
    duration: '19:35',
    category: 'Traditional Arts',
    language: 'Spanish with English subtitles',
    featured: false,
    listens: 820,
    rating: 4.9,
    recorded: '2024-11-25',
    quote: 'The clay teaches patience. It knows when it is ready, and we must learn to listen.',
  },
];
