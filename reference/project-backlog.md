# Culture Bridge Backlog: Nostr Integration Roadmap

Purpose: A structured backlog- End-to-end user flows implemented per page: list → filter/sort/search → detail → back preserves list state; media playback and downloads work; loading/empty/error states present.

## Notes

- Preserve visual design; implement missing user flows as first-class work. Current pages are demo-only and many flows are non-functional.
- Keep UI consistent; flip data via a feature flag. Fallback to existing mocks when disabled.
- Map all work to referenced NIPs to preserve protocol rationale.
- Use suggested labels: area/*, type/*, page/*, nip/*, phase/*, priority/

## Labels (suggested)

- area/adapter, area/flows, area/media, area/labels, area/exhibitions, area/explore, area/resources, area/elder-voices, area/home, area/language, area/identity, area/safety, area/curation, area/community, area/exchange, area/contribute, area/reactions, area/payments, area/ops, area/auth, area/moderation, area/messaging, area/notifications, area/versioning, area/analytics, area/api, area/offline
- type/epic, type/story, type/task, type/chore, type/docs
- page/exhibitions, page/explore, page/resources, page/elder-voices, page/home, page/language, page/community, page/exchange, page/downloads
- nip/01, nip/04, nip/05, nip/10, nip/11, nip/12, nip/16, nip/19, nip/23, nip/25, nip/26, nip/28, nip/29, nip/33, nip/36, nip/40, nip/42, nip/46, nip/51, nip/52, nip/56, nip/57, nip/65, nip/68, nip/70, nip/71, nip/84, nip/89, nip/94, nip/96
- phase/1, phase/2, phase/3
- priority/P0, priority/P1, priority/P2

## Iterations (timeboxes)

- Iteration 1 (Phase 1): Foundation infrastructure – Flow foundation + Data backbone + Media + Labels + Content sensitivity (E0, E1, E2, E3, E11)
- Iteration 2 (Phase 1): Home + Navigation – Landing page metrics, featured content, curation lists, and navigation flows (E8, E12)
- Iteration 3 (Phase 2): Core discovery – Explore cultures (primary user journey from home) (E5)
- Iteration 4 (Phase 2): Supporting content – Resources/Downloads + Elder Voices + Reactions (E6, E7, E17)
- Iteration 5 (Phase 2): User system – Identity/Authentication for contribution flows (E10)
- Iteration 6 (Phase 3): Content creation – Contribute flows (users understand what to contribute after exploring) (E16)
- Iteration 7 (Phase 3): Community foundations – User profiles, messaging, moderation, events (E13, E20, E26, E14)
- Iteration 8 (Phase 3): Advanced features – Exhibitions + Language learning + Educational tools (E4, E9, E23)
- Iteration 9 (Phase 3): Specialized features – Exchange + Payments + Analytics + Infrastructure (E15, E18, E19, E22, E21, E24, E25)
- Iteration 10 (Phase 3): Platform completion – Static pages, Support system, Newsletter, Social integration (E27, E28, E29)

## User Journey Rationale

The iteration structure follows the natural user journey and website navigation:

1. **Foundation (Iteration 1)** - Essential infrastructure including content sensitivity handling
   - Users need functional data layers, media resolution, and content safety from the start

2. **Home Landing (Iteration 2)** - Entry point with clear navigation paths  
   - Users land on home → see stats, mission, featured content → get oriented to the platform
   - Curation lists enable meaningful featured content display

3. **Core Discovery (Iteration 3)** - Primary user journey from home
   - Users click "Explore Cultures" → primary discovery experience
   - This is the main value proposition and should work end-to-end early

4. **Supporting Content (Iteration 4)** - Content that enriches discovery
   - Users discover Resources and Elder Voices → supporting content types
   - Reactions system enables engagement with elder stories

5. **User System (Iteration 5)** - Authentication preparation
   - Users want to Contribute → needs identity/auth system first
   - Clean separation between anonymous discovery and authenticated actions

6. **Content Creation (Iteration 6)** - Users become contributors
   - Users understand platform value and content types from exploration (E5, E6, E7)
   - Can contribute meaningfully with context of what exists

7. **Community Features (Iteration 7)** - Social engagement
   - Users engage with Community → profiles, messaging, events, moderation
   - Community events can reference cultural content discovered earlier

8. **Advanced Features (Iteration 8)** - Secondary navigation items
   - Users explore advanced features → exhibitions, language learning
   - Exhibitions are curatorial (more complex than basic discovery)

9. **Specialized Features (Iteration 9)** - Optional/advanced capabilities
   - Exchange, payments, analytics, infrastructure scaling

10. **Platform Completion (Iteration 10)** - Supporting pages and community features
    - About/static pages, support system, newsletter, social media integration

## Page → Iteration → Epic → Story → NIP Mapping

This table provides a complete mapping of how website pages relate to development iterations, epics, user stories, and Nostr NIPs.

| Page/Route | Iteration | Epic | Story | NIPs | Description |
|------------|-----------|------|-------|------|-------------|
| **Foundation (All Pages)** | 1 | E0 | S1-S4 | - | URL state, loading patterns, pagination, search |
| **Foundation (Data Layer)** | 1 | E1 | S1-S2 | 01,11,12,19 | Nostr client, adapters, error handling |
| **Foundation (Media)** | 1 | E2 | S1 | 94,01 | NIP-94 media resolution and caching |
| **Foundation (Labels)** | 1 | E3 | S1 | 68,12,01 | Label taxonomy and filter helpers |
| **Foundation (Safety)** | 1 | E11 | S1-S2 | 36,70,65,01 | Content sensitivity and protection |
| | | | | | |
| **Home** (`/`) | 2 | E8 | S0-S2 | 51,68,12,01 | Landing page, metrics, featured content, CTAs |
| **Home** (`/`) | 2 | E12 | S1 | 51,01 | Featured curation lists integration |
| | | | | | |
| **Explore** (`/explore`) | 3 | E5 | S0-S2 | 33,68,94,12,01,19 | Culture discovery, facets, aggregation |
| **Explore Detail** (`/explore/[id]`) | 3 | E5 | S2 | 33,68,94,12,01,19 | Culture detail with related content |
| | | | | | |
| **Resources** (`/downloads`) | 4 | E6 | S0-S2 | 33,68,94,12,01 | Resources list, filters, downloads |
| **Resource Detail** (`/downloads/[id]`) | 4 | E6 | S2 | 33,68,94,12,01 | Resource detail and media preview |
| **Elder Voices** (`/elder-voices`) | 4 | E7 | S0-S2 | 23,94,68,25,12,01 | Stories, audio playback, ratings |
| **Elder Voices** (`/elder-voices`) | 4 | E17 | S1 | 25,84,01 | Reactions and star ratings system |
| | | | | | |
| **Auth/Identity** (Cross-cutting) | 5 | E10 | S1-S4 | 05,26,46,98,01,19 | Authentication, profiles, delegation |
| | | | | | |
| **Contribute** (`/contribute`) | 6 | E16 | S1-S2 | 98,46,94,33,68,01 | Content submission and publishing |
| **Resource Contribute** (`/downloads/contribute`) | 6 | E16 | S1-S2 | 98,46,94,33,68,01 | Resource upload and metadata |
| | | | | | |
| **Community** (`/community`) | 7 | E13 | S0-S1 | 05,12,19,01 | Member directory and profiles |
| **Member Profile** (`/community/members/[id]`) | 7 | E13 | S1 | 05,12,19,01 | Individual member contributions |
| **Community Events** (`/community/events`) | 7 | E14 | S1 | 52,40,23,01 | Event listings and calendar |
| **Event Detail** (`/community/events/[id]`) | 7 | E14 | S1 | 52,40,23,01 | Event details with descriptions |
| **Community Messaging** (Cross-cutting) | 7 | E20 | S1-S3 | 10,04,01,42 | Comments, DMs, notifications |
| **Community Moderation** (Cross-cutting) | 7 | E26 | S1-S2 | 56,36,68 | Content reporting and governance |
| | | | | | |
| **Exhibitions** (`/exhibitions`) | 8 | E4 | S0-S2 | 33,23,68,94,12,01,19 | Curated exhibitions list/detail |
| **Exhibition Detail** (`/exhibitions/[slug]`) | 8 | E4 | S2 | 33,23,68,94,12,01,19 | Exhibition artifacts and descriptions |
| **Language Learning** (`/language`) | 8 | E9 | S1-S3 | 23,51,68,12,01,30023 | Language content and progress |
| **Enhanced Learning** (Cross-cutting) | 8 | E23 | S1-S3 | 23,51,30023 | Structured modules and assessments |
| **Exhibition Curation** (Tools) | 8 | E24 | S1-S3 | 33,23,94 | Virtual tours and curation tools |
| | | | | | |
| **Exchange** (`/exchange`) | 9 | E15 | S0 | 28,29,42,01 | Cultural exchange programs |
| **About** (`/about`) | 9 | E18 | S1 | 57,05,01 | Payment displays and zaps |
| **Get Involved** (`/get-involved`) | 9 | E19 | S1 | 89,01 | Observability and performance |
| **Nostr** (`/nostr`) | 9 | E22 | S1-S3 | 01,89 | Analytics and reporting |
| **API** (Cross-cutting) | 9 | E25 | S1-S3 | 01,11 | Public API and offline access |
| **Content Management** (Cross-cutting) | 9 | E21 | S1-S3 | 01,33,68,16 | Versioning and rights management |
| | | | | | |
| **About Us** (`/about`) | 10 | E27 | S1-S3 | 01,23 | Mission, team, static content pages |
| **Support** (`/resources#support`) | 10 | E28 | S1-S2 | 01,23 | Help documentation and support tickets |
| **Newsletter** (Footer) | 10 | E29 | S1 | 01 | Email subscription and management |
| **Social Media** (Footer) | 10 | E29 | S2 | 01 | Social links and content sharing |
| **Contact** (`mailto:hello@culturebridge.org`) | 10 | E29 | S3 | 01 | Contact forms and email handling |

### NIP Reference Summary

| NIP | Purpose | Primary Epics | Pages Affected |
|-----|---------|---------------|----------------|
| 01 | Basic protocol | E1,E3,E7,E8,E10,E11,E13,E14,E15,E16,E17,E18,E19,E20,E21,E22,E25,E26,E27,E28,E29 | All |
| 04 | Encrypted DMs | E20 | Community messaging |
| 05 | DNS identity | E10,E13,E18 | Profiles, auth |
| 10 | Comments | E20 | Community discussions |
| 11 | Relay metadata | E1,E25 | Infrastructure |
| 12 | Generic filters | E1,E3,E5,E6,E7,E8,E9,E13 | Content queries |
| 16 | Replaceable events | E21 | Content versioning |
| 19 | bech32 entities | E1,E5,E10,E13 | Content references |
| 23 | Long-form content | E4,E7,E9,E14,E23,E24,E27,E28 | Articles, stories, static pages |
| 25 | Reactions | E7,E17 | Elder voices ratings |
| 26 | Delegation | E10 | Identity management |
| 28 | Public chat | E15 | Exchange channels |
| 29 | Private groups | E15 | Private exchanges |
| 30023 | Categorized lists | E9,E23 | Learning content |
| 33 | Parameterized events | E4,E5,E6,E16,E21,E24,E27 | Cultures, exhibitions, resources, static content |
| 36 | Content sensitivity | E11,E26 | Content moderation |
| 40 | Event expiration | E14 | Community events |
| 42 | Authentication | E15,E20 | Exchange, messaging |
| 46 | Nostr Connect | E10,E16 | Remote signing |
| 51 | Lists | E8,E9,E12,E23 | Featured content, curation |
| 52 | Calendar events | E14 | Community calendar |
| 56 | Reporting | E26 | Content moderation |
| 57 | Lightning zaps | E18 | Payments display |
| 65 | Relay sets | E11 | Protected content |
| 68 | Labels | E3,E4,E5,E6,E7,E9,E11,E16,E21,E26 | Content taxonomy |
| 70 | Protected events | E11 | Sensitive content |
| 84 | Highlights | E17 | Content highlights |
| 89 | Recommended relays | E19,E22 | Performance, analytics |
| 94 | File metadata | E2,E4,E6,E7,E16,E24 | Media resolution |
| 96 | HTTP file storage | E16 | File uploads |
| 98 | HTTP auth | E10,E16 | Publishing auth |

## Definition of Done (global)

- Meets acceptance criteria; no visual regressions versus mocks.
- Typecheck, lint pass; error paths have placeholders/skeletons.
- Feature flag off-by-default in production; telemetry guarded.
- End-to-end user flows implemented per page: list → filter/sort/search → detail → back preserves list state; media playback and downloads work; loading/empty/error states present.

---

## Epics, Stories, and Tasks

Each epic lists: motivation, NIPs, dependencies, affected files, acceptance criteria, and stories with concrete tasks.

### Epic E0: Global UI Flow Foundation

- Motivation: Turn demo pages into production-grade flows with URL-driven state and consistent UX patterns.
- NIPs: n/a (UX foundation)
- Dependencies: None
- Affected files: `src/app/*`, `src/components/pages/*`, shared UI hooks/utilities.
- Acceptance criteria:
  - Filters, search, and sort are encoded in URL query params; back/forward restores state and scroll position.
  - List pages implement pagination or infinite scroll with stable loading placeholders.
  - Each route has `loading.tsx` and `error.tsx` with consistent skeletons and empty states.
  - Debounced search input and cancelable requests for lists with search.
- **Definition of Done:**
  - ✅ All major list pages (explore, exhibitions, resources, elder-voices) have working URL state management
  - ✅ Browser back/forward button preserves filters, search terms, and scroll position
  - ✅ Loading states show skeleton components, not blank pages
  - ✅ Error states show user-friendly messages with retry options
  - ✅ Search input has 300ms debounce and shows loading indicator
  - ✅ Pagination/infinite scroll works without UI glitches
  - ✅ Manual testing: navigate between pages, refresh, use back button - state preserved
- Stories
  - S1: URL state and deep-linking
    - Tasks
      - T1: Build `useQueryParamState` hook for filter/sort/search
      - T2: Preserve list scroll position across navigation
  - S2: Loading, empty, and error patterns
    - Tasks
      - T3: Add `loading.tsx` and `error.tsx` to routes missing them; unify Skeletons/Empty components
  - S3: Pagination / infinite scroll
    - Tasks
      - T4: Create base pagination/virtual list hook; wire to Exhibitions and Resources
  - S4: Search wiring
    - Tasks
      - T5: Debounced search input component; integrate with list queries

### Epic E1: Data Backbone – Adapter & Relay Bootstrap

- Motivation: Serve live data by projecting Nostr events into existing TS types.
- NIPs: 01, 11, 12, 19
- Dependencies: E0 (consumes flow hooks)
- Affected files (initial):
  - `src/lib/nostr/` (new): client, queries, types, adapters
  - `src/types/content.ts` (read-only shapes)
  - `src/app/*` and `src/components/pages/*` (wiring only)
- Acceptance criteria:
  - Feature flag `NEXT_PUBLIC_NOSTR_ENABLE` selects Nostr vs. mocks per page.
  - Shared provider caches queries and exposes typed mappers.
  - Adapter exposes hooks/services to be consumed by page-level epics.
- **Definition of Done:**
  - ✅ Environment variable `NEXT_PUBLIC_NOSTR_ENABLE` controls data source (Nostr vs mocks)
  - ✅ Nostr client connects to at least 3 reliable relays with automatic failover
  - ✅ Query caching prevents duplicate network requests within 5-minute window
  - ✅ All UI types in `src/types/content.ts` are populated by adapters
  - ✅ Error handling: network failures gracefully fall back to cached/mock data
  - ✅ Unit tests: adapter functions handle malformed Nostr events without crashing
  - ✅ Integration test: toggle feature flag and verify UI shows real vs mock data
- Stories
  - S1: Feature flag and provider bootstrap
    - Tasks
      - T1: Add env flag and config loader
      - T2: Create Nostr client and relay pool with basic NIP-11 discovery
      - T3: Implement query wrapper for NIP-12 filters + pagination
      - T4: Define adapter interfaces mapping Nostr events → UI types
      - T5: Add unit tests for adapters (happy path + missing tags)
  - S2: Error handling and graceful fallback
    - Tasks
      - T6: Skeletons/placeholders on network errors
      - T7: Retry and timeout strategy; log minimal telemetry

### Epic E2: Media Resolution (NIP-94)

- Motivation: Resolve hero images, audio, video via canonical file metadata.
- NIPs: 94 (71 optional), 01
- Dependencies: E1
- Affected files: `src/lib/nostr/media.ts`; image/audio consumers in pages
- Acceptance criteria: Given a referenced media id/URL, resolve metadata, checksum, dimensions; return stable URL.
- **Definition of Done:**
  - ✅ NIP-94 metadata resolution works for images, audio, and video files
  - ✅ Media cache reduces duplicate network requests (5-minute TTL minimum)
  - ✅ Fallback blur placeholders display when media fails to load
  - ✅ File integrity: checksums validate to prevent corrupted/tampered media
  - ✅ Performance: media resolution doesn't block page render (async loading)
  - ✅ Test coverage: unit tests for resolver with various NIP-94 event formats
  - ✅ Manual test: verify images load correctly across all pages
- Stories
  - S1: NIP-94 fetch and cache
    - Tasks
      - T1: Implement resolver for kind 1063 with simple in-memory cache
      - T2: Map resolver output to image fields in UI types
      - T3: Fallback to blur placeholder on miss

### Epic E3: Label Taxonomy & Filters (NIP-68)

- Motivation: Power filters/search with structured labels.
- NIPs: 68, 12, 01
- Dependencies: E1
- Affected files: `src/lib/nostr/labels.ts`; filters in Exhibitions/Explore/Resources
- Acceptance criteria: Namespaced labels (`#l:region`, `#l:culture`, `#l:category`, `#l:language:*`) parsed consistently; UI filters read from adapter.
- **Definition of Done:**
  - ✅ Label parser handles all supported namespaces: region, culture, category, language
  - ✅ Filter dropdowns populate with actual label values from Nostr data
  - ✅ NIP-12 query builders construct correct filters from UI selections
  - ✅ Invalid/malformed labels are gracefully ignored without breaking queries
  - ✅ Performance: label parsing doesn't impact initial page load time
  - ✅ Test coverage: parser handles edge cases (empty labels, special characters)
  - ✅ Manual test: filters on explore/exhibitions pages return expected results
- Stories
  - S1: Parse and normalize label tags
    - Tasks
      - T1: Implement parser and canonical enums/mappings
      - T2: Add helpers for building NIP-12 queries from label filters

### Epic E4: Exhibitions Integration (List + Detail)

- Motivation: Replace mocks with NIP-33 canonical records + NIP-23 descriptions + NIP-94 artifacts.
- NIPs: 33, 23, 68, 94, 12, 01, 19
- Dependencies: E0–E3, E5 (core discovery patterns established)
- Affected files: `src/components/pages/ExhibitionsContent.tsx`; `src/components/pages/ExhibitionDetail*.tsx`; `src/app/exhibitions/*`; `src/data/exhibitions.ts`
- Acceptance criteria: Exhibitions list/detail render from relays; filters work; artifacts hydrate lazily.
- **Definition of Done:**
  - ✅ Exhibitions list loads from NIP-33 kind 30002 events with proper pagination
  - ✅ Category/region filters work correctly and update URL state
  - ✅ Search functionality finds exhibitions by title/description (debounced)
  - ✅ Exhibition detail page resolves NIP-23 descriptions and displays artifacts
  - ✅ Artifact gallery lazy-loads media using NIP-94 resolution
  - ✅ Performance: initial page load under 3 seconds on slow connection
  - ✅ Accessibility: images have alt text, keyboard navigation works
  - ✅ Manual test: create/find exhibition, verify all filters and detail views work
- Stories
  - S0: Flow wiring (filters/sort/pagination + deep links)
    - Tasks
      - T0: Encode category/region/search/sort in URL and restore on back
      - T0b: Add pagination or infinite scroll with stable loading
      - T0c: Debounced search input; clear/restore via URL
  - S1: List view from kind 30002 with filters
    - Tasks
      - T1: Query 30002; map tags to fields; hero image via NIP-94
      - T2: Wire filters to NIP-12 + label helpers
  - S2: Detail view hydration
    - Tasks
      - T3: Resolve long description (NIP-23) by reference
      - T4: Fetch artifact media (1063) and map to gallery items

### Epic E5: Explore Integration (Cultures)

- Motivation: Implement the primary user discovery journey from home page - the core value proposition where users explore and learn about different cultures.
- NIPs: 33 (30001), 68, 94, 12, 01, 19
- Dependencies: E0–E3
- Affected files: `src/components/pages/ExploreContent.tsx`; `src/app/explore/*`; `src/app/explore/[id]/page.tsx`; `src/data/explore.ts`
- Acceptance criteria: Cultures list uses 30001; detail aggregates counts; featured via NIP-51 when available; serves as foundation for user understanding of platform content.
- **Definition of Done:**
  - ✅ Cultures list loads from NIP-33 kind 30001 events with region/language facets
  - ✅ Culture detail pages show related exhibitions, resources, and stories counts
  - ✅ "Featured" cultures use NIP-51 curation lists when available
  - ✅ Search works for culture and community names with instant feedback
  - ✅ Clicking content counts navigates to filtered views (e.g., exhibitions for this culture)
  - ✅ Mobile responsive: culture cards display properly on all screen sizes
  - ✅ Performance: culture images load progressively with blur-to-sharp transition
  - ✅ User test: new user can discover and understand cultures within 2 minutes
- Stories
  - S0: Flow wiring (facets + deep links)
    - Tasks
      - T0: Region/language facets stored in URL; deep-link to selections
      - T0b: Clicking counts navigates to destination pages with filters applied
      - T0c: Debounced search by culture/community name
      - T0d: "Load More Cultures" pagination/infinite scroll
  - S1: Culture summaries list
    - Tasks
      - T1: Query 30001; hydrate image; show basic counts (lazy)
  - S2: Culture detail aggregation
    - Tasks
      - T2: Aggregate related exhibitions/resources/stories by culture label

### Epic E6: Resources/Downloads Integration

- NIPs: 33 (30003), 68, 94, 12, 01
- Dependencies: E0–E3
- Affected files: `src/components/pages/DownloadsContent.tsx`; `src/app/downloads/*`; `src/app/downloads/[id]/page.tsx`; `src/data/resources.ts`
- Acceptance criteria: Resources list/detail render from 30003; media resolved; types preserved.
- **Definition of Done:**
  - ✅ Resources list loads from NIP-33 kind 30003 with category/type filtering
  - ✅ Sort functionality works (newest, popular, name) with URL persistence
  - ✅ Download buttons trigger actual file downloads with progress indication
  - ✅ File size and type information displays accurately before download
  - ✅ 404 handling: missing files show helpful error with alternative suggestions
  - ✅ Preview functionality works for PDFs, images, and audio files
  - ✅ Mobile UX: downloads work on mobile devices with proper handling
  - ✅ Analytics: track download counts for popular resource identification
- Stories
  - S0: Flow wiring (filters/sort + downloads)
    - Tasks
      - T0: URL state for category/type/sort; deep-linkable
      - T0b: Download button opens file URL; show size; handle 404 gracefully
  - S1: Resources list
    - Tasks
      - T1: Query 30003; filter by category/type
      - T1b: Add sort (newest/popular) via query params
  - S2: Resource detail
    - Tasks
      - T2: Resolve primary asset and preview image via NIP-94

### Epic E7: Elder Voices Integration (+ Reactions)

- NIPs: 23, 94, 68, 25, 12, 01
- Dependencies: E0–E3
- Affected files: `src/components/pages/ElderVoicesContent.tsx`; `src/data/elderStories.ts`; `src/app/elder-voices/*`
- Acceptance criteria: Stories render from NIP-23 with media; ratings mapped from NIP-25 reactions to 0–5 stars.
- **Definition of Done:**
  - ✅ Elder stories load from NIP-23 events with proper text formatting
  - ✅ Audio playback controls work (play/pause/scrub) with duration display
  - ✅ Star ratings computed from NIP-25 reactions display accurately
  - ✅ Rating submission sends NIP-25 events with optimistic UI updates
  - ✅ Category filtering preserves state when navigating between stories
  - ✅ Transcript toggle works when available (accessibility requirement)
  - ✅ Mobile audio: playback controls work on iOS and Android devices
  - ✅ Emotional impact: users report feeling connected to elder stories
- Stories
  - S0: Flow wiring (audio playback + ratings)
    - Tasks
      - T0: Audio play/pause/progress with duration; transcript toggle if available
      - T0b: Star rating interactions (NIP-25) with optimistic update/rollback
      - T0c: "All Stories" navigation preserves category filter
  - S1: Narrative + media
    - Tasks
      - T1: Query NIP-23 with category label; join NIP-94 audio/image
  - S2: Ratings aggregation
    - Tasks
      - T2: Fetch reactions and compute average stars; keep UI stable

### Epic E8: Home Metrics & Featured Blocks

- Motivation: Create compelling landing page that orients users and guides them to primary discovery (Explore Cultures) and contribution flows.
- NIPs: 51, 68, 12, 01
- Dependencies: E1, E3, E12 (infrastructure, labels, and curation lists for featured content)
- Affected files: `src/app/page.tsx`; `src/data/home.ts`
- Acceptance criteria: Metrics computed from recent queries; featured grids from NIP-51 lists; navigation flows to core discovery pages; graceful fallbacks when content is limited.
- **Definition of Done:**
  - ✅ Platform metrics (cultures, languages, stories) update dynamically from real data
  - ✅ Featured content grids load from NIP-51 curation lists
  - ✅ CTAs ("Explore Cultures", "Share Your Heritage") navigate correctly
  - ✅ Featured culture cards link to detailed pages with proper state management
  - ✅ Graceful degradation: fallback content when featured lists are empty
  - ✅ Performance: home page loads under 2 seconds on average connection
  - ✅ Analytics: track CTA click-through rates to understand user journey
  - ✅ User test: first-time visitors understand platform purpose within 30 seconds
- Stories
  - S0: Flow wiring (CTAs + featured culture links)
    - Tasks
      - T0: Header nav routes to pages; back preserves state on return
      - T0b: "Explore Cultures" and "Share Your Heritage" CTAs navigate correctly
      - T0c: Featured culture cards deep-link to culture detail and back restores explore filters
  - S1: Featured via lists
    - Tasks
      - T1: Load featured-cultures/exhibitions/resources lists; intersect
  - S2: Metrics counters
    - Tasks
      - T2: Count distinct cultures/languages/stories in bounded window

### Epic E9: Language Learning & Cultural Education

- Motivation: Comprehensive language learning platform with cultural immersion, structured modules, and progress tracking.
- NIPs: 23, 51, 68, 12, 01, 30023 (categorized lists)
- Dependencies: E3, E5 (E23 provides enhanced tools in parallel)
- Affected files: `src/components/pages/LanguageContent.tsx`; `src/app/language/page.tsx`; learning modules
- Acceptance criteria: Language page populated from curated lists and long-form guides; structured learning modules available; cultural immersion features work; basic progress tracking implemented.
- **Definition of Done:**
  - ✅ Language learning page loads content from NIP-51 curation lists
  - ✅ Cultural immersion modules connect language learning to cultural context
  - ✅ Audio modules work with proper pronunciation and cultural examples
  - ✅ Progress tracking saves learner advancement locally and optionally to Nostr
  - ✅ Community practice features enable peer learning connections
  - ✅ Mobile learning: modules work effectively on mobile devices
  - ✅ Accessibility: audio transcripts available, visual learning supports
  - ✅ User feedback: learners report improved cultural understanding alongside language
- Stories
  - S1: Language-curated content and immersion
    - Tasks
      - T1: Load NIP-51 lists scoped to language labels
      - T2: Create cultural immersion learning experiences
  - S2: Structured learning and guides
    - Tasks
      - T3: Fetch long-form guides with language labels
      - T4: Build listen & learn audio modules
      - T5: Create community practice features
  - S3: Basic progress and engagement
    - Tasks
      - T6: Implement basic progress tracking for language learners
      - T7: Create language practice communities and peer connections

### Epic E10: Identity & User Management

- Motivation: Comprehensive user registration, authentication, profiles, and social features for cultural practitioners and learners.
- NIPs: 05, 26, 46, 98, 01, 19
- Dependencies: E4–E7
- Affected files: identity display components; publishing utilities; user management system; profile pages
- Acceptance criteria: Show NIP-05 where available; support delegated signing; user profiles display contributions and connections; follow/connect functionality works; content contribution management implemented.
- **Definition of Done:**
  - ✅ NIP-05 identity resolution works with graceful fallback to npub
  - ✅ User registration/login flow using Nostr keys (NIP-07 extensions supported)
  - ✅ Profile pages show user contributions across cultures, resources, stories
  - ✅ NIP-26 delegation information displays correctly for institutional accounts
  - ✅ Follow/connect functionality creates NIP-03 contact lists
  - ✅ Content ownership: users can edit/delete their own contributions
  - ✅ Privacy: users control visibility of their contributions and connections
  - ✅ Security test: cannot modify other users' content or profiles
- Stories
  - S1: Identity display and authentication
    - Tasks
      - T1: Resolve and cache NIP-05; fallback to shortened npub
      - T2: Implement Nostr-based user registration and login flow
      - T3: Create user profile creation and editing interface
  - S2: Delegation capability (internal tools first)
    - Tasks
      - T4: Verify and display NIP-26 delegation info in author UI
  - S3: User profiles and connections
    - Tasks
      - T5: Build comprehensive user profile pages (contributions, languages, communities)
      - T6: Implement follow/connect functionality between users
      - T7: Create user dashboard for managing contributions
  - S4: Content contribution management
    - Tasks
      - T8: Build upload, edit, delete interfaces for user content
      - T9: Implement content ownership and permission controls

### Epic E11: Sensitivity & Protected Content

- NIPs: 36, 70, 65, 01
- Dependencies: E1 (data infrastructure for content parsing)
- Acceptance criteria: Sensitive content labeled and gated; optional protected payloads later.
- **Definition of Done:**
  - ✅ NIP-36 content warnings parse correctly and display appropriate badges
  - ✅ Age-restricted content requires user confirmation before viewing
  - ✅ Cultural sensitivity warnings respect community protocols
  - ✅ Protected content (NIP-70) encrypts properly for authorized audiences
  - ✅ Relay set policies (NIP-65) control access to sensitive materials
  - ✅ Override controls: users can disable warnings after initial consent
  - ✅ Community feedback: cultural communities validate sensitivity handling
  - ✅ Legal compliance: content policies meet platform requirements
- Stories
  - S1: Sensitive labeling & warnings
    - Tasks
      - T1: Parse NIP-36; render warnings/badges; respect policies
  - S2: Protected stories (later)
    - Tasks
      - T2: Encrypt selected narratives; audience policy via relay sets

### Epic E12: Curation Lists

- NIPs: 51, 01
- Dependencies: E1 (data infrastructure)
- Affected files: Lists integration across home/exhibitions/explore
- Acceptance criteria: Featured sets powered by NIP-51 lists.
- **Definition of Done:**
  - ✅ NIP-51 lists load correctly and populate featured sections
  - ✅ Curation lists can be updated without code deployment
  - ✅ Featured content rotates based on list priorities or timestamps
  - ✅ Multiple curators can manage different themed lists
  - ✅ Empty lists gracefully display fallback content
  - ✅ Performance: list loading doesn't delay page rendering
  - ✅ Cache strategy: lists update within 5 minutes of publication
  - ✅ Editorial test: curators can successfully feature new content
- Stories
  - S1: Featured lists integration
    - Tasks
      - T1: Load lists by identifier; intersect with page queries

### Epic E13: Community – Member Profiles

- NIPs: 05, 12, 19, 01
- Dependencies: E5, E6, E7, E10 (profiles show content contributions; requires user system and content to aggregate)
- Acceptance criteria: Member pages aggregate authored events by pubkey; show NIP-05 and recent contributions across cultures, resources, and stories.
- **Definition of Done:**
  - ✅ Community directory displays all active contributors with search functionality
  - ✅ Individual member profiles aggregate all contributions (cultures, resources, stories)
  - ✅ NIP-05 identities display with fallback to readable npub format
  - ✅ Contribution timeline shows recent activity with timestamps
  - ✅ Expertise tags help users find specialists in specific cultural areas
  - ✅ Navigation: profile links work from all content pages
  - ✅ Privacy: users control what appears on their public profiles
  - ✅ Performance: profile aggregation completes within 3 seconds
- Stories
  - S0: Community directory (list → profile)
    - Tasks
      - T0: Community directory list on `/community` with search by name/expertise
      - T0b: Practitioner cards link to `/community/members/[id]`; back restores search
  - S1: Profile aggregation
    - Tasks
      - T1: Query by author pubkey; group by content types

### Epic E14: Community – Events

- NIPs: 52, 40, 23, 01
- Dependencies: E5, E10 (events often reference cultural content; requires user system)
- Acceptance criteria: Events list/detail render from NIP-52; optional expiration via NIP-40; events can reference cultural content.
- **Definition of Done:**
  - ✅ Community events load from NIP-52 calendar events with proper date/time display
  - ✅ Event details resolve NIP-23 descriptions and show location/registration info
  - ✅ Events can link to specific cultures, making cultural context clear
  - ✅ Calendar view displays events chronologically with filtering options
  - ✅ Expired events (NIP-40) are handled gracefully with archive access
  - ✅ Time zones: events display correctly for user's local timezone
  - ✅ Integration: events link to related cultural content and profiles
  - ✅ Community test: event organizers can successfully promote cultural events
- Stories
  - S1: Calendar events
    - Tasks
      - T1: Query NIP-52; map to UI; link to NIP-23 descriptions

### Epic E15: Exchange (Optional)

- NIPs: 28 (29 optional), 42, 01
- Dependencies: E10
- Acceptance criteria: Public channels or groups for exchange spaces with basic gating if needed.
- **Definition of Done:**
  - ✅ Exchange directory loads programs from NIP-28 public channels
  - ✅ Program filtering works by type (storytelling, ceremony, craft, dance, music)
  - ✅ Program details link to external registration or internal detail pages
  - ✅ Optional NIP-29 private groups for exclusive exchange programs
  - ✅ Basic gating: some exchanges may require authentication or invitation
  - ✅ Cultural protocols: exchanges respect cultural sharing guidelines
  - ✅ Integration: programs can reference specific cultures or practitioners
  - ✅ Community feedback: cultural exchange facilitates meaningful connections
- Stories
  - S0: Exchange directory flow
    - Tasks
      - T0: Filter programs by type (Storytelling, Ceremony, Craft, Dance, Music)
      - T0b: Program cards link to detail or external registration; deep-linkable

### Epic E16: Contribute Flows (Publishing)

- Motivation: Enable users to become content contributors after they understand the platform through exploration (cultures, resources, elder voices). Users can contribute meaningfully with context of existing content types and community needs.
- NIPs: 98, 46, 94, 33, 68, 01
- Dependencies: E5, E6, E7, E10 (users must understand content types from discovery before contributing; requires auth)
- Acceptance criteria: Submission UI for resources/exhibitions using HTTP auth; remote signing optional; media upload path mapped to NIP-94; users understand contribution context from prior exploration; clear guidance on content types and community guidelines.
- **Definition of Done:**
  - ✅ Contribution forms work for resources, exhibitions, and cultural content
  - ✅ HTTP auth (NIP-98) enables secure content submission
  - ✅ Media upload creates proper NIP-94 file metadata events
  - ✅ Remote signing (NIP-46) works for users with external key management
  - ✅ Content guidelines clearly explain cultural sensitivity and attribution requirements
  - ✅ Preview functionality shows how content will appear before publishing
  - ✅ Content validation prevents incomplete or improperly formatted submissions
  - ✅ User test: contributors successfully publish content within 10 minutes

### Epic E17: Reactions & Highlights

- NIPs: 25, 84, 01
- Dependencies: E7 (Elder Voices integration where reactions are primarily used)
- Acceptance criteria: Map star ratings to NIP-25; optional highlights in detail pages.
- **Definition of Done:**
  - ✅ Star rating system (0-5 stars) converts to/from NIP-25 reactions correctly
  - ✅ Rating submission works with optimistic UI updates and error rollback
  - ✅ Average ratings calculate accurately from multiple NIP-25 events
  - ✅ Optional highlights (NIP-84) work for text selection in elder stories
  - ✅ Rating display updates in real-time when new reactions arrive
  - ✅ Anti-spam: prevent multiple ratings from same user/key
  - ✅ Privacy: users can rate anonymously or publicly
  - ✅ Community trust: ratings reflect genuine community engagement

### Epic E18: Payments (Display)

- NIPs: 57, 05, 01
- Dependencies: E10
- Acceptance criteria: Show zap buttons/summary where appropriate; respect sensitivity policy.
- **Definition of Done:**
  - ✅ Lightning zap buttons (NIP-57) display on appropriate content types
  - ✅ Zap amount selection and confirmation flow works correctly
  - ✅ Zap summaries show appreciation without compromising privacy
  - ✅ Cultural sensitivity: zaps respect community protocols (not all cultures use money)
  - ✅ NIP-05 identity integration for payment recipient verification
  - ✅ Graceful fallback when Lightning infrastructure unavailable
  - ✅ Documentation: clear explanation of appreciation vs commercial transaction
  - ✅ Community acceptance: cultural practitioners comfortable with appreciation mechanism

### Epic E19: Observability & Ops

- NIPs: 89 (optional), 01
- Dependencies: E1–E8
- Acceptance criteria: Minimal logging for query time/hydration; flag-controlled; docs for relay selection and auth.
- **Definition of Done:**
  - ✅ Query performance logging tracks page load times and slow queries
  - ✅ Feature flag controls telemetry collection with privacy protection
  - ✅ Relay health monitoring identifies connection issues and failovers
  - ✅ Documentation covers relay selection criteria and backup strategies
  - ✅ Error logging captures issues without exposing sensitive user data
  - ✅ Performance budgets: alerts when page loads exceed acceptable thresholds
  - ✅ Operational runbooks guide incident response and troubleshooting
  - ✅ Privacy compliance: all logging respects user privacy expectations

### Epic E20: Community Interaction & Messaging

- Motivation: Enable rich community interactions through comments, discussions, and direct messaging between cultural practitioners and learners.
- NIPs: 10 (comments), 04 (encrypted DMs), 01, 42
- Dependencies: E10 (user management), E4–E7 (content)
- Affected files: `src/components/comments/*`, `src/components/messaging/*`, detail pages
- Acceptance criteria: Comments and discussions work on all content types; direct messaging between users; notification system for interactions.
- **Definition of Done:**
  - ✅ NIP-10 threaded comments work on cultures, exhibitions, resources, elder stories
  - ✅ NIP-04 encrypted direct messaging between registered users
  - ✅ Notification system alerts users to replies, mentions, and messages
  - ✅ Moderation tools allow content authors to manage discussions
  - ✅ Comment threading displays clearly with proper indentation
  - ✅ Real-time updates: new comments appear without page refresh
  - ✅ Cultural protocols: discussions respect community guidelines
  - ✅ Performance: comment loading doesn't slow page rendering
- Stories
  - S1: Comments and discussion forums
    - Tasks
      - T1: Implement NIP-10 threaded comments on cultural content
      - T2: Build discussion forum interface for community topics
      - T3: Add comment moderation tools and reporting
  - S2: Direct messaging
    - Tasks
      - T4: Implement NIP-04 encrypted direct messaging between users
      - T5: Create message interface and conversation history
  - S3: Notification system
    - Tasks
      - T6: Build notification system for new content, interactions, events
      - T7: Add user notification preferences and management

### Epic E21: Content Management & Version Control

- Motivation: Advanced content organization, version history, and intellectual property protection for cultural heritage materials.
- NIPs: 01, 33, 68, 16 (replaceable events)
- Dependencies: E3 (labels), E10 (user management)
- Affected files: `src/lib/versioning/*`, `src/components/content/*`, admin interfaces
- Acceptance criteria: Version control tracks changes to cultural data; rights management protects IP; content authenticity verification works.
- **Definition of Done:**
  - ✅ NIP-16 replaceable events enable content versioning with full history
  - ✅ Content diff viewer shows changes between versions clearly
  - ✅ Rights management system protects cultural intellectual property
  - ✅ Attribution tracking ensures proper credit to cultural contributors
  - ✅ Rollback functionality allows restoration of previous content versions
  - ✅ Authenticity verification prevents unauthorized modifications
  - ✅ Cultural protocols: version control respects community ownership practices
  - ✅ Legal compliance: rights management meets international IP standards
- Stories
  - S1: Version control for cultural data
    - Tasks
      - T1: Implement event replacement chains for content versioning
      - T2: Build diff and history viewer for content changes
      - T3: Add rollback capabilities for content editors
  - S2: Rights management and IP protection
    - Tasks
      - T4: Create licensing and attribution system for cultural content
      - T5: Implement usage permissions and access controls
  - S3: Authenticity verification
    - Tasks
      - T6: Build verification mechanisms for cultural content sources
      - T7: Create authenticity badges and verification workflows

### Epic E22: Advanced Analytics & Reporting

- Motivation: Comprehensive insights into platform usage, cultural impact, and preservation metrics.
- NIPs: 01, 89 (app-specific data)
- Dependencies: E8 (basic metrics), E19 (ops)
- Affected files: `src/lib/analytics/*`, `src/components/dashboards/*`, admin interfaces
- Acceptance criteria: Usage statistics track most viewed cultures and content; contributor activity reports available; impact measurement of preservation efforts implemented.
- **Definition of Done:**
  - ✅ Analytics dashboard shows content popularity, views, and engagement metrics
  - ✅ Cultural impact metrics measure preservation effectiveness and reach
  - ✅ Contributor activity reports track participation and content creation
  - ✅ Privacy compliance: analytics respect user privacy and GDPR requirements
  - ✅ Real-time reporting: key metrics update within 1 hour of activity
  - ✅ Export functionality: stakeholders can download reports for grants/funding
  - ✅ Cultural insights: analytics help identify endangered cultures needing support
  - ✅ Performance metrics: platform efficiency and user satisfaction tracking
- Stories
  - S1: Usage statistics and insights
    - Tasks
      - T1: Build analytics dashboard for content popularity and engagement
      - T2: Create culture and language preservation impact metrics
      - T3: Implement user engagement and retention analytics
  - S2: Contributor and community reports
    - Tasks
      - T4: Build contributor activity dashboards and reports
      - T5: Create community health and growth metrics
  - S3: Cultural impact measurement
    - Tasks
      - T6: Design metrics for measuring preservation effectiveness
      - T7: Build reporting tools for cultural institutions and stakeholders

### Epic E23: Enhanced Educational Tools

- Motivation: Structured learning modules, assessments, and progress tracking for cultural and language education.
- NIPs: 23 (long-form), 51 (lists), 30023 (categorized lists)
- Dependencies: E9 (basic language learning), E5 (cultures)
- Affected files: `src/components/education/*`, `src/app/learn/*`, learning modules
- Acceptance criteria: Structured learning modules available; quizzes and assessments work; progress tracking for learners implemented; interactive cultural lessons functional.
- **Definition of Done:**
  - ✅ Interactive learning modules provide structured cultural and language education
  - ✅ Assessment system accurately evaluates cultural knowledge and progress
  - ✅ Progress tracking shows learner achievements and completion rates
  - ✅ Adaptive learning adjusts difficulty based on individual performance
  - ✅ Cultural competency certificates provide recognized achievement validation
  - ✅ Lesson progression follows pedagogically sound educational principles
  - ✅ Accessibility: learning tools work for diverse learning styles and abilities
  - ✅ Cultural authenticity: educational content validated by cultural experts
- Stories
  - S1: Structured learning modules
    - Tasks
      - T1: Create modular lesson framework for cultural and language learning
      - T2: Build lesson progression and curriculum management
  - S2: Assessments and quizzes
    - Tasks
      - T3: Implement quiz and assessment system for cultural knowledge
      - T4: Create adaptive learning based on assessment results
  - S3: Progress tracking and certification
    - Tasks
      - T5: Build learner progress tracking and achievement system
      - T6: Create cultural competency certificates and badges

### Epic E24: Exhibition Curation Tools

- Motivation: Advanced tools for creating immersive cultural exhibitions and virtual experiences.
- NIPs: 33 (parameterized replaceable events), 23 (long-form), 94 (file metadata)
- Dependencies: E4 (exhibitions), E2 (media)
- Affected files: `src/components/exhibitions/curation/*`, `src/components/virtual-tours/*`
- Acceptance criteria: Virtual tours and immersive experiences available; integration with external cultural institutions; advanced curation tools for exhibitions.
- **Definition of Done:**
  - ✅ 360° virtual tours provide immersive cultural site exploration
  - ✅ Integration with museum APIs enables content sharing and collaboration
  - ✅ Drag-and-drop exhibition builder allows intuitive curation workflows
  - ✅ Multimedia experiences support VR/AR for enhanced cultural immersion
  - ✅ Import/export tools work with standard museum and cultural institution formats
  - ✅ Collaborative curation enables multiple curators to work on exhibitions
  - ✅ Performance optimization: virtual tours load efficiently on various devices
  - ✅ Cultural sensitivity: exhibition tools respect sacred and sensitive content protocols
- Stories
  - S1: Virtual tours and immersive experiences
    - Tasks
      - T1: Build 360° virtual tour interface for cultural sites
      - T2: Create immersive multimedia exhibition experiences
  - S2: External integrations
    - Tasks
      - T3: Integrate with museums and cultural institution APIs
      - T4: Build import/export tools for external exhibition content
  - S3: Advanced curation tools
    - Tasks
      - T5: Create visual exhibition builder with drag-and-drop interface
      - T6: Implement collaborative curation workflows

### Epic E25: Technical Infrastructure & API

- Motivation: Scalable architecture, comprehensive API, security measures, and offline capabilities for remote communities.
- NIPs: 01, 11 (relay info), various for API coverage
- Dependencies: E1 (data backbone), E19 (ops)
- Affected files: `src/api/*`, `src/lib/offline/*`, infrastructure components
- Acceptance criteria: API available for external integrations; offline access works for remote communities; security measures protect data and user privacy; scalable architecture supports growth.
- **Definition of Done:**
  - ✅ Comprehensive API documentation with SDKs for major programming languages
  - ✅ Offline-first architecture allows content access without internet connectivity
  - ✅ Security audit completed with penetration testing and vulnerability assessment
  - ✅ API rate limiting protects against abuse while supporting legitimate usage
  - ✅ Horizontal scaling supports 10x growth in users and content volume
  - ✅ Automated backup system ensures data recovery within 4 hours
  - ✅ Authentication system integrates with Nostr keys and traditional auth methods
  - ✅ Performance monitoring: API responses under 200ms for 95th percentile requests
- Stories
  - S1: Public API for external integrations
    - Tasks
      - T1: Design and implement comprehensive REST/GraphQL API
      - T2: Create API documentation and developer resources
      - T3: Build API authentication and rate limiting
  - S2: Offline access and sync
    - Tasks
      - T4: Implement offline-first architecture for remote communities
      - T5: Build content synchronization for offline/online transitions
  - S3: Security and scalability
    - Tasks
      - T6: Implement comprehensive security measures and audit logging
      - T7: Design and implement horizontal scaling architecture
      - T8: Create automated backup and disaster recovery systems

### Epic E26: Moderation & Community Management

- Motivation: Tools for community moderation, content governance, and maintaining cultural sensitivity in platform interactions.
- NIPs: 56 (reporting), 36 (content warnings), 68 (labels)
- Dependencies: E10 (user management), E20 (community interactions)
- Affected files: `src/components/moderation/*`, `src/admin/*`, moderation interfaces
- Acceptance criteria: Content moderation tools available; reporting system works; community guidelines enforced; cultural sensitivity maintained.
- **Definition of Done:**
  - ✅ NIP-56 reporting system enables community-driven content moderation
  - ✅ Cultural sensitivity review process involves community elders and leaders
  - ✅ Moderation dashboard provides efficient workflow for reviewing reported content
  - ✅ Automated screening flags potentially problematic content for human review
  - ✅ Community guidelines clearly articulate cultural respect and inclusion policies
  - ✅ Escalation procedures ensure sensitive cultural matters receive appropriate attention
  - ✅ Elder/leader verification system validates cultural authority and expertise
  - ✅ Appeal process allows fair resolution of moderation disputes
- Stories
  - S1: Content moderation tools
    - Tasks
      - T1: Build content reporting and review system using NIP-56
      - T2: Create moderation dashboard and workflow tools
      - T3: Implement automated content screening for inappropriate material
  - S2: Community governance
    - Tasks
      - T4: Create community guidelines and cultural sensitivity policies
      - T5: Build community leader and elder verification system
      - T6: Implement escalation procedures for sensitive cultural content

### Epic E27: Static Pages & Content Management

- Motivation: Complete the platform with essential static pages including About Us, Mission, Team, and other informational content that users expect to find.
- NIPs: 01, 23 (long-form content), 33 (structured content)
- Dependencies: E1 (data infrastructure), E21 (content management system)
- Affected files: `src/app/about/*`, `src/components/pages/AboutContent.tsx`, `src/data/about.ts`, static content management system
- Acceptance criteria: About Us page with mission, team, and story; content is manageable without code deployments; consistent branding and messaging across all static pages.
- **Definition of Done:**
  - ✅ About Us page clearly communicates cultural preservation mission and values
  - ✅ Team profiles showcase diverse cultural backgrounds and expertise
  - ✅ Content management system allows non-technical updates to static pages
  - ✅ Privacy policy and terms of service address cultural sensitivity and Nostr decentralization
  - ✅ Cultural guidelines explain respectful engagement with indigenous and traditional knowledge
  - ✅ Content licensing policies protect traditional knowledge while enabling sharing
  - ✅ Consistent branding and messaging reinforce cultural preservation goals
  - ✅ Version control for static content enables easy rollback of inappropriate changes
- Stories
  - S1: About Us and Mission pages
    - Tasks
      - T1: Build comprehensive About Us page with mission statement
      - T2: Create team/contributor profiles and bios
      - T3: Add platform story and cultural preservation philosophy
  - S2: Static content management
    - Tasks
      - T4: Implement CMS for static page content updates
      - T5: Create content versioning for static pages
  - S3: Legal and policy pages
    - Tasks
      - T6: Add privacy policy, terms of service, and cultural sensitivity guidelines
      - T7: Create content licensing and attribution policies

### Epic E28: Support System & Documentation

- Motivation: Provide comprehensive support for users navigating cultural preservation, troubleshooting platform issues, and understanding Nostr integration.
- NIPs: 01, 23 (documentation content)
- Dependencies: E5 (user understanding of core features), E16 (contributor support needs)
- Affected files: `src/app/support/*`, `src/components/support/*`, help documentation system
- Acceptance criteria: Comprehensive help documentation; support ticket system; FAQ covering cultural sensitivity and Nostr concepts; user guidance for contribution workflows.
- **Definition of Done:**
  - ✅ FAQ addresses common questions about cultural preservation and Nostr technology
  - ✅ Step-by-step guides help users navigate exploration, contribution, and community features
  - ✅ Support ticket system routes inquiries to appropriate team members
  - ✅ Documentation explains complex Nostr concepts in accessible, non-technical language
  - ✅ Cultural sensitivity guide helps users understand appropriate engagement protocols
  - ✅ Admin dashboard enables efficient support team workflow and response tracking
  - ✅ Automated responses provide immediate help for common issues
  - ✅ Multi-language support for documentation serves diverse global communities
- Stories
  - S1: Help documentation and FAQ
    - Tasks
      - T1: Create comprehensive FAQ covering cultural preservation workflows
      - T2: Build step-by-step guides for exploration, contribution, and community participation
      - T3: Document Nostr concepts and decentralized features for non-technical users
  - S2: Support ticket system
    - Tasks
      - T4: Implement support ticket creation and management system
      - T5: Build admin dashboard for support team to manage inquiries
      - T6: Create automated responses for common issues

### Epic E29: Newsletter & Social Integration

- Motivation: Build community engagement through newsletter subscriptions, social media integration, and external communication channels that extend platform reach.
- NIPs: 01 (basic protocol for integration)
- Dependencies: E8 (home page integration), E20 (community features)
- Affected files: `src/components/Footer.tsx`, newsletter system, social media integration
- Acceptance criteria: Email newsletter signup functional; social media links active; potential content sharing capabilities; contact system operational.
- **Definition of Done:**
  - ✅ Newsletter signup form collects emails with proper validation and confirmation
  - ✅ Email newsletter template showcases cultural content and platform updates
  - ✅ Social media links connect to active, maintained accounts promoting cultural preservation
  - ✅ Content sharing buttons enable users to share cultural items across social platforms
  - ✅ Contact form routes inquiries to appropriate team members with automatic acknowledgment
  - ✅ Unsubscribe system complies with email marketing regulations (CAN-SPAM, GDPR)
  - ✅ Social media content syndication promotes platform visibility and cultural awareness
  - ✅ Newsletter analytics track engagement and cultural content effectiveness
- Stories
  - S1: Newsletter subscription system
    - Tasks
      - T1: Implement email subscription form in footer
      - T2: Build newsletter template and sending system
      - T3: Create subscription management and unsubscribe workflows
  - S2: Social media integration
    - Tasks
      - T4: Implement active social media links (Twitter, GitHub)
      - T5: Add social sharing capabilities for cultural content
      - T6: Create social media content syndication (optional)
  - S3: Contact and communication
    - Tasks
      - T7: Build contact form system with email handling
      - T8: Implement contact email routing and management
      - T9: Create automated acknowledgment and follow-up system

---

## How to use this file

- Review and tweak iterations/estimates/labels.
- Once the epic definitions above are finalized, a comprehensive CSV can be generated for GitHub Project import.
- Custom fields needed: Iteration, Epic, NIPs for proper project management integration.

---

## References

- UI types: src/types/content.ts
- Pages: `src/app/*` and `src/components/pages/*`
