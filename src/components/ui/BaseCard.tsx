'use client';

import { ReactNode } from 'react';

export interface BaseCardData {
  id: string;
  title: string;
  description: string;
  image?: string;
  tags?: string[];
  publishedAt: number;
  author?: {
    name?: string;
    pubkey?: string;
    npub?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface BaseCardProps {
  data: BaseCardData;
  children?: ReactNode;
  className?: string;
  imageClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
  onImageClick?: (data: BaseCardData) => void;
  onTitleClick?: (data: BaseCardData) => void;
  onTagClick?: (tag: string) => void;
  onAuthorClick?: (data: BaseCardData) => void;
}

export const BaseCard = ({
  data,
  children,
  className = '',
  imageClassName = '',
  contentClassName = '',
  actionsClassName = '',
  onImageClick,
  onTitleClick,
  onTagClick,
  onAuthorClick,
}: BaseCardProps) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleImageClick = () => {
    onImageClick?.(data);
  };

  const handleTitleClick = () => {
    onTitleClick?.(data);
  };

  const handleTagClick = (tag: string) => {
    onTagClick?.(tag);
  };

  const handleAuthorClick = () => {
    onAuthorClick?.(data);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Image */}
      {data.image && (
        <div 
          className={`relative h-48 bg-gray-100 cursor-pointer ${imageClassName}`}
          onClick={handleImageClick}
        >
          <img
            src={data.image}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200" />
        </div>
      )}

      {/* Content */}
      <div className={`p-6 ${contentClassName}`}>
        {/* Title */}
        <h3 
          className={`text-lg font-semibold text-gray-900 mb-2 line-clamp-2 ${onTitleClick ? 'cursor-pointer hover:text-primary-600' : ''}`}
          onClick={handleTitleClick}
        >
          {data.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {data.description}
        </p>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {data.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className={`inline-block px-2 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-full ${onTagClick ? 'cursor-pointer hover:bg-primary-200' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </span>
            ))}
            {data.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                +{data.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Author & Date */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          {data.author && (
            <div 
              className={`flex items-center ${onAuthorClick ? 'cursor-pointer hover:text-primary-600' : ''}`}
              onClick={handleAuthorClick}
            >
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-primary-700">
                  {data.author.name?.charAt(0) || '?'}
                </span>
              </div>
              <span>{data.author.name || 'Anonymous'}</span>
            </div>
          )}
          <span>{formatDate(data.publishedAt)}</span>
        </div>

        {/* Custom Actions */}
        {children && (
          <div className={`flex gap-2 ${actionsClassName}`}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
