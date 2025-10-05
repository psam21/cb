import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, MapPin, Bookmark, MessageCircle } from 'lucide-react';
import { logger } from '@/services/core/LoggingService';
import { filterVisibleTags } from '@/utils/tagFilter';

export interface HeritageCardData {
  id: string;
  dTag: string;
  title: string;
  description: string;
  heritageType: string;
  category: string;
  timePeriod: string;
  regionOrigin: string;
  country?: string;
  imageUrl?: string;
  tags: string[];
  pubkey: string; // Author's pubkey for contact functionality
}

interface HeritageCardProps {
  contribution: HeritageCardData;
}

export const HeritageCard: React.FC<HeritageCardProps> = ({ contribution }) => {
  const router = useRouter();

  const handleContactContributor = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to detail page
    e.stopPropagation();

    logger.info('Contact contributor clicked', {
      service: 'HeritageCard',
      method: 'handleContactContributor',
      contributionId: contribution.id,
      title: contribution.title,
    });

    // Navigate to messages with context (same as detail page)
    const params = new URLSearchParams({
      recipient: contribution.pubkey,
      context: `heritage:${contribution.id}`,
      contextTitle: contribution.title || 'Heritage',
      ...(contribution.imageUrl && { contextImage: contribution.imageUrl }),
    });

    router.push(`/messages?${params.toString()}`);
  };

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

  return (
    <Link href={`/heritage/${contribution.dTag}`}>
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
                  service: 'HeritageCard',
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

          {/* Bookmark Icon */}
          <div className="absolute top-3 right-3">
            <button
              className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
              aria-label="Bookmark contribution"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement bookmark functionality
                logger.info('Bookmark clicked', {
                  service: 'HeritageCard',
                  contributionId: contribution.id,
                });
              }}
            >
              <Bookmark className="w-4 h-4 text-primary-600" />
            </button>
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
          
          {/* Tags */}
          {contribution.tags.length > 0 && (() => {
            const visibleTags = filterVisibleTags(contribution.tags);
            return visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {visibleTags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-accent-50 text-accent-700 text-xs rounded-full font-medium px-2 py-1"
                  >
                    #{tag}
                  </span>
                ))}
                {visibleTags.length > 3 && (
                  <span className="text-gray-500 text-xs">
                    +{visibleTags.length - 3} more
                  </span>
                )}
              </div>
            );
          })()}

          {/* Contact Contributor Button */}
          <button
            onClick={handleContactContributor}
            className="w-full btn-primary-sm flex items-center justify-center gap-2"
            aria-label="Contact contributor"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Contributor
          </button>
        </div>
      </div>
    </Link>
  );
};
