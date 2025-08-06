import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CultureCardProps {
  culture: {
    id: number;
    name: string;
    location: string;
    image: string;
    contributors: number;
    stories: number;
    tags: string[];
    description?: string;
  };
  featured?: boolean;
}

export default function CultureCard({ culture, featured = false }: CultureCardProps) {
  return (
    <div className={`culture-card ${featured ? 'lg:col-span-2' : ''}`}>
      <div className="relative aspect-video overflow-hidden">
        <img
          src={culture.image}
          alt={culture.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-accent-600 text-white px-2 py-1 rounded-md text-xs font-medium">
          Nostr Verified
        </div>
        {featured && (
          <div className="absolute top-3 left-3 bg-primary-800 text-white px-2 py-1 rounded-md text-xs font-medium">
            Featured
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-primary-800 mb-2">
          {culture.name}
        </h3>
        <p className="text-gray-600 mb-4">{culture.location}</p>
        
        {featured && culture.description && (
          <p className="text-gray-700 mb-4">{culture.description}</p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{culture.contributors} contributors</span>
          <span>{culture.stories} stories</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {culture.tags.slice(0, featured ? 4 : 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs"
            >
              {tag}
            </span>
          ))}
          {culture.tags.length > (featured ? 4 : 2) && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
              +{culture.tags.length - (featured ? 4 : 2)} more
            </span>
          )}
        </div>
        
        <button className="text-primary-800 font-medium hover:text-accent-600 transition-colors duration-200 flex items-center w-full justify-center py-2">
          Explore Culture
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
