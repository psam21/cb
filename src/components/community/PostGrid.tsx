'use client';

import { logger } from '@/services/core/LoggingService';
import { BaseGrid, BaseGridData } from '@/components/ui/BaseGrid';
import { PostCard, Post } from './PostCard';

interface PostGridProps {
  posts: Post[];
  onLike?: (post: Post) => void;
  onComment?: (post: Post) => void;
  onShare?: (post: Post) => void;
}

export const PostGrid = ({ posts, onLike, onComment, onShare }: PostGridProps) => {
  // Convert Post to BaseGridData
  const gridData: BaseGridData[] = posts.map(post => ({
    id: post.id,
    title: post.title,
    description: post.content,
    category: 'Community Post', // Could be dynamic based on post type
    tags: post.tags,
    publishedAt: post.publishedAt,
    // Include all post data for filtering
    author: post.author,
    likes: post.likes,
    comments: post.comments,
    eventId: post.eventId,
  }));

  const renderPost = (item: BaseGridData) => {
    // Convert back to Post for the card
    const post: Post = {
      id: item.id,
      title: item.title,
      content: item.description,
      author: (item.author as { name: string; pubkey: string; npub: string }) || { name: 'Anonymous', pubkey: '', npub: '' },
      publishedAt: item.publishedAt,
      tags: item.tags || [],
      image: item.image as string | undefined,
      likes: (item.likes as number) || 0,
      comments: (item.comments as number) || 0,
      eventId: (item.eventId as string) || '',
    };

    return (
      <PostCard
        key={post.id}
        post={post}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
      />
    );
  };

  const searchFields = [
    { key: 'title', label: 'Title', weight: 3 },
    { key: 'description', label: 'Content', weight: 2 },
    { key: 'tags', label: 'Tags', weight: 1 },
  ];

  const filterFields = [
    { key: 'category', label: 'Category', type: 'select' as const },
  ];

  const sortOptions = [
    { key: 'publishedAt', label: 'Newest First', direction: 'desc' as const },
    { key: 'publishedAt', label: 'Oldest First', direction: 'asc' as const },
    { key: 'likes', label: 'Most Liked', direction: 'desc' as const },
    { key: 'comments', label: 'Most Commented', direction: 'desc' as const },
  ];

  const emptyState = {
    title: 'No posts found',
    description: 'No community posts have been created yet',
    action: {
      label: 'Create First Post',
      onClick: () => {
        logger.info('Create first post clicked', {
          service: 'PostGrid',
          method: 'emptyState.action.onClick',
        });
        // This would need to be passed as a prop or handled by parent
      },
    },
  };

  return (
    <BaseGrid
      data={gridData}
      renderItem={renderPost}
      searchFields={searchFields}
      filterFields={filterFields}
      sortOptions={sortOptions}
      emptyState={emptyState}
      searchPlaceholder="Search posts..."
      gridClassName="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
    />
  );
};
