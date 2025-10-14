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
| **NEW** | `/src/app/community/page.tsx` | `/src/components/community/ActivityFeed.tsx` | - | - | - | - |
| **UPDATE** | - | - | `/src/hooks/useExploreHeritage.ts` (reuse existing) | `/src/services/business/HeritageContentService.ts` (add queryAll method) | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023], '#t': ['culture-bridge-heritage-contribution'], limit: 50 }`  
**Pattern:** Reuse Shop's product listing approach (battle-tested)  
Value: Instant discoverability, see who's active, spark interest in contacting

**2. Contributor Profiles**  
What: Click any author → see their full profile + all contributions  
Why: Can't learn about contributors or see their full body of work  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/profile/[npub]/page.tsx` | `/src/components/profile/ContributorProfile.tsx`, `/src/components/profile/ContributorContributions.tsx` | `/src/hooks/useContributorProfile.ts` | - | - | - |
| **UPDATE** | - | - | `/src/hooks/useExploreHeritage.ts` (add authors filter) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023], authors: [pubkey] }` + `{ kinds: [0], authors: [pubkey] }` for profile metadata  
**Pattern:** Battle-tested profile flow + heritage query pattern  
Value: Build trust before messaging, find prolific contributors, showcase expertise

**3. Follow Users (NIP-02)**  
What: Follow button on profiles, maintain contact list on Nostr  
Why: Can't subscribe to specific contributors you care about  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/profile/FollowButton.tsx` | `/src/hooks/useFollowing.ts` | `/src/services/business/FollowBusinessService.ts` | `/src/services/nostr/ContactListEventService.ts` | - |
| **UPDATE** | `/src/app/profile/[npub]/page.tsx` | - | - | - | - | `/src/services/generic/GenericEventService.ts` (signEvent), `/src/services/generic/GenericRelayService.ts` (publishEvent, queryEvents) |

**Nostr:** Create/update Kind 3 with `['p', pubkey, relay, petname]` tags, query `{ kinds: [3], authors: [userPubkey] }`  
**Pattern:** Event creation via GenericEventService, tag management in ContactListEventService  
Value: Curated feed of people you trust, ongoing relationship building

**4. Following Feed**  
What: Filter activity feed to only show contributions from people you follow  
Why: Too much noise from all users, want personalized experience  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/community/FollowingFeed.tsx` | `/src/hooks/useFollowingFeed.ts` | - | - | - |
| **UPDATE** | `/src/app/community/page.tsx` (add tab toggle) | - | `/src/hooks/useFollowing.ts` (fetch contact list), `/src/hooks/useExploreHeritage.ts` (add authors filter) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Fetch `{ kinds: [3], authors: [userPubkey] }`, extract 'p' tags, query `{ kinds: [30023], authors: [extractedPubkeys] }`  
**Pattern:** Compose existing hooks (useFollowing + useExploreHeritage)  
Value: Quality over quantity, sustained engagement with chosen community

**5. Comments (Kind 1 Replies)**  
What: Public comments on heritage contributions  
Why: Messaging is private 1:1, no public discussion or collective knowledge building  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/heritage/CommentSection.tsx`, `/src/components/heritage/CommentForm.tsx`, `/src/components/heritage/CommentItem.tsx` | `/src/hooks/useComments.ts` | `/src/services/business/CommentBusinessService.ts` | `/src/services/nostr/CommentEventService.ts` | - |
| **UPDATE** | `/src/app/heritage/[id]/page.tsx` | - | - | - | - | `/src/services/generic/GenericEventService.ts` (signEvent), `/src/services/generic/GenericRelayService.ts` (publishEvent, queryEvents, subscribeToEvents) |

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
| **NEW** | `/src/app/notifications/page.tsx` | `/src/components/notifications/NotificationBell.tsx`, `/src/components/notifications/NotificationList.tsx`, `/src/components/notifications/NotificationItem.tsx` | `/src/hooks/useNotifications.ts` | `/src/services/business/NotificationBusinessService.ts` | - | - |
| **UPDATE** | - | `/src/components/Header.tsx` (add bell icon) | - | - | - | `/src/services/generic/GenericRelayService.ts` (subscribeToEvents) |

**Nostr:** Subscribe `{ kinds: [1, 3, 7, 14], '#p': [userPubkey] }`, parse event type, format notification  
**Pattern:** Real-time WebSocket subscription like messaging, notification aggregation  
Value: Real-time engagement, never miss a connection

**10. Share/Repost**  
What: Repost heritage contributions to your Nostr followers  
Why: Good contributions stay hidden, no amplification mechanism  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/heritage/ShareButton.tsx`, `/src/components/heritage/ShareModal.tsx` | `/src/hooks/useShare.ts` | `/src/services/business/ShareBusinessService.ts` | `/src/services/nostr/RepostEventService.ts` | - |
| **UPDATE** | `/src/app/heritage/[id]/page.tsx` | - | - | - | - | `/src/services/generic/GenericEventService.ts` (signEvent), `/src/services/generic/GenericRelayService.ts` (publishEvent) |

**Nostr:** Create Kind 6 (repost) with `['e', originalEventId, relay]`, `['p', originalAuthorPubkey]` OR Kind 1 (quote) with same tags + comment text  
**Pattern:** Event creation via GenericEventService, optional quote text  
Value: Viral spread, cross-community discovery, contributor recognition

**11. Culture Groups**  
What: Dedicated pages for specific cultures (e.g., `/culture/quechua`)  
Why: Contributors to same culture scattered, no central gathering place  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/culture/[slug]/page.tsx` | `/src/components/culture/CultureHeader.tsx`, `/src/components/culture/CultureStats.tsx` | - | - | - | - |
| **UPDATE** | - | - | `/src/hooks/useExploreHeritage.ts` (pre-filter by culture slug) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023], '#culture': [slug] }`, aggregate stats (contributor count, contribution count)  
**Pattern:** Dynamic routes + pre-filtered heritage query  
Value: Community hub, collective knowledge base, easier collaboration

**12. Collaborative Contributions**  
What: Multiple users contributing to same heritage topic/event  
Why: Some heritage requires multiple perspectives (village history, shared practices)  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/heritage/CoAuthorSelector.tsx` | `/src/hooks/useCoAuthors.ts` | - | - | - |
| **UPDATE** | `/src/app/heritage/create/page.tsx`, `/src/app/heritage/[id]/edit/page.tsx` | `/src/components/heritage/HeritageContributionForm.tsx` | `/src/hooks/useHeritagePublishing.ts` (add co-authors to event) | - | `/src/services/nostr/NostrEventService.ts` (createHeritageEvent - add multiple 'p' tags) | - |

**Nostr:** Add multiple `['p', coAuthorPubkey, relay, 'co-author']` tags to Kind 30023, query to show multi-author contributions  
**Pattern:** Tag-based collaboration, co-author selection UI  
Value: Richer documentation, community co-creation, shared ownership

**13. Contributor Directory**  
What: Browse all contributors by culture, region, or expertise  
Why: No systematic way to find heritage keepers  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/contributors/page.tsx` | `/src/components/contributors/ContributorDirectory.tsx`, `/src/components/contributors/ContributorCard.tsx`, `/src/components/contributors/DirectoryFilters.tsx` | `/src/hooks/useContributorDirectory.ts` | - | - | - |
| **UPDATE** | - | - | - | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023] }`, extract unique authors, fetch `{ kinds: [0], authors: [uniquePubkeys] }`, aggregate by culture/region tags  
**Pattern:** Aggregation + profile metadata, filterable directory  
Value: Network effect, find experts, build contributor ecosystem

**14. Trending Contributions**  
What: Highlight most-engaged heritage contributions (comments, reactions, reposts)  
Why: Quality work gets lost in chronological feed  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/community/TrendingSection.tsx` | `/src/hooks/useTrending.ts` | `/src/services/business/EngagementBusinessService.ts` | - | - |
| **UPDATE** | `/src/app/community/page.tsx` (add trending tab) | - | - | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Query `{ kinds: [30023] }` for heritage, then `{ kinds: [1, 7, 6], '#e': [eventIds] }` for engagement, score = comments + reactions + reposts  
**Pattern:** Multi-step query (content → engagement), scoring algorithm, caching for performance  
Value: Surface best content, motivate quality, onboard newcomers with highlights

**15. Mutual Connections**  
What: Show "You both follow X and Y" or "3 mutual connections" on profiles  
Why: No context about relationship proximity  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/profile/MutualConnections.tsx` | `/src/hooks/useMutualConnections.ts` | - | - | - |
| **UPDATE** | `/src/app/profile/[npub]/page.tsx` | - | `/src/hooks/useFollowing.ts` (fetch contact lists for comparison) | - | - | `/src/services/generic/GenericRelayService.ts` (existing queryEvents) |

**Nostr:** Fetch `{ kinds: [3], authors: [userPubkey, profilePubkey] }`, extract 'p' tags from both, compute intersection  
**Pattern:** Set intersection algorithm, contact list parsing  
Value: Build trust, facilitate introductions, strengthen network density

---

_Last Updated: October 14, 2025_
