# Bookmarks and Favorites System

**Status**: Planned  
**Priority**: Medium  
**Dependencies**: KVService (implemented), User Authentication (implemented)  
**Target Implementation**: Q1 2026  
**Last Updated**: October 16, 2025

---

## 📋 Overview

A cross-site bookmarking and favorites system that allows authenticated users to save and organize content from Heritage, Shop, Community, and other sections. Data will be stored using KVService (Upstash Redis) for fast, distributed access.

---

## 🎯 Goals

### Primary Goals
1. Allow users to bookmark/favorite content across all site sections
2. Persist bookmarks across sessions and devices
3. Provide fast access to saved content
4. Enable content discovery through aggregate favorites data

### Secondary Goals
1. Privacy-preserving (user favorites not publicly visible by default)
2. Support for collections/lists organization
3. Sync with Nostr NIP-51 Lists (future)
4. Analytics on most favorited content

---

## 🏗️ Architecture

### Storage Strategy: KVService (Upstash Redis)

**Rationale for KVService over Nostr NIP-51:**
- **Speed**: Instant read/write without relay coordination
- **Privacy**: Favorites stored privately, not broadcasted
- **Flexibility**: Easy to implement collections, categories, metadata
- **Reliability**: No dependency on relay availability
- **Future Migration Path**: Can later sync to Nostr NIP-51 for portability

**Data Structure:**

```typescript
// Key Pattern: bookmarks:{userPubkey}
// Value: JSON object
{
  heritage: {
    "contribution-abc123": {
      bookmarkedAt: 1697654400000,
      title: "Andean Weaving Traditions",
      imageUrl: "https://...",
      category: "Textiles",
      tags: ["weaving", "andes"]
    }
  },
  shop: {
    "product-xyz789": {
      bookmarkedAt: 1697654500000,
      title: "Handcrafted Quechua Textile",
      imageUrl: "https://...",
      price: 45.00,
      currency: "USD"
    }
  },
  community: {
    "member-456": {
      bookmarkedAt: 1697654600000,
      name: "Carlos Mamani",
      role: "Andean Storyteller"
    }
  },
  collections: {
    "textiles": {
      name: "Traditional Textiles",
      description: "Collection of textile heritage",
      items: ["contribution-abc123", "product-xyz789"],
      createdAt: 1697654700000
    }
  }
}
```

---

## 🔧 Implementation Plan

### Phase 1: Core Bookmark Service (Week 1-2)

**Create `/src/services/business/BookmarkBusinessService.ts`:**

```typescript
/**
 * Bookmark Business Service
 * Manages user bookmarks and favorites across all content types
 * Uses KVService (Upstash Redis) for storage
 */
export class BookmarkBusinessService {
  private static instance: BookmarkBusinessService;

  // Bookmark Management
  async addBookmark(
    userPubkey: string,
    contentType: 'heritage' | 'shop' | 'community' | 'exhibition',
    contentId: string,
    metadata: BookmarkMetadata
  ): Promise<{ success: boolean; error?: string }>;

  async removeBookmark(
    userPubkey: string,
    contentType: string,
    contentId: string
  ): Promise<{ success: boolean; error?: string }>;

  async isBookmarked(
    userPubkey: string,
    contentType: string,
    contentId: string
  ): Promise<boolean>;

  async getBookmarks(
    userPubkey: string,
    contentType?: string
  ): Promise<BookmarksData>;

  async getBookmarkCount(userPubkey: string): Promise<number>;

  // Collections Management
  async createCollection(
    userPubkey: string,
    name: string,
    description?: string
  ): Promise<{ success: boolean; collectionId?: string; error?: string }>;

  async addToCollection(
    userPubkey: string,
    collectionId: string,
    contentId: string
  ): Promise<{ success: boolean; error?: string }>;

  async removeFromCollection(
    userPubkey: string,
    collectionId: string,
    contentId: string
  ): Promise<{ success: boolean; error?: string }>;

  async getCollection(
    userPubkey: string,
    collectionId: string
  ): Promise<Collection | null>;

  async listCollections(userPubkey: string): Promise<Collection[]>;

  // Aggregate Analytics (Optional)
  async getMostBookmarked(
    contentType: string,
    limit: number
  ): Promise<ContentSummary[]>;
}
```

**Key Pattern in KVService:**
```
bookmarks:{userPubkey} → User's bookmarks data (JSON)
bookmarks:count:{contentType}:{contentId} → Bookmark count per content
bookmarks:trending:{contentType} → Sorted set of trending content
```

---

### Phase 2: React Hook (Week 2)

**Create `/src/hooks/useBookmarks.ts`:**

```typescript
/**
 * Hook for managing user bookmarks
 * Provides bookmark state and actions with optimistic updates
 */
export const useBookmarks = () => {
  const { isAuthenticated, userPubkey } = useAuthStore();
  const [bookmarks, setBookmarks] = useState<BookmarksData | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if specific content is bookmarked
  const isBookmarked = useCallback(
    (contentType: string, contentId: string): boolean => {
      if (!bookmarks) return false;
      return !!bookmarks[contentType]?.[contentId];
    },
    [bookmarks]
  );

  // Toggle bookmark (add or remove)
  const toggleBookmark = useCallback(
    async (
      contentType: 'heritage' | 'shop' | 'community',
      contentId: string,
      metadata: BookmarkMetadata
    ): Promise<boolean> => {
      if (!isAuthenticated || !userPubkey) {
        throw new AppError('User must be authenticated', {
          code: ErrorCode.UNAUTHORIZED,
          category: ErrorCategory.AUTHENTICATION,
          severity: ErrorSeverity.LOW,
        });
      }

      const currentlyBookmarked = isBookmarked(contentType, contentId);

      // Optimistic update
      setBookmarks((prev) => {
        const updated = { ...prev };
        if (currentlyBookmarked) {
          delete updated[contentType][contentId];
        } else {
          updated[contentType] = {
            ...updated[contentType],
            [contentId]: { ...metadata, bookmarkedAt: Date.now() },
          };
        }
        return updated;
      });

      // Actual update
      const result = currentlyBookmarked
        ? await bookmarkService.removeBookmark(userPubkey, contentType, contentId)
        : await bookmarkService.addBookmark(userPubkey, contentType, contentId, metadata);

      if (!result.success) {
        // Revert optimistic update on failure
        await fetchBookmarks();
        throw new AppError(result.error || 'Failed to update bookmark', {
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          category: ErrorCategory.EXTERNAL_SERVICE,
          severity: ErrorSeverity.MEDIUM,
        });
      }

      return !currentlyBookmarked; // Return new state
    },
    [isAuthenticated, userPubkey, isBookmarked]
  );

  return {
    bookmarks,
    loading,
    isBookmarked,
    toggleBookmark,
    refreshBookmarks: fetchBookmarks,
    bookmarkCount: bookmarks ? Object.keys(bookmarks).length : 0,
  };
};
```

---

### Phase 3: UI Components (Week 3)

**Update Existing Components:**

1. **HeritageCard.tsx** - Replace TODO with working bookmark button
2. **ShopProductCard.tsx** - Add bookmark icon
3. **CommunityMemberCard.tsx** - Add favorite icon

**BookmarkButton Component:**

```typescript
/**
 * Generic bookmark button component
 * Can be used across Heritage, Shop, Community pages
 */
export const BookmarkButton: React.FC<{
  contentType: 'heritage' | 'shop' | 'community';
  contentId: string;
  metadata: BookmarkMetadata;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}> = ({ contentType, contentId, metadata, variant = 'icon', size = 'md' }) => {
  const { isBookmarked, toggleBookmark, loading } = useBookmarks();
  const bookmarked = isBookmarked(contentType, contentId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await toggleBookmark(contentType, contentId, metadata);
      toast.success(bookmarked ? 'Bookmark removed' : 'Bookmarked!');
    } catch (error) {
      toast.error('Failed to update bookmark');
      logger.error('Bookmark toggle failed', error, {
        service: 'BookmarkButton',
        contentType,
        contentId,
      });
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`p-2 rounded-full transition-colors ${
          bookmarked
            ? 'bg-primary-600 text-white'
            : 'bg-white/80 hover:bg-white text-primary-600'
        }`}
        aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        <Bookmark
          className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`}
        />
      </button>
    );
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-secondary">
      <Bookmark className={bookmarked ? 'fill-current' : ''} />
      {bookmarked ? 'Bookmarked' : 'Bookmark'}
    </button>
  );
};
```

**New Bookmarks Page (`/bookmarks`):**

```typescript
// src/app/bookmarks/page.tsx
export default function BookmarksPage() {
  const { bookmarks, loading } = useBookmarks();
  const [filter, setFilter] = useState<'all' | 'heritage' | 'shop' | 'community'>('all');

  return (
    <div className="container-width py-12">
      <h1 className="text-4xl font-bold mb-8">My Bookmarks</h1>
      
      {/* Filter Tabs */}
      <div className="flex gap-4 mb-8">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('heritage')}>Heritage</button>
        <button onClick={() => setFilter('shop')}>Shop</button>
        <button onClick={() => setFilter('community')}>Community</button>
      </div>

      {/* Bookmark Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {filteredBookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>
    </div>
  );
}
```

---

### Phase 4: KVService Integration (Week 3-4)

**Extend KVService for Bookmarks:**

```typescript
// In /src/services/core/KVService.ts
export class KVService {
  // ... existing methods

  /**
   * Get user bookmarks from Redis
   */
  async getUserBookmarks(userPubkey: string): Promise<BookmarksData | null> {
    const key = `bookmarks:${userPubkey}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Set user bookmarks in Redis
   */
  async setUserBookmarks(
    userPubkey: string,
    bookmarks: BookmarksData
  ): Promise<void> {
    const key = `bookmarks:${userPubkey}`;
    await this.redis.set(key, JSON.stringify(bookmarks));
  }

  /**
   * Increment bookmark count for content
   * Used for trending/popular content analytics
   */
  async incrementBookmarkCount(
    contentType: string,
    contentId: string
  ): Promise<number> {
    const key = `bookmarks:count:${contentType}:${contentId}`;
    return await this.redis.incr(key);
  }

  /**
   * Get most bookmarked content (for trending section)
   */
  async getMostBookmarked(
    contentType: string,
    limit: number = 10
  ): Promise<{ contentId: string; count: number }[]> {
    // Implementation using Redis sorted sets
    const key = `bookmarks:trending:${contentType}`;
    const results = await this.redis.zrevrange(key, 0, limit - 1, {
      withScores: true,
    });
    
    return results.map(([contentId, count]) => ({
      contentId,
      count: parseInt(count as string),
    }));
  }
}
```

---

## 📊 TypeScript Types

**Create `/src/types/bookmarks.ts`:**

```typescript
/**
 * Bookmark metadata for Heritage contributions
 */
export interface HeritageBookmarkMetadata {
  title: string;
  description?: string;
  imageUrl?: string;
  category: string;
  heritageType: string;
  tags: string[];
}

/**
 * Bookmark metadata for Shop products
 */
export interface ShopBookmarkMetadata {
  title: string;
  description?: string;
  imageUrl?: string;
  price: number;
  currency: string;
  condition: 'new' | 'used' | 'refurbished';
  category: string;
}

/**
 * Bookmark metadata for Community members
 */
export interface CommunityBookmarkMetadata {
  name: string;
  role: string;
  culture: string;
  location: string;
  bio?: string;
  imageUrl?: string;
}

/**
 * Generic bookmark metadata
 */
export type BookmarkMetadata =
  | HeritageBookmarkMetadata
  | ShopBookmarkMetadata
  | CommunityBookmarkMetadata;

/**
 * Bookmark entry with timestamp
 */
export interface Bookmark<T = BookmarkMetadata> {
  bookmarkedAt: number;
  metadata: T;
}

/**
 * User's complete bookmarks data
 */
export interface BookmarksData {
  heritage: Record<string, Bookmark<HeritageBookmarkMetadata>>;
  shop: Record<string, Bookmark<ShopBookmarkMetadata>>;
  community: Record<string, Bookmark<CommunityBookmarkMetadata>>;
  collections?: Record<string, Collection>;
}

/**
 * Collection of bookmarks
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  items: string[]; // Content IDs
  createdAt: number;
  updatedAt: number;
}

/**
 * Content summary for trending/popular lists
 */
export interface ContentSummary {
  contentId: string;
  contentType: 'heritage' | 'shop' | 'community';
  bookmarkCount: number;
  title: string;
  imageUrl?: string;
}
```

---

## 🔐 Security Considerations

### Authentication Requirements
- All bookmark operations require authenticated user (pubkey)
- Bookmarks are private by default (not publicly visible)
- No access to other users' bookmarks without permission

### Data Privacy
- User bookmarks stored in Redis with user pubkey as key
- No tracking of what content users bookmark (unless opted-in)
- Optional: Allow users to share collections publicly

### Rate Limiting
- Limit bookmark additions to prevent spam: 100 per hour per user
- Implement in KVService using Redis rate limiting patterns

---

## 🚀 Rollout Strategy

### Beta Phase (Week 5)
1. Deploy bookmark service to staging
2. Internal testing with team
3. Fix bugs and refine UX

### Soft Launch (Week 6)
1. Deploy to production with feature flag
2. Enable for 10% of users
3. Monitor performance and user feedback

### Full Launch (Week 7)
1. Enable for all authenticated users
2. Add bookmarks page to main navigation
3. Announce feature in changelog

---

## 📈 Success Metrics

### User Engagement
- **Target**: 30% of authenticated users bookmark at least one item within 30 days
- **Measurement**: Track bookmark creation events

### Feature Usage
- **Target**: Average of 5 bookmarks per active user
- **Measurement**: Average bookmarks count from KVService

### Performance
- **Target**: Bookmark toggle < 200ms response time
- **Measurement**: Monitor KVService latency

---

## 🔮 Future Enhancements

### Phase 2 Features (Q2 2026)
1. **Collections & Lists**
   - User-created collections
   - Public/private collection sharing
   - Collection discovery page

2. **Nostr NIP-51 Sync**
   - Sync bookmarks to Nostr as NIP-51 Lists
   - Import bookmarks from other Nostr clients
   - Portable bookmarks across platforms

3. **Smart Recommendations**
   - Recommend content based on bookmarks
   - "Users who bookmarked X also bookmarked Y"
   - Trending bookmarks feed

4. **Advanced Features**
   - Bookmark notes/annotations
   - Bookmark tags for organization
   - Export bookmarks (JSON, CSV)
   - Bookmark search and filters

---

## 🐛 Known Limitations (To Address)

1. **Current TODO Locations**:
   - `/src/components/heritage/HeritageCard.tsx:125` - Placeholder bookmark button
   
2. **Missing UI**:
   - No bookmarks page yet
   - No bookmark management interface
   - No collections UI

3. **Infrastructure**:
   - Requires KVService (Upstash Redis) - ✅ Already implemented
   - Requires user authentication - ✅ Already implemented
   - Need to add bookmark types and service layer

---

## 📚 References

### Internal Documentation
- `/docs/critical-guidelines.md` - Architecture patterns
- `/src/services/core/KVService.ts` - Redis implementation
- `/docs/future-enhancements/upstash-workflow-integration.md` - KVService patterns

### External Standards
- [NIP-51: Lists](https://github.com/nostr-protocol/nips/blob/master/51.md) - Future Nostr sync
- [Redis Best Practices](https://redis.io/docs/manual/patterns/) - Data structure patterns

### Similar Implementations
- Pinterest: Collections and boards
- Pocket: Read-later bookmarking
- Raindrop.io: Bookmark organization

---

## ✅ Implementation Checklist

### Prerequisites
- [x] KVService implemented and tested
- [x] User authentication working
- [ ] Design bookmark UI mockups
- [ ] Define bookmark data structures

### Backend (Week 1-2)
- [ ] Create `BookmarkBusinessService.ts`
- [ ] Extend KVService with bookmark methods
- [ ] Create bookmark types in `/src/types/bookmarks.ts`
- [ ] Write unit tests for service layer
- [ ] Add bookmark analytics tracking

### Frontend (Week 2-3)
- [ ] Create `useBookmarks.ts` hook
- [ ] Create `BookmarkButton` component
- [ ] Update `HeritageCard.tsx` (remove TODO)
- [ ] Add bookmarks to `ShopProductCard.tsx`
- [ ] Add favorites to community pages
- [ ] Create `/bookmarks` page
- [ ] Add bookmark icon to navigation

### Testing (Week 3-4)
- [ ] End-to-end testing of bookmark flow
- [ ] Performance testing (KVService latency)
- [ ] User acceptance testing
- [ ] Cross-browser compatibility

### Documentation (Week 4)
- [ ] Update `nip-kind-implementation-matrix.md`
- [ ] Create user guide for bookmarks
- [ ] Add bookmark examples to Storybook
- [ ] Update changelog

### Deployment (Week 5-7)
- [ ] Deploy to staging
- [ ] Beta testing phase
- [ ] Gradual rollout to production
- [ ] Monitor metrics and feedback

---

**Next Steps**:
1. Review and approve this design document
2. Create implementation tasks in project tracker
3. Allocate development resources
4. Begin Phase 1 development

**Questions/Discussion**:
- Should collections be part of Phase 1 or Phase 2?
- Public vs private bookmarks - default setting?
- Sync frequency for Nostr NIP-51 (when implemented)?
- UI placement for bookmark management?

---

_Document Created: October 16, 2025_  
_Author: AI Assistant (with user requirements)_  
_Status: Draft - Pending Review_
