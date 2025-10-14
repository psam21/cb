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
How: Nostr: Query kind 30023 with `#t: culture-bridge-heritage-contribution` | Codebase: Reuse useExploreHeritage hook, display on /community page  
Value: Instant discoverability, see who's active, spark interest in contacting

**2. Contributor Profiles**  
What: Click any author → see their full profile + all contributions  
Why: Can't learn about contributors or see their full body of work  
How: Nostr: Query `{ kinds: [30023], authors: [pubkey] }` | Codebase: New /profile/[npub] route, new useContributorProfile hook (similar to useExploreHeritage)  
Value: Build trust before messaging, find prolific contributors, showcase expertise

**3. Follow Users (NIP-02)**  
What: Follow button on profiles, maintain contact list on Nostr  
Why: Can't subscribe to specific contributors you care about  
How: Nostr: Create/update kind 3 event with 'p' tags for each followed pubkey | Codebase: New FollowBusinessService, useFollowing hook, reuse GenericEventService  
Value: Curated feed of people you trust, ongoing relationship building

**4. Following Feed**  
What: Filter activity feed to only show contributions from people you follow  
Why: Too much noise from all users, want personalized experience  
How: Nostr: Fetch user's kind 3, extract pubkeys, query `{ kinds: [30023], authors: [extractedPubkeys] }` | Codebase: Extend useExploreHeritage with authors filter  
Value: Quality over quantity, sustained engagement with chosen community

**5. Comments (Kind 1 Replies)**  
What: Public comments on heritage contributions  
Why: Messaging is private 1:1, no public discussion or collective knowledge building  
How: Nostr: Create kind 1 with 'e' tag = heritage event ID, query `{ kinds: [1], '#e': [eventId] }` | Codebase: New CommentBusinessService, useComments hook (pattern like messaging)  
Value: Community discussion, ask questions, share related knowledge, build context

**6. Reactions (NIP-25)**  
What: Like/appreciate contributions with emoji reactions  
Why: Low-friction way to show appreciation without messaging  
How: Nostr: Create kind 7 with content = emoji, 'e' tag = event ID | Codebase: New ReactionBusinessService, useReactions hook, reuse GenericEventService  
Value: Social validation, encourage contributors, quick feedback

**7. Related Contributors**  
What: "Others who contributed to [Quechua culture]" section on heritage detail  
Why: No way to find people interested in same cultures  
How: Nostr: Query `{ kinds: [30023], '#category': [sameCategoryTag] }`, extract unique authors | Codebase: Extend HeritageDetail component, fetch kind 0 for each author  
Value: Connect people with shared cultural interests, expand network

**8. Search/Filter by Culture**  
What: Filter activity feed by heritage type, region, language, community  
Why: Too broad, want to find specific cultural preservation work  
How: Nostr: Query `{ kinds: [30023], '#culture': [selected], '#region': [selected] }` | Codebase: Add filter state to useExploreHeritage, UI filter controls  
Value: Targeted discovery, find your cultural community

**9. Notifications**  
What: Alert when someone messages, comments, follows, or mentions you  
Why: Miss connection opportunities if you don't check regularly  
How: Nostr: Subscribe `{ kinds: [1, 3, 7, 14], '#p': [userPubkey] }` | Codebase: New NotificationBusinessService, useNotifications hook (pattern like useMessages subscription)  
Value: Real-time engagement, never miss a connection

**10. Share/Repost**  
What: Repost heritage contributions to your Nostr followers  
Why: Good contributions stay hidden, no amplification mechanism  
How: Nostr: Create kind 6 (repost) or kind 1 (quote) with 'e' tag = original event | Codebase: New ShareBusinessService, add action to heritage detail, reuse GenericEventService  
Value: Viral spread, cross-community discovery, contributor recognition

**11. Culture Groups**  
What: Dedicated pages for specific cultures (e.g., `/culture/quechua`)  
Why: Contributors to same culture scattered, no central gathering place  
How: Nostr: Query `{ kinds: [30023], '#culture': ['quechua'] }` | Codebase: New /culture/[slug] route, reuse useExploreHeritage with pre-set filter  
Value: Community hub, collective knowledge base, easier collaboration

**12. Collaborative Contributions**  
What: Multiple users contributing to same heritage topic/event  
Why: Some heritage requires multiple perspectives (village history, shared practices)  
How: Nostr: Add multiple 'p' tags to kind 30023 for co-authors OR use kind 1 reply threads to link | Codebase: Extend heritage creation to support co-authors (needs design decision)  
Value: Richer documentation, community co-creation, shared ownership

**13. Contributor Directory**  
What: Browse all contributors by culture, region, or expertise  
Why: No systematic way to find heritage keepers  
How: Nostr: Query all kind 30023, extract unique pubkeys, fetch kind 0 for each | Codebase: New /contributors route, aggregate authors, reuse profile fetching  
Value: Network effect, find experts, build contributor ecosystem

**14. Trending Contributions**  
What: Highlight most-engaged heritage contributions (comments, reactions, reposts)  
Why: Quality work gets lost in chronological feed  
How: Nostr: Query heritage events + count `{ kinds: [1, 7], '#e': [eventId] }` for each, score by total | Codebase: New engagement counting service (needs caching for performance)  
Value: Surface best content, motivate quality, onboard newcomers with highlights

**15. Mutual Connections**  
What: Show "You both follow X and Y" or "3 mutual connections" on profiles  
Why: No context about relationship proximity  
How: Nostr: Fetch kind 3 for both users, compare 'p' tag arrays, find intersection | Codebase: Extend contributor profile to show mutual follows, reuse contact list parsing  
Value: Build trust, facilitate introductions, strengthen network density

_Last Updated: October 13, 2025_
