# Community Building Strategy

## The Problem

Users sign in with nsec/signer but exist in isolation. Community = users connecting with each other.

## Current State

**Have:** Messaging (NIP-17), "Contact Contributor" button on heritage pages, profile metadata (Kind 0)  
**Missing:** Discovery, activity visibility, engagement mechanisms, ongoing connections

## Community Feature Ideas

**1. Activity Feed**  
What: Homepage/community page showing recent heritage contributions from all users  
Why: Users invisible to each other → no discovery → no connections  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/community/page.tsx` (activity feed - all contributions, paginated) | `/src/components/community/ActivityFeed.tsx` (grid layout), `/src/components/community/ActivityCard.tsx` (individual contribution card) | - | - | - | - |
| **UPDATE** | `/src/app/page.tsx` (add link to /community in hero section) | `/src/components/Header.tsx` (add "Community" nav link) | `/src/hooks/useExploreHeritage.ts` (already queries all public heritage - reuse as-is) | `/src/services/business/HeritageContentService.ts` (add queryAll method if needed) | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023], '#t': ['culture-bridge-heritage-contribution'], limit: 50 }`  
**Pattern:** Reuse Shop's product listing approach (battle-tested)  
Value: Instant discoverability, see who's active, spark interest in contacting

**2. Contributor Profiles**  
What: Click any author → see their full profile + all contributions  
Why: Can't learn about contributors or see their full body of work  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/profile/[npub]/page.tsx` (public contributor profile - not editable) | `/src/components/profile/ContributorProfile.tsx` (profile header with stats), `/src/components/profile/ContributorContributions.tsx` (grid of their heritage items) | `/src/hooks/useContributorProfile.ts` (fetch profile + contributions for any pubkey) | - | - | - |
| **UPDATE** | - | `/src/components/community/ActivityCard.tsx`, `/src/components/heritage/HeritageCard.tsx` (make author name/avatar clickable → link to /profile/[npub]) | `/src/hooks/useExploreHeritage.ts` (add authors filter parameter) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023], authors: [pubkey] }` + `{ kinds: [0], authors: [pubkey] }` for profile metadata  
**Pattern:** Battle-tested profile flow + heritage query pattern  
Value: Build trust before messaging, find prolific contributors, showcase expertise

**3. Follow Users (NIP-02)**  
What: Follow button on profiles, maintain contact list on Nostr  
Why: Can't subscribe to specific contributors you care about  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/profile/FollowButton.tsx` (follow/unfollow toggle with count) | `/src/hooks/useFollowing.ts` (fetch contact list, follow/unfollow actions) | `/src/services/business/FollowBusinessService.ts` (manage Kind 3 contact list) | `/src/services/nostr/ContactListEventService.ts` (create/update Kind 3 events) | - |
| **UPDATE** | `/src/app/profile/[npub]/page.tsx` (add FollowButton to profile header) | `/src/components/profile/ContributorProfile.tsx` (integrate FollowButton) | - | - | - | `/src/services/generic/GenericEventService.ts` (signEvent), `/src/services/generic/GenericRelayService.ts` (publishEvent, queryEvents) |

**Nostr:** Create/update Kind 3 with `['p', pubkey, relay, petname]` tags, query `{ kinds: [3], authors: [userPubkey] }`  
**Pattern:** Event creation via GenericEventService, tag management in ContactListEventService  
Value: Curated feed of people you trust, ongoing relationship building

**4. Following Feed**  
What: Filter activity feed to only show contributions from people you follow  
Why: Too much noise from all users, want personalized experience  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/community/FollowingFeed.tsx` (filtered feed component) | `/src/hooks/useFollowingFeed.ts` (fetch contact list → query contributions from followed pubkeys) | - | - | - |
| **UPDATE** | `/src/app/community/page.tsx` (add tabs: "All Activity" vs "Following", toggle between feeds) | `/src/components/community/ActivityFeed.tsx` (add filter prop to switch between all/following) | `/src/hooks/useFollowing.ts` (fetch user's Kind 3 contact list), `/src/hooks/useExploreHeritage.ts` (add authors array filter) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Fetch `{ kinds: [3], authors: [userPubkey] }`, extract 'p' tags, query `{ kinds: [30023], authors: [extractedPubkeys] }`  
**Pattern:** Compose existing hooks (useFollowing + useExploreHeritage)  
Value: Quality over quantity, sustained engagement with chosen community

**5. Comments (Kind 1 Replies)**  
What: Public comments on heritage contributions  
Why: Messaging is private 1:1, no public discussion or collective knowledge building  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/heritage/CommentSection.tsx` (comment list + form), `/src/components/heritage/CommentForm.tsx` (textarea + submit), `/src/components/heritage/CommentItem.tsx` (single comment with author/timestamp) | `/src/hooks/useComments.ts` (fetch comments, subscribe to new ones, post comment) | `/src/services/business/CommentBusinessService.ts` (validate, format comments) | `/src/services/nostr/CommentEventService.ts` (create Kind 1 events) | - |
| **UPDATE** | `/src/app/heritage/[id]/page.tsx` (add CommentSection below contribution detail) | `/src/components/heritage/HeritageDetail.tsx` (integrate CommentSection) | - | - | - | `/src/services/generic/GenericEventService.ts` (signEvent), `/src/services/generic/GenericRelayService.ts` (publishEvent, queryEvents, subscribeToEvents) |

**Nostr:** Create Kind 1 with `['e', eventId, relay, 'reply']` tag, query `{ kinds: [1], '#e': [eventId] }`  
**Pattern:** Real-time subscription like messaging, event creation via GenericEventService  
Value: Community discussion, ask questions, share related knowledge, build context

**6. Reactions (NIP-25)**  
What: Like/appreciate contributions with emoji reactions  
Why: Low-friction way to show appreciation without messaging  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/heritage/ReactionButton.tsx`, `/src/components/heritage/ReactionList.tsx` | `/src/hooks/useReactions.ts` | `/src/services/business/ReactionBusinessService.ts` | `/src/services/nostr/ReactionEventService.ts` | - |
| **UPDATE** | `/src/app/heritage/[id]/page.tsx` | - | - | - | - | `/src/services/generic/GenericEventService.ts` (signEvent), `/src/services/generic/GenericRelayService.ts` (publishEvent, queryEvents) |

**Nostr:** Create Kind 7 with content = emoji, `['e', eventId]`, `['p', authorPubkey]` tags, query `{ kinds: [7], '#e': [eventId] }`  
**Pattern:** Simple event creation, aggregate reactions by emoji type  
Value: Social validation, encourage contributors, quick feedback

**7. Related Contributors**  
What: "Others who contributed to [Quechua culture]" section on heritage detail  
Why: No way to find people interested in same cultures  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/heritage/RelatedContributors.tsx` | `/src/hooks/useRelatedContributors.ts` | - | - | - |
| **UPDATE** | `/src/app/heritage/[id]/page.tsx` | - | `/src/hooks/useExploreHeritage.ts` (add category filter) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023], '#category': [sameCategoryTag] }`, extract unique authors, fetch `{ kinds: [0], authors: [uniquePubkeys] }`  
**Pattern:** Tag-based discovery + profile metadata fetching  
Value: Connect people with shared cultural interests, expand network

**8. Search/Filter by Culture**  
What: Filter activity feed by heritage type, region, language, community  
Why: Too broad, want to find specific cultural preservation work  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/community/FilterControls.tsx` | - | - | - | - |
| **UPDATE** | `/src/app/community/page.tsx` | - | `/src/hooks/useExploreHeritage.ts` (add multi-tag filters: culture, region, language, community) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023], '#culture': [selected], '#region': [selected], '#language': [selected], '#community': [selected] }`  
**Pattern:** Dynamic filter building, reuse existing tag system  
Value: Targeted discovery, find your cultural community

**9. Notifications**  
What: Alert when someone messages, comments, follows, or mentions you  
Why: Miss connection opportunities if you don't check regularly  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/notifications/page.tsx` (notification center - grouped by type, mark as read) | `/src/components/notifications/NotificationBell.tsx` (header icon with unread badge), `/src/components/notifications/NotificationList.tsx` (scrollable list), `/src/components/notifications/NotificationItem.tsx` (single notification with action link) | `/src/hooks/useNotifications.ts` (subscribe to mention events, aggregate, mark read) | `/src/services/business/NotificationBusinessService.ts` (parse event types, format messages, manage read state) | - | - |
| **UPDATE** | - | `/src/components/Header.tsx` (add NotificationBell icon next to user menu) | - | - | - | `/src/services/generic/GenericRelayService.ts` (subscribeToEvents with filter: kinds [1,3,7,14], #p: [userPubkey]) |

**Nostr:** Subscribe `{ kinds: [1, 3, 7, 14], '#p': [userPubkey] }`, parse event type, format notification  
**Pattern:** Real-time WebSocket subscription like messaging, notification aggregation  
Value: Real-time engagement, never miss a connection

**10. Share/Repost**  
What: Repost heritage contributions to your Nostr followers  
Why: Good contributions stay hidden, no amplification mechanism  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/heritage/ShareButton.tsx` (dropdown: Repost / Quote Post) | `/src/hooks/useShare.ts` (create repost or quote post) | `/src/services/business/ShareBusinessService.ts` (format repost/quote events) | `/src/services/nostr/RepostEventService.ts` (create Kind 6 or Kind 1 events) | - |
| **UPDATE** | `/src/app/heritage/[id]/page.tsx` (add ShareButton to action bar) | `/src/components/heritage/HeritageDetail.tsx` (integrate ShareButton) | - | - | - | `/src/services/generic/GenericEventService.ts` (signEvent), `/src/services/generic/GenericRelayService.ts` (publishEvent) |

**Nostr:** Create Kind 6 (repost) with `['e', originalEventId, relay]`, `['p', originalAuthorPubkey]` OR Kind 1 (quote) with same tags + comment text  
**Pattern:** Button action → immediate repost (simple repost) OR inline textarea for quote (expands on button click, no separate page)  
Value: Viral spread, cross-community discovery, contributor recognition

**11. Culture Groups**  
What: Dedicated pages for specific cultures (e.g., `/culture/quechua`)  
Why: Contributors to same culture scattered, no central gathering place  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/culture/[slug]/page.tsx` (culture-specific landing page with stats + contributions) | `/src/components/culture/CultureHeader.tsx` (culture name, description, stats), `/src/components/culture/CultureStats.tsx` (contributor count, contribution count, top contributors) | - | - | - | - |
| **UPDATE** | `/src/app/community/page.tsx` (add "Browse by Culture" section with links) | `/src/components/community/CultureFilter.tsx` (dropdown/grid to select culture) | `/src/hooks/useExploreHeritage.ts` (pre-filter by #culture tag from route param) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023], '#culture': [slug] }`, aggregate stats (contributor count, contribution count)  
**Pattern:** Dynamic routes + pre-filtered heritage query  
Value: Community hub, collective knowledge base, easier collaboration

**12. Collaborative Contributions**  
What: Multiple users contributing to same heritage topic/event  
Why: Some heritage requires multiple perspectives (village history, shared practices)  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/heritage/CoAuthorSelector.tsx` (search and select co-authors by npub/name) | `/src/hooks/useCoAuthors.ts` (search contributors, validate co-authors) | - | - | - |
| **UPDATE** | `/src/app/heritage/create/page.tsx` (add co-authors section in form), `/src/app/heritage/[id]/edit/page.tsx` (allow original author to add co-authors) | `/src/components/heritage/HeritageContributionForm.tsx` (add co-authors field, show selected co-authors) | `/src/hooks/useHeritagePublishing.ts` (include co-author pubkeys in event tags) | - | `/src/services/nostr/NostrEventService.ts` - createHeritageEvent (add ['p', coAuthorPubkey, relay, 'co-author'] tags) | - |

**Nostr:** Add multiple `['p', coAuthorPubkey, relay, 'co-author']` tags to Kind 30023, query to show multi-author contributions  
**Pattern:** Tag-based collaboration, co-author selection UI  
Value: Richer documentation, community co-creation, shared ownership

**13. Contributor Directory**  
What: Browse all contributors by culture, region, or expertise  
Why: No systematic way to find heritage keepers  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/contributors/page.tsx` (searchable directory with filters) | `/src/components/contributors/ContributorDirectory.tsx` (grid/list view), `/src/components/contributors/ContributorCard.tsx` (avatar, name, bio, stats, cultures), `/src/components/contributors/DirectoryFilters.tsx` (filter by culture, region, contribution count) | `/src/hooks/useContributorDirectory.ts` (fetch all contributors, aggregate stats, filter/search) | - | - | - |
| **UPDATE** | `/src/app/community/page.tsx` (add "Browse Contributors" link) | `/src/components/Header.tsx` (add "Contributors" nav link) | - | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents - fetch all Kind 30023, extract unique authors, fetch Kind 0 for each) |

**Nostr:** Query `{ kinds: [30023] }`, extract unique authors, fetch `{ kinds: [0], authors: [uniquePubkeys] }`, aggregate by culture/region tags  
**Pattern:** Aggregation + profile metadata, filterable directory  
Value: Network effect, find experts, build contributor ecosystem

**14. Trending Contributions**  
What: Highlight most-engaged heritage contributions (comments, reactions, reposts)  
Why: Quality work gets lost in chronological feed  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/community/TrendingSection.tsx` (top engaged items with engagement counts) | `/src/hooks/useTrending.ts` (fetch heritage + count engagement, score, cache results) | `/src/services/business/EngagementBusinessService.ts` (calculate engagement scores, cache for performance) | - | - |
| **UPDATE** | `/src/app/community/page.tsx` (add "Trending" tab alongside All/Following) | `/src/components/community/ActivityFeed.tsx` (support trending sort order) | - | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents - two-phase: get heritage, then get engagement events) |

**Nostr:** Query `{ kinds: [30023] }` for heritage, then `{ kinds: [1, 7, 6], '#e': [eventIds] }` for engagement, score = comments + reactions + reposts  
**Pattern:** Multi-step query (content → engagement), scoring algorithm, caching for performance  
Value: Surface best content, motivate quality, onboard newcomers with highlights

**15. Mutual Connections**  
What: Show "You both follow X and Y" or "3 mutual connections" on profiles  
Why: No context about relationship proximity  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/profile/MutualConnections.tsx` (show avatars + count of mutual follows) | `/src/hooks/useMutualConnections.ts` (fetch both contact lists, compute intersection) | - | - | - |
| **UPDATE** | `/src/app/profile/[npub]/page.tsx` (add MutualConnections section below profile header) | `/src/components/profile/ContributorProfile.tsx` (integrate MutualConnections component) | `/src/hooks/useFollowing.ts` (fetch contact lists for comparison) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents - fetch Kind 3 for both users) |

**Nostr:** Fetch `{ kinds: [3], authors: [userPubkey, profilePubkey] }`, extract 'p' tags from both, compute intersection  
**Pattern:** Set intersection algorithm, contact list parsing  
Value: Build trust, facilitate introductions, strengthen network density

---

## 🔄 Reusability & Generic Services

### Battle-Tested Patterns to Reuse

These community features should **NOT** create duplicate code. Follow the battle-tested patterns:

| Feature | What to Reuse | From Where |
|---------|---------------|------------|
| **#1: Activity Feed** | `useExploreHeritage` hook | Heritage Contribution Flow (already generic!) |
| **#2: Contributor Profiles** | Query pattern from `useExploreHeritage` | Heritage Contribution Flow (filter by author) |
| **#4: Following Feed** | `useExploreHeritage` + filter by authors | Heritage Contribution Flow |
| **#5: Comments** | Simple event creation (Kind 1) | Can extend GenericEventService |
| **#6: Reactions** | Simple event creation (Kind 7) | Can extend GenericEventService |
| **#7: Related Contributors** | Query pattern from `useExploreHeritage` | Heritage Contribution Flow (filter by tags) |
| **#10: Share/Repost** | Simple event creation (Kind 6) | Can extend GenericEventService |
| **#12: Direct Messages** | `GenericMessageService` (NIP-17) | Messaging System (encrypted DMs) |

### Generic Opportunities (For Future)

If implementing multiple similar features in one sprint, consider creating:

**1. Generic Query Hook**

```typescript
// Instead of separate useContributorProfile, useRelatedContributors, useCultureGroup
// Create: useNostrQuery<T>(kind, filters, mapper)

const contributions = useNostrQuery(
  30023,
  { authors: [npub], '#t': ['culture-bridge-heritage-contribution'] },
  mapToHeritage
);
```

**2. Generic Interaction Service**

```typescript
// Instead of separate CommentEventService, ReactionEventService, RepostEventService
// Extend: GenericEventService with createSimpleEvent()

GenericInteractionService.createComment(
  contentEventId,
  commentText,
  authorPubkey,
  'root' // or 'reply'
);

GenericInteractionService.createReaction(
  contentEventId,
  '❤️',
  authorPubkey,
  contentAuthorPubkey
);
```

**When to Genericize:**

- ✅ Pattern repeats 3+ times
- ✅ Logic is identical or nearly identical
- ❌ Don't over-abstract prematurely

### Critical: Follow Battle-Tested Patterns

**DO:**

- ✅ Study reference implementations (Shop Product, Heritage Contribution, Profile)
- ✅ Copy proven patterns, adapt minimally
- ✅ Reuse existing hooks like `useExploreHeritage` before creating new ones
- ✅ Follow SOA strictly: Page → Component → Hook → Business → Event → Generic

**DON'T:**

- ❌ Create new query hooks if `useExploreHeritage` can be adapted with filters
- ❌ Create new EventService if GenericEventService can handle it
- ❌ Write custom relay queries if GenericRelayService works
- ❌ Skip battle-tested comparison (see implementation-protocol.md)

**Special Note on Activity Feed (#1):**
`useExploreHeritage` is ALREADY a battle-tested, generic content query hook. It queries Kind 30023 with filters. Don't recreate this logic - just use it with different filter parameters for activity feeds, contributor profiles, following feeds, etc.

---

_Last Updated: October 14, 2025_
