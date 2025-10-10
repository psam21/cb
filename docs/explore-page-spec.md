# /explore Page Specification

## Overview
The `/explore` page is the **public discovery hub** for heritage contributions published to Nostr relays. It transitions from static mock data to live relay data, showcasing real cultural heritage content created by the community.

**Status**: Transitioning from Static → Production with Real Relay Data

---

## Current State vs. Target State

### Current (Mock Data)
- Static data from `src/data/explore.ts`
- Hardcoded 6 culture cards with placeholder images
- Simulated stats (contributors, stories, audio counts)
- No relay connectivity

### Target (Real Relay Data)
- ✅ Query **Kind 30023** events with `#t` tag `culture-bridge-heritage`
- ✅ Show **2 most recent** contributions as "Featured Cultures"
- ✅ Show **remaining contributions** in "All Cultures" section
- ✅ Maintain existing card layout and visual hierarchy
- ✅ Real-time stats from event content and metadata
- ✅ Filter by region, category, content type (future)

---

## SOA Architecture

### Layer 1: Page (Presentation)
**File**: `src/app/explore/page.tsx`
```
Page → ExploreContent Component
```
- Metadata only (title, description for SEO)
- Delegates to component

### Layer 2: Component (UI)
**File**: `src/components/pages/ExploreContent.tsx`
```
ExploreContent Component → useExploreHeritage Hook
```
**Responsibilities**:
- Render featured cards (2 latest)
- Render all culture cards (remaining)
- Search input (client-side filter)
- Filter UI (region, category - future)
- Loading states, error states
- Empty states (no content published yet)

**Props**: None (stateless, fetches via hook)

**State**:
- `searchTerm` - client-side filtering
- `selectedRegion` - filter state (future)
- `selectedCategory` - filter state (future)

### Layer 3: Hook (Data Orchestration)
**File**: `src/hooks/useExploreHeritage.ts` (NEW)
```
useExploreHeritage Hook → HeritageContentService (Generic)
```
**Responsibilities**:
- Fetch heritage events from relays
- Sort by `created_at` (DESC) - latest first
- Parse event content (title, description, tags)
- Extract media from imeta tags
- Map to UI-friendly format
- Handle loading, error states

**Returns**:
```typescript
{
  heritageItems: HeritageExploreItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

### Layer 4: Service (Business Logic)
**File**: `src/services/generic/GenericHeritageService.ts`
```
HeritageContentService → GenericRelayService → Relays
```
**Responsibilities**:
- Query relays for Kind 30023 events
- Filter: `#t` tag = `culture-bridge-heritage`
- Parse event structure
- Extract metadata (title, summary, category, location, tags)
- Extract imeta media arrays
- Return normalized heritage events

**Methods**:
```typescript
async fetchPublicHeritage(limit?: number): Promise<HeritageEvent[]>
```

---

## Data Flow

```
User visits /explore
    ↓
ExploreContent renders
    ↓
useExploreHeritage hook mounts
    ↓
Calls GenericHeritageService.fetchPublicHeritage()
    ↓
GenericHeritageService queries relays
    ↓
Filters by: kind=30023, #t=culture-bridge-heritage
    ↓
Parses events → HeritageEvent[]
    ↓
Hook maps to HeritageExploreItem[]
    ↓
Sorts by created_at DESC
    ↓
Component receives data:
    - Featured: items[0], items[1]  (2 latest)
    - All Cultures: items.slice(2)   (rest)
    ↓
Renders cards with real data
```

---

## Event Structure (Kind 30023 Heritage)

### Filter for Relay Query
```typescript
{
  kinds: [30023],
  "#t": ["culture-bridge-heritage"],
  limit: 50  // Fetch latest 50 contributions
}
```

### Heritage Event Format
```json
{
  "id": "event-id-hash",
  "pubkey": "author-pubkey",
  "created_at": 1728561234,
  "kind": 30023,
  "tags": [
    ["d", "contribution-1728561234-abc123"],
    ["t", "culture-bridge-heritage"],
    ["title", "The Art of Storytelling in the Andes"],
    ["summary", "Ancient Andean storytelling traditions that preserve history..."],
    ["published_at", "1728561234"],
    ["category", "Tradition"],
    ["location", "Andean Communities"],
    ["region", "South America"],
    ["custom-tag", "Oral Tradition"],
    ["custom-tag", "Storytelling"],
    ["imeta",
      "url https://cdn.blossom.com/abc123.jpg",
      "m image/jpeg",
      "x 7e1a9d8f...",
      "size 245678",
      "dim 1920x1080"
    ],
    ["imeta",
      "url https://cdn.blossom.com/def456.mp3",
      "m audio/mpeg",
      "x 3f2b1c4e...",
      "size 3456789",
      "duration 180"
    ]
  ],
  "content": "Full markdown content of the heritage story...",
  "sig": "signature"
}
```

### Tag Extraction

| Tag | Purpose | Example |
|-----|---------|---------|
| `d` | Unique identifier (dTag) | `contribution-1728561234-abc123` |
| `t` | System category | `culture-bridge-heritage` |
| `title` | Display title | `The Art of Storytelling in the Andes` |
| `summary` | Short description | `Ancient Andean storytelling traditions...` |
| `published_at` | Publication timestamp | `1728561234` |
| `category` | Heritage category | `Tradition`, `Art`, `Story`, `Music`, `Craft` |
| `location` | Geographic location | `Andean Communities`, `Navajo Nation` |
| `region` | Geographic region | `South America`, `North America`, `Europe`, `Asia`, `Africa`, `Oceania` |
| `custom-tag` | User-defined tags | `Oral Tradition`, `Weaving`, `Dance` |
| `imeta` | Media metadata | URL, MIME type, hash, dimensions |

---

## Data Mapping

### Event → HeritageExploreItem

```typescript
interface HeritageExploreItem {
  id: string;                    // event.id
  dTag: string;                  // d tag value
  name: string;                  // title tag
  description: string;           // summary tag
  location: string;              // location tag
  region: string;                // region tag
  category: string;              // category tag
  image: string;                 // First imeta URL (image/* MIME)
  tags: string[];                // All custom-tag values
  author: {
    pubkey: string;              // event.pubkey
    npub: string;                // nip19 encoded
  };
  media: {
    images: MediaItem[];         // imeta with m=image/*
    audio: MediaItem[];          // imeta with m=audio/*
    videos: MediaItem[];         // imeta with m=video/*
  };
  stats: {
    contributors: number;        // Always 1 (single author per event)
    mediaCount: number;          // Total imeta tags
    publishedAt: number;         // created_at or published_at tag
  };
  relativeTime: string;          // "2 days ago" (calculated from created_at)
}

interface MediaItem {
  url: string;
  mimeType: string;
  hash: string;
  size?: number;
  dimensions?: string;           // "1920x1080"
  duration?: number;             // For audio/video
}
```

### Calculation Logic

**relativeTime** (from `created_at`):
```typescript
const now = Math.floor(Date.now() / 1000);
const diff = now - event.created_at;

if (diff < 60) return "just now";
if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
if (diff < 2592000) return `${Math.floor(diff / 604800)} weeks ago`;
return `${Math.floor(diff / 2592000)} months ago`;
```

**Stats**:
- `contributors`: Always `1` (each event has single author)
- `mediaCount`: Count of all `imeta` tags
- `publishedAt`: Use `published_at` tag if present, fallback to `created_at`

**Featured Logic**:
- Sort all events by `created_at` DESC
- Featured = `[0]` and `[1]` (2 most recent)
- All Cultures = `.slice(2)` (rest of events)

---

## Component Structure

### ExploreContent Component

**Sections**:
1. **Hero** - Title, subtitle, feature badges
2. **Search & Filters** - Search input, region/category filters
3. **Featured Cultures** (2 cards, large)
4. **All Cultures** (grid of smaller cards)
5. **Load More** (pagination - future)

### Card Layouts

#### Featured Card (Large - 2 Latest)
```tsx
<div className="md:grid-cols-2 gap-8">
  {/* 2 large cards side by side */}
  <div className="culture-card">
    <div className="relative aspect-video">
      <Image src={image} fill />
      <Badge>Featured</Badge>
      <Overlay>
        <h3>{name}</h3>
        <p>{location}</p>
      </Overlay>
    </div>
    <div className="p-6">
      <p>{description}</p>
      <Stats>
        <Stat icon={User} value={1} label="Contributor" />
        <Stat icon={Image} value={mediaCount} label="Media" />
        <Stat icon={Clock} value={relativeTime} />
      </Stats>
      <Tags>{tags.slice(0, 3)}</Tags>
      <Link href={`/heritage/${dTag}`}>Explore Culture →</Link>
    </div>
  </div>
</div>
```

#### All Cultures Card (Grid - Remaining)
```tsx
<div className="lg:grid-cols-3 gap-6">
  {/* 3 columns on desktop */}
  <div className="culture-card">
    <div className="aspect-video">
      <Image src={image} fill />
    </div>
    <div className="p-6">
      <h3>{name}</h3>
      <p className="flex items-center">
        <MapPin />{location}
      </p>
      <div className="flex justify-between">
        <span>{mediaCount} media</span>
        <span>{relativeTime}</span>
      </div>
      <Tags>{tags.slice(0, 2)}</Tags>
      <Link href={`/heritage/${dTag}`}>Explore →</Link>
    </div>
  </div>
</div>
```

---

## UI States

### Loading State
```tsx
<div className="grid md:grid-cols-2 gap-8">
  <SkeletonCard />
  <SkeletonCard />
</div>
<div className="grid lg:grid-cols-3 gap-6">
  <SkeletonCard />
  <SkeletonCard />
  <SkeletonCard />
</div>
```

### Empty State (No Content)
```tsx
<div className="text-center py-16">
  <Globe className="w-16 h-16 mx-auto text-gray-400 mb-4" />
  <h3>No Heritage Content Yet</h3>
  <p>Be the first to share your culture's story!</p>
  <Link href="/contribute">
    <button>Contribute Heritage →</button>
  </Link>
</div>
```

### Error State
```tsx
<div className="text-center py-16">
  <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
  <h3>Failed to Load Heritage Content</h3>
  <p>{error}</p>
  <button onClick={refetch}>Try Again</button>
</div>
```

---

## Implementation Checklist

### Phase 1: Service Layer ✅
- [ ] Create `GenericHeritageService.fetchPublicHeritage()`
- [ ] Query relays for Kind 30023 with `#t=culture-bridge-heritage`
- [ ] Parse event tags (title, summary, category, location, region, custom-tag)
- [ ] Extract imeta media arrays
- [ ] Return `HeritageEvent[]`

### Phase 2: Hook Layer ✅
- [ ] Create `useExploreHeritage.ts`
- [ ] Call service on mount
- [ ] Map events to `HeritageExploreItem[]`
- [ ] Sort by `created_at` DESC
- [ ] Calculate `relativeTime` strings
- [ ] Parse media into categories (images, audio, videos)
- [ ] Handle loading/error states

### Phase 3: Component Layer ✅
- [ ] Update `ExploreContent.tsx` to use hook
- [ ] Remove static data imports
- [ ] Implement featured cards: `items.slice(0, 2)`
- [ ] Implement all cultures grid: `items.slice(2)`
- [ ] Add loading skeletons
- [ ] Add empty state
- [ ] Add error state with retry
- [ ] Maintain existing card styling

### Phase 4: Routing ✅
- [ ] Verify `/heritage/[dTag]` detail page exists
- [ ] Update links from `/explore/${id}` to `/heritage/${dTag}`
- [ ] Ensure detail page queries by dTag

### Phase 5: Testing ✅
- [ ] Test with 0 events (empty state)
- [ ] Test with 1 event (no featured section)
- [ ] Test with 2 events (featured only)
- [ ] Test with 10+ events (featured + grid)
- [ ] Test search filtering
- [ ] Test responsive layout
- [ ] Test loading states
- [ ] Test error recovery

---

## Search & Filtering (Client-Side)

### Search Implementation
```typescript
const filteredItems = heritageItems.filter(item => {
  const term = searchTerm.toLowerCase();
  return (
    item.name.toLowerCase().includes(term) ||
    item.description.toLowerCase().includes(term) ||
    item.location.toLowerCase().includes(term) ||
    item.tags.some(tag => tag.toLowerCase().includes(term))
  );
});
```

### Region Filter (Future)
```typescript
const byRegion = filteredItems.filter(item =>
  selectedRegion === 'All Regions' || item.region === selectedRegion
);
```

### Category Filter (Future)
```typescript
const byCategory = byRegion.filter(item =>
  selectedCategory === 'All' || item.category === selectedCategory
);
```

---

## Performance Considerations

### Relay Query Optimization
- **Limit**: Fetch 50 most recent events initially
- **Pagination**: Load more on scroll/button click (future)
- **Caching**: Consider relay response caching (1 minute)

### Image Loading
- Use Next.js `<Image>` with blur placeholders
- `loading="lazy"` for cards below fold
- `sizes` prop for responsive images

### Search Performance
- Debounce search input (300ms)
- Client-side filtering (no relay queries)
- Search indexes: name, description, location, tags

---

## Future Enhancements

### Advanced Filtering
- [ ] Region dropdown (multi-select)
- [ ] Category chips (Tradition, Art, Story, Music, Craft)
- [ ] Content type filter (has image, has audio, has video)
- [ ] Language filter (from `language` tag)

### Sorting Options
- [ ] Most recent (default)
- [ ] Most media
- [ ] Alphabetical
- [ ] By region

### Pagination
- [ ] "Load More" button (fetch next 50)
- [ ] Infinite scroll option
- [ ] URL state for page number

### Detail View Integration
- [ ] Link to `/heritage/[dTag]` detail page
- [ ] Preview modal on card hover
- [ ] Share buttons for heritage items

### Social Features
- [ ] Show author profile on card
- [ ] Like/bookmark heritage items (via Nostr reactions)
- [ ] Comment counts (from Kind 1 replies)

---

## Error Handling

### Relay Connection Failures
```typescript
if (relayErrors.length > 0) {
  logger.warn('Some relays failed', { errors: relayErrors });
  // Continue with available data
}
```

### Malformed Events
```typescript
try {
  const item = parseHeritageEvent(event);
  return item;
} catch (error) {
  logger.error('Failed to parse event', error, { eventId: event.id });
  return null; // Skip malformed events
}
```

### Missing Required Tags
```typescript
if (!event.tags.find(t => t[0] === 'title')) {
  logger.warn('Event missing title tag', { eventId: event.id });
  // Use content preview as fallback
}
```

---

## Accessibility

### Semantic HTML
- `<main>` for page content
- `<section>` for featured/all cultures
- `<article>` for individual cards
- `<h2>`, `<h3>` hierarchy

### ARIA Labels
```tsx
<Link 
  href={`/heritage/${dTag}`}
  aria-label={`Explore ${name} heritage from ${location}`}
>
```

### Keyboard Navigation
- Tab through cards
- Enter to open detail
- Search input accessible

### Screen Readers
- Alt text for all images
- Status announcements for loading/errors
- Card content hierarchy clear

---

## SEO Optimization

### Page Metadata
```tsx
export const metadata = {
  title: 'Explore Cultural Heritage | Culture Bridge',
  description: 'Discover diverse cultural traditions, stories, and media from communities worldwide. Browse heritage contributions on the Nostr network.',
  openGraph: {
    title: 'Explore Cultural Heritage',
    description: 'Discover cultural traditions from around the world',
    images: ['/og-explore.jpg'],
  },
};
```

### Dynamic Meta (per card)
- Each heritage item could have individual OG tags
- Generated on detail page load

---

## Analytics & Logging

### Events to Track
- `explore_page_view` - User visits /explore
- `explore_search` - User searches
- `explore_filter` - User applies filter
- `heritage_card_click` - User clicks card
- `heritage_relay_error` - Relay fetch fails

### Logger Context
```typescript
logger.info('Fetched heritage items', {
  service: 'ExploreContent',
  count: heritageItems.length,
  featured: 2,
  allCultures: heritageItems.length - 2,
});
```

---

## Dependencies

### New Dependencies
None - uses existing infrastructure

### Existing Services
- `GenericRelayService` - Relay queries
- `GenericEventService` - Event parsing
- `LoggingService` - Error tracking

### Existing Hooks
- Pattern follows `useMyShopProducts`, `useMessages`

### Existing Types
- `HeritageContent` (extend for explore view)
- Add `HeritageExploreItem` interface

---

## Deployment Plan

### Phase 1: Backend (Services + Hooks)
1. Implement `GenericHeritageService.fetchPublicHeritage()`
2. Create `useExploreHeritage` hook
3. Write unit tests
4. Verify relay queries work

### Phase 2: Frontend (Component)
1. Update `ExploreContent.tsx` to use hook
2. Implement featured + grid layouts
3. Add loading/error/empty states
4. Test responsiveness

### Phase 3: Integration
1. Test with real published heritage events
2. Verify links to detail pages
3. Test search and filtering
4. Performance audit

### Phase 4: Production
1. Deploy to Vercel
2. Monitor relay performance
3. Collect user feedback
4. Iterate on filters/sorting

---

## Success Metrics

### Technical
- ✅ Relay response time < 2 seconds
- ✅ Page load time < 3 seconds
- ✅ Zero layout shift (CLS < 0.1)
- ✅ Images lazy load correctly

### User Experience
- ✅ Search results instant (< 100ms)
- ✅ Clear distinction between featured/all
- ✅ Easy navigation to detail pages
- ✅ Graceful handling of no content

### Content Discovery
- ✅ Latest heritage visible immediately
- ✅ Regional diversity represented
- ✅ Media-rich content prioritized
- ✅ User-contributed content featured

---

## Questions for Review

1. **Pagination**: Should we implement "Load More" in v1 or start with fixed 50 limit?
2. **Featured Logic**: Always show 2 latest, or implement editorial curation?
3. **Empty State**: Should we seed with example heritage content?
4. **Filtering**: Implement region/category filters in v1 or defer to v2?
5. **Stats**: Show "1 contributor" or hide contributor count entirely (since always 1)?
6. **Detail Page**: Does `/heritage/[dTag]` page exist, or create new `/explore/[dTag]`?

---

## References

- NIP-01: Basic event structure
- NIP-23: Long-form content (Kind 30023)
- NIP-33: Parameterized replaceable events (dTag)
- NIP-94: File metadata (imeta tags)
- Existing: `/my-contributions` (similar query logic)
- Existing: `useMyShopProducts` (similar hook pattern)
