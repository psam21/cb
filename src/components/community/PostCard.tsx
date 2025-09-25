'use client';

import { logger } from '@/services/core/LoggingService';
import { BaseCard, BaseCardData } from '@/components/ui/BaseCard';

export interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    pubkey: string;
    npub: string;
  };
  publishedAt: number;
  tags: string[];
  image?: string;
  likes: number;
  comments: number;
  eventId: string;
}

interface PostCardProps {
  post: Post;
  onLike?: (post: Post) => void;
  onComment?: (post: Post) => void;
  onShare?: (post: Post) => void;
}

export const PostCard = ({ post, onLike, onComment, onShare }: PostCardProps) => {
  const handleLike = () => {
    logger.info('Post liked', {
      service: 'PostCard',
      method: 'handleLike',
      postId: post.id,
      title: post.title,
    });
    onLike?.(post);
  };

  const handleComment = () => {
    logger.info('Comment clicked', {
      service: 'PostCard',
      method: 'handleComment',
      postId: post.id,
      title: post.title,
    });
    onComment?.(post);
  };

  const handleShare = () => {
    logger.info('Share clicked', {
      service: 'PostCard',
      method: 'handleShare',
      postId: post.id,
      title: post.title,
    });
    onShare?.(post);
  };

  const handleNjumpClick = () => {
    logger.info('Njump link clicked', {
      service: 'PostCard',
      method: 'handleNjumpClick',
      postId: post.id,
      eventId: post.eventId,
    });
    
    window.open(`https://njump.me/${post.eventId}`, '_blank');
  };

  // Convert Post to BaseCardData
  const cardData: BaseCardData = {
    id: post.id,
    title: post.title,
    description: post.content,
    image: post.image,
    tags: post.tags,
    publishedAt: post.publishedAt,
    author: post.author,
    metadata: {
      likes: post.likes,
      comments: post.comments,
      eventId: post.eventId,
    },
  };

  return (
    <BaseCard
      data={cardData}
      className="h-full flex flex-col"
      contentClassName="flex-1 flex flex-col"
    >
      {/* Engagement Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {post.likes}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comments}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={handleLike}
          className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors duration-200"
        >
          Like
        </button>
        <button
          onClick={handleComment}
          className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors duration-200"
        >
          Comment
        </button>
        <button
          onClick={handleShare}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
        >
          Share
        </button>
        <button
          onClick={handleNjumpClick}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
          title="View on Nostr"
        >
          📱
        </button>
      </div>
    </BaseCard>
  );
};
