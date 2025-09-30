import React from 'react';
import Image from 'next/image';
import { Clock, MapPin } from 'lucide-react';
import { logger } from '@/services/core/LoggingService';
import type { HeritageCardData } from './HeritageCard';

interface MyContributionCardProps {
  contribution: HeritageCardData;
  onEdit: (contribution: HeritageCardData) => void;
  onDelete: (contribution: HeritageCardData) => void;
}

export const MyContributionCard: React.FC<MyContributionCardProps> = ({ 
  contribution, 
  onEdit, 
  onDelete
}) => {
  const getHeritageTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('ritual') || lowerType.includes('ceremony')) {
      return 'bg-accent-100 text-accent-700';
    }
    if (lowerType.includes('art') || lowerType.includes('craft')) {
      return 'bg-primary-100 text-primary-700';
    }
    if (lowerType.includes('oral') || lowerType.includes('story')) {
      return 'bg-earth-100 text-earth-700';
    }
    if (lowerType.includes('music') || lowerType.includes('dance')) {
      return 'bg-purple-100 text-purple-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const handleEdit = () => {
    logger.info('Edit contribution clicked', {
      service: 'MyContributionCard',
      method: 'handleEdit',
      contributionId: contribution.id,
      title: contribution.title,
    });
    onEdit(contribution);
  };

  const handleDelete = () => {
    logger.info('Delete contribution clicked', {
      service: 'MyContributionCard',
      method: 'handleDelete',
      contributionId: contribution.id,
      title: contribution.title,
    });
    onDelete(contribution);
  };

  return (
    <div className="card overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Heritage Image */}
      <div className="relative aspect-[4/3] bg-primary-50">
        {contribution.imageUrl ? (
          <Image
            src={contribution.imageUrl}
            alt={contribution.title}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              logger.warn('Heritage image failed to load', {
                service: 'MyContributionCard',
                method: 'handleImageError',
                contributionId: contribution.id,
                imageUrl: contribution.imageUrl,
              });
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-primary-100">
                    <svg class="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-100">
            <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Heritage Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHeritageTypeColor(contribution.heritageType)}`}>
            {contribution.heritageType}
          </span>
        </div>
      </div>
      
      {/* Heritage Info */}
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-primary-800 mb-2 line-clamp-2">
          {contribution.title}
        </h3>
        
        <p className="text-base mb-4 line-clamp-3 leading-relaxed text-primary-600">
          {contribution.description}
        </p>
        
        {/* Time Period and Region */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{contribution.timePeriod}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>
              {contribution.regionOrigin}
              {contribution.country && `, ${contribution.country}`}
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium text-sm">
            {contribution.category}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <a
            href={`/heritage/${contribution.dTag}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-sm flex items-center justify-center px-3"
            title="View contribution"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </a>
          <button 
            onClick={handleEdit} 
            className="btn-primary-sm flex-1"
          >
            Edit
          </button>
          <button 
            onClick={handleDelete} 
            className="btn-danger-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
