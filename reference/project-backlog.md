# Culture Bridge Backlog: Nostr Integration Roadmap

Purpose: A structured backlog derived from reference/NIP-list.md to plan and track the migration from mocks to Nostr and to productionize UI flows. Organized as iterations (timeboxes), epics, user stories, and implementation tasks. Includes an import-ready CSV for GitHub Projects (v2).

## Notes

- Preserve visual design; implement missing user flows as first-class work. Current pages are demo-only and many flows are non-functional.
- Keep UI consistent; flip data via a feature flag. Fallback to existing mocks when disabled.
- Map all work to referenced NIPs to preserve protocol rationale.
- Use suggested labels: area/*, type/*, page/*, nip/*, phase/*, priority/*.
- Align with `reference/user-flows.md`: each page has explicit search, filter, load-more, and CTA navigation flows.
- **Top-down integration**: Requirements from `reference/user-flows.md` "Typical Requirements for a Cultural Bridge Platform" are systematically integrated into epics, ensuring comprehensive feature coverage across all 8 requirement categories.

## Labels (suggested)

- area/adapter, area/flows, area/media, area/labels, area/exhibitions, area/explore, area/resources, area/elder-voices, area/home, area/language, area/identity, area/safety, area/curation, area/community, area/exchange, area/contribute, area/reactions, area/payments, area/ops, area/auth, area/moderation, area/messaging, area/notifications, area/versioning, area/analytics, area/api, area/offline
- type/epic, type/story, type/task, type/chore, type/docs
- page/exhibitions, page/explore, page/resources, page/elder-voices, page/home, page/language, page/community, page/exchange, page/downloads
- nip/01, nip/05, nip/10, nip/11, nip/12, nip/19, nip/23, nip/25, nip/26, nip/28, nip/29, nip/33, nip/36, nip/42, nip/46, nip/51, nip/52, nip/57, nip/65, nip/68, nip/70, nip/71, nip/84, nip/89, nip/94, nip/96
- phase/1, phase/2, phase/3
- priority/P0, priority/P1, priority/P2

## Iterations (timeboxes)

- Iteration 1 (Phase 1): Flow foundation + Data backbone – Adapter, Media, Labels
- Iteration 2 (Phase 2): Exhibitions end-to-end
- Iteration 3 (Phase 2): Explore + Resources
- Iteration 4 (Phase 2): Elder Voices + Reactions + Home metrics
- Iteration 5 (Phase 3): Identity/Delegation + Sensitivity + Curation lists
- Iteration 6 (Phase 3): Community (Profiles + Events) + User Management
- Iteration 7 (Phase 3): Contribute flows + Payments + Ops + Analytics  
- Iteration 8 (Optional): Language learning + Exchange + Advanced Features
- Iteration 9 (Future): Content Management + API + Offline Access

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
- Stories
  - S1: Parse and normalize label tags
    - Tasks
      - T1: Implement parser and canonical enums/mappings
      - T2: Add helpers for building NIP-12 queries from label filters

### Epic E4: Exhibitions Integration (List + Detail)

- Motivation: Replace mocks with NIP-33 canonical records + NIP-23 descriptions + NIP-94 artifacts.
- NIPs: 33, 23, 68, 94, 12, 01, 19
- Dependencies: E0–E3
- Affected files: `src/components/pages/ExhibitionsContent.tsx`; `src/components/pages/ExhibitionDetail*.tsx`; `src/app/exhibitions/*`; `src/data/exhibitions.ts`
- Acceptance criteria: Exhibitions list/detail render from relays; filters work; artifacts hydrate lazily.
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

- NIPs: 33 (30001), 68, 94, 12, 01, 19
- Dependencies: E0–E3
- Affected files: `src/components/pages/ExploreContent.tsx`; `src/app/explore/*`; `src/app/explore/[id]/page.tsx`; `src/data/explore.ts`
- Acceptance criteria: Cultures list uses 30001; detail aggregates counts; featured via NIP-51 when available.
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

- NIPs: 51, 68, 12, 01
- Dependencies: E4–E7
- Affected files: `src/app/page.tsx`; `src/data/home.ts`
- Acceptance criteria: Metrics computed from recent queries; featured grids from NIP-51 lists.
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
- Dependencies: E3, E5, E23 (enhanced educational tools)
- Affected files: `src/components/pages/LanguageContent.tsx`; `src/app/language/page.tsx`; learning modules
- Acceptance criteria: Language page populated from curated lists and long-form guides; structured learning modules available; cultural immersion features work; basic progress tracking implemented.
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
- Dependencies: E4–E7
- Acceptance criteria: Sensitive content labeled and gated; optional protected payloads later.
- Stories
  - S1: Sensitive labeling & warnings
    - Tasks
      - T1: Parse NIP-36; render warnings/badges; respect policies
  - S2: Protected stories (later)
    - Tasks
      - T2: Encrypt selected narratives; audience policy via relay sets

### Epic E12: Curation Lists

- NIPs: 51, 01
- Dependencies: E4–E8
- Acceptance criteria: Featured sets powered by lists; editors can update without redeploy.
- Stories
  - S1: Featured lists integration
    - Tasks
      - T1: Load lists by identifier; intersect with page queries

### Epic E13: Community – Member Profiles

- NIPs: 05, 12, 19, 01
- Dependencies: E4–E7, E10
- Acceptance criteria: Member pages aggregate authored events by pubkey; show NIP-05 and recent contributions.
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
- Dependencies: E4–E7
- Acceptance criteria: Events list/detail render from NIP-52; optional expiration via NIP-40.
- Stories
  - S1: Calendar events
    - Tasks
      - T1: Query NIP-52; map to UI; link to NIP-23 descriptions

### Epic E15: Exchange (Optional)

- NIPs: 28 (29 optional), 42, 01
- Dependencies: E10
- Acceptance criteria: Public channels or groups for exchange spaces with basic gating if needed.
- Stories
  - S0: Exchange directory flow
    - Tasks
      - T0: Filter programs by type (Storytelling, Ceremony, Craft, Dance, Music)
      - T0b: Program cards link to detail or external registration; deep-linkable

### Epic E16: Contribute Flows (Publishing)

- NIPs: 98, 46, 94, 33, 68, 01
- Dependencies: E4–E7, E10
- Acceptance criteria: Submission UI for resources/exhibitions using HTTP auth; remote signing optional; media upload path mapped to NIP-94.

### Epic E17: Reactions & Highlights

- NIPs: 25, 84, 01
- Dependencies: E4–E7
- Acceptance criteria: Map star ratings to NIP-25; optional highlights in detail pages.

### Epic E18: Payments (Display)

- NIPs: 57, 05, 01
- Dependencies: E10
- Acceptance criteria: Show zap buttons/summary where appropriate; respect sensitivity policy.

### Epic E19: Observability & Ops

- NIPs: 89 (optional), 01
- Dependencies: E1–E8
- Acceptance criteria: Minimal logging for query time/hydration; flag-controlled; docs for relay selection and auth.

### Epic E20: Community Interaction & Messaging

- Motivation: Enable rich community interactions through comments, discussions, and direct messaging between cultural practitioners and learners.
- NIPs: 10 (comments), 04 (encrypted DMs), 01, 42
- Dependencies: E10 (user management), E4–E7 (content)
- Affected files: `src/components/comments/*`, `src/components/messaging/*`, detail pages
- Acceptance criteria: Comments and discussions work on all content types; direct messaging between users; notification system for interactions.
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

---

## Import-ready CSV for GitHub Projects (paste into the table)

The table columns map to Project custom fields. You can paste this block into a Project (Table view) and map columns as needed.

Columns: Type, Title, Iteration, Epic, Labels, NIPs, Depends On, Files, Acceptance Criteria, Estimate

```csv
Type,Title,Iteration,Epic,Labels,NIPs,Depends On,Files,Acceptance Criteria,Estimate
Epic,E0: Global UI Flow Foundation,Iteration 1,E0,"type/epic area/flows phase/1 priority/P0","",,src/app/*|src/components/pages/*,"URL state, loading/error/empty patterns, pagination/search hooks",8
Story,S1: URL state and deep-linking,Iteration 1,E0,"type/story area/flows phase/1","",,shared hooks,"Query params reflect filters/sort/search; back restores state",3
Task,T1: useQueryParamState hook,Iteration 1,E0,"type/task area/flows phase/1","",,shared hooks,Hook implemented and unit-tested,1
Story,S2: Loading/empty/error patterns,Iteration 1,E0,"type/story area/flows phase/1","",,routes,"All routes have loading.tsx/error.tsx and empty states",2
Story,S3: Pagination / infinite scroll,Iteration 1,E0,"type/story area/flows phase/1","",,shared hooks,"Pagination or virtual list present for long lists",2
Story,S4: Search wiring,Iteration 1,E0,"type/story area/flows phase/1","",,components,"Debounced search input with cancelable queries",2

Epic,E1: Data Backbone – Adapter & Relay Bootstrap,Iteration 1,E1,"type/epic area/adapter phase/1 priority/P0","01|11|12|19",E0,src/lib/nostr/*|src/types/content.ts|src/app/*,Flag-based provider serving typed data; adapter hooks available,8
Story,S1: Feature flag and provider bootstrap,Iteration 1,E1,"type/story area/adapter phase/1 priority/P0","01|11|12|19",E0,src/lib/nostr/*|src/app/*,Flag toggles Nostr vs mocks per page,3
Task,T1: Add env flag and config loader,Iteration 1,E1,"type/task area/adapter phase/1","01",,src/lib/nostr/config.ts|.env.local,Env flag present and read at runtime,1
Task,T2: Create Nostr client and relay pool,Iteration 1,E1,"type/task area/adapter phase/1","01|11",,src/lib/nostr/client.ts,Nostr client connects to configured relays,2
Task,T3: Query wrapper for NIP-12 filters,Iteration 1,E1,"type/task area/adapter phase/1","12",,src/lib/nostr/query.ts,Can request with kinds/tags/limit/since,2
Task,T4: Define adapters (events -> UI types),Iteration 1,E1,"type/task area/adapter phase/1","01|19",,src/lib/nostr/adapters.ts,Adapters return shapes in src/types/content.ts,2
Task,T5: Unit tests for adapters,Iteration 1,E1,"type/task area/adapter phase/1 type/testing","01",T4,tests/nostr/adapters.test.ts,Tests cover happy/missing tags,1
Story,S2: Error handling and fallback,Iteration 1,E1,"type/story area/adapter phase/1","01",,src/lib/nostr/*,Skeletons/placeholders on error; retries,2
Task,T6: Implement retries/timeouts/logging,Iteration 1,E1,"type/task area/adapter phase/1 type/chore","01",,src/lib/nostr/query.ts,Backoff and timeout applied; logs minimal,1

Epic,E2: Media Resolution (NIP-94),Iteration 1,E2,"type/epic area/media phase/1 priority/P0","94|01",E1,src/lib/nostr/media.ts|image consumers,Media resolved via NIP-94 with fallback,5
Story,S1: NIP-94 fetch and cache,Iteration 1,E2,"type/story area/media phase/1","94",E1,src/lib/nostr/media.ts,Resolver returns checksum/dimensions/url,2
Task,T1: Implement 1063 resolver + cache,Iteration 1,E2,"type/task area/media phase/1","94",,src/lib/nostr/media.ts,Cache hit reduces duplicate fetch,1
Task,T2: Map resolver to UI image fields,Iteration 1,E2,"type/task area/media phase/1","94",,src/components/pages/*,Hero images resolved; fallback on miss,1

Epic,E3: Label Taxonomy & Filters (NIP-68),Iteration 1,E3,"type/epic area/labels phase/1 priority/P0","68|12|01",E1,src/lib/nostr/labels.ts|filters,Labels parsed and used in queries and UI,5
Story,S1: Parse and normalize label tags,Iteration 1,E3,"type/story area/labels phase/1","68",E1,src/lib/nostr/labels.ts,Parser handles region/culture/category/language,2
Task,T1: Canonical enums/mappings,Iteration 1,E3,"type/task area/labels phase/1","68",,src/lib/nostr/labels.ts,Known namespaces mapped to enums,1
Task,T2: Build NIP-12 filter helpers,Iteration 1,E3,"type/task area/labels phase/1","12",,src/lib/nostr/query.ts,Helpers compose label filters efficiently,1

Epic,E4: Exhibitions Integration,Iteration 2,E4,"type/epic area/exhibitions phase/2 priority/P0 page/exhibitions","33|23|68|94|12|01|19",E1|E2|E3,src/components/pages/ExhibitionsContent.tsx|src/app/exhibitions/*,List/detail from relays; filters OK; artifacts hydrate,8
Story,S0: Flow wiring (filters/sort/pagination + deep links),Iteration 2,E4,"type/story area/flows page/exhibitions","",E0,src/app/exhibitions/page.tsx,"URL-encoded filters/sort; pagination or infinite scroll",2
Task,T0c: Debounced search input,Iteration 2,E4,"type/task area/flows page/exhibitions","",E0,src/app/exhibitions/page.tsx,Search added and URL-synced,1
Story,S1: List view from 30002 with filters,Iteration 2,E4,"type/story area/exhibitions page/exhibitions","33|68|12",E1|E3,src/components/pages/ExhibitionsContent.tsx,List renders from kinds[30002] with filters,3
Task,T1: Query 30002 + map fields,Iteration 2,E4,"type/task area/exhibitions","33|68|12",,src/lib/nostr/adapters.ts,Fields mapped (title, region, image, tags),1
Task,T2: Wire filter UI to label helpers,Iteration 2,E4,"type/task area/exhibitions","68|12",,src/components/pages/ExhibitionsContent.tsx,Filters reflect label selections,1
Story,S2: Detail hydration (desc + artifacts),Iteration 2,E4,"type/story area/exhibitions page/exhibitions","23|94|33",E2,src/components/pages/ExhibitionDetail*.tsx,Detail loads long-form and media gallery,3
Task,T3: Resolve NIP-23 description,Iteration 2,E4,"type/task area/exhibitions","23",,src/lib/nostr/adapters.ts,Description appears when referenced,1
Task,T4: Fetch 1063 artifact media,Iteration 2,E4,"type/task area/exhibitions","94",,src/lib/nostr/media.ts,Artifacts render with checksummed URLs,1

Epic,E5: Explore Integration,Iteration 3,E5,"type/epic area/explore phase/2 priority/P1 page/explore","33|68|94|12|01|19",E1|E2|E3,src/components/pages/ExploreContent.tsx|src/app/explore/*,Culture list/detail via 30001 with counts,5
Story,S0: Flow wiring (facets + deep links),Iteration 3,E5,"type/story area/flows page/explore","",E0,src/app/explore/page.tsx,"Region/language facets in URL; deep-linkable",2
Task,T0c: Search cultures by name,Iteration 3,E5,"type/task area/flows page/explore","",E0,src/app/explore/page.tsx,Debounced search input present,1
Task,T0d: Load more cultures,Iteration 3,E5,"type/task area/flows page/explore","",E0,src/app/explore/page.tsx,Pagination or infinite scroll,1
Story,S1: Culture summaries list,Iteration 3,E5,"type/story area/explore page/explore","33|68|12",E3,src/components/pages/ExploreContent.tsx,List shows culture name, region, hero image,2
Task,T1: Query 30001; hydrate image,Iteration 3,E5,"type/task area/explore","33|94",,src/lib/nostr/adapters.ts,Image and summary present,1
Story,S2: Culture detail aggregation,Iteration 3,E5,"type/story area/explore page/explore","68|12",E4,src/app/explore/[id]/page.tsx,Detail aggregates related content by label,3

Epic,E6: Resources/Downloads Integration,Iteration 3,E6,"type/epic area/resources phase/2 priority/P1 page/downloads","33|68|94|12|01",E1|E2|E3,src/components/pages/DownloadsContent.tsx|src/app/downloads/*,Resources list/detail from 30003; media resolved,5
Story,S0: Flow wiring (filters/sort + downloads),Iteration 3,E6,"type/story area/flows page/downloads","",E0,src/app/downloads/page.tsx,"URL state for category/type/sort; graceful downloads",2
Story,S1: Resources list,Iteration 3,E6,"type/story area/resources page/downloads","33|68|12",E3,src/components/pages/DownloadsContent.tsx,List filters by category/type,2
Task,T1b: Sort resources,Iteration 3,E6,"type/task area/resources page/downloads","",E0,src/app/downloads/page.tsx,Sort newest/popular works,1
Story,S2: Resource detail,Iteration 3,E6,"type/story area/resources page/downloads","94|33",E2,src/app/downloads/[id]/page.tsx,Primary asset and preview resolved,3

Epic,E7: Elder Voices + Reactions,Iteration 4,E7,"type/epic area/elder-voices phase/2 priority/P1 page/elder-voices","23|94|68|25|12|01",E1|E2|E3,src/components/pages/ElderVoicesContent.tsx,Stories render with media; ratings mapped,5
Story,S0: Flow wiring (audio playback + ratings),Iteration 4,E7,"type/story area/flows page/elder-voices","",E0,src/app/elder-voices/page.tsx,"Audio controls and ratings interaction present",2
Task,T0c: All stories preserves filter,Iteration 4,E7,"type/task area/elder-voices page/elder-voices","",E0,src/app/elder-voices/page.tsx,Back restores category,1
Story,S1: Narrative + media,Iteration 4,E7,"type/story area/elder-voices page/elder-voices","23|94|68",E2,src/components/pages/ElderVoicesContent.tsx,Card shows title, elder, image/audio,2
Story,S2: Ratings aggregation,Iteration 4,E7,"type/story area/elder-voices page/elder-voices","25",E7,src/components/pages/ElderVoicesContent.tsx,Stars computed from reactions,3

Epic,E8: Home Metrics & Featured,Iteration 4,E8,"type/epic area/home phase/2 priority/P1 page/home","51|68|12|01",E4|E5|E6|E7,src/app/page.tsx,Featured from lists; metrics computed,3
Story,S0: Flow wiring (CTAs + featured culture links),Iteration 4,E8,"type/story area/home page/home","",E0,src/app/page.tsx,"Header nav + CTAs route correctly; featured links deep-link",2
Task,T0: Header nav routes to pages,Iteration 4,E8,"type/task area/home page/home","",E0,src/components/Header.tsx,Nav items route and preserve state on return,1
Task,T0b: CTA buttons route to pages,Iteration 4,E8,"type/task area/home page/home","",E0,src/app/page.tsx,CTAs navigate correctly,1
Task,T0c: Featured cards deep-link,Iteration 4,E8,"type/task area/home page/home","",E0,src/app/page.tsx,Back restores explore filters,1
Story,S1: Featured via lists,Iteration 4,E8,"type/story area/home page/home","51",E4|E5|E6,src/app/page.tsx,Featured cards source from NIP-51,1
Story,S2: Metrics counters,Iteration 4,E8,"type/story area/home page/home","12|68",E5,src/app/page.tsx,Counters compute within latency budget,2

Epic,E9: Language Learning (Optional),Iteration 8,E9,"type/epic area/language phase/2 priority/P2 page/language","23|51|68|12|01",E5,src/components/pages/LanguageContent.tsx,Curated lists and guides filtered by language,3
Story,S1: Language-curated lists,Iteration 8,E9,"type/story area/language page/language","51|68",E5,src/components/pages/LanguageContent.tsx,Lists load for selected language,1
Story,S2: Guides via NIP-23,Iteration 8,E9,"type/story area/language page/language","23|68",E5,src/components/pages/LanguageContent.tsx,Guides appear for language filters,2

Epic,E10: Identity & Delegation,Iteration 5,E10,"type/epic area/identity phase/3 priority/P1","05|26|46|98|01|19",E4|E7,identity components,Show NIP-05; support delegation display,5
Story,S1: Identity display,Iteration 5,E10,"type/story area/identity","05",,UI components,Show NIP-05 next to authors where available,2
Story,S2: Delegation capability,Iteration 5,E10,"type/story area/identity","26",,UI components,Display delegation info for institutional accounts,3

Epic,E11: Sensitivity & Protected Content,Iteration 5,E11,"type/epic area/safety phase/3 priority/P0","36|70|65|01",E4|E7,safety badges and gating,Label and gate sensitive content; optional protected payloads,5
Story,S1: Sensitive labeling & warnings,Iteration 5,E11,"type/story area/safety","36",,Badge and warning UI,Warnings render when labels present,2
Story,S2: Protected narratives (later),Iteration 5,E11,"type/story area/safety","70|65",,Publishing path,Encrypted body stored and readable by audience,3

Epic,E12: Curation Lists,Iteration 5,E12,"type/epic area/curation phase/3 priority/P1","51|01",E4|E8,lists integration,Featured sets powered by lists,3
Story,S1: Featured lists integration,Iteration 5,E12,"type/story area/curation","51",,Lists hydrate home/exhibitions/explore,3

Epic,E13: Community – Member Profiles,Iteration 6,E13,"type/epic area/community phase/3 priority/P2 page/community","05|12|19|01",E10,src/app/community/members/[id]/page.tsx,Aggregate authored events by pubkey,3
Story,S1: Profile aggregation,Iteration 6,E13,"type/story area/community page/community","12|19",E10,src/app/community/members/[id]/page.tsx,Recent contributions visible,3

Epic,E14: Community – Events,Iteration 6,E14,"type/epic area/community phase/3 priority/P2 page/community","52|40|23|01",E4,src/app/community/events/[id]/page.tsx,Events list/detail from NIP-52; optional expiration,3
Story,S1: Calendar events,Iteration 6,E14,"type/story area/community page/community","52|40",,src/app/community/events/[id]/page.tsx,Event details render with times/links,3

Epic,E15: Exchange (Optional),Iteration 8,E15,"type/epic area/exchange phase/3 priority/P2 page/exchange","28|29|42|01",E10,src/app/exchange/page.tsx,Public channels/groups wired,3

Epic,E16: Contribute Flows (Publishing),Iteration 7,E16,"type/epic area/contribute phase/3 priority/P1 page/downloads","98|46|94|33|68|01",E4|E6|E10,src/app/downloads/contribute/page.tsx,Submission UI with HTTP auth and signing,5
Story,S1: Upload + NIP-94 metadata,Iteration 7,E16,"type/story area/contribute page/downloads","94|96",,upload handlers,Uploads produce NIP-94 events and links,3
Story,S2: Publish canonical records,Iteration 7,E16,"type/story area/contribute page/downloads","33|68|98|46",,server + client,Publish 3000x with labels via signed flow,3

Epic,E17: Reactions & Highlights,Iteration 4,E17,"type/epic area/reactions phase/2 priority/P2","25|84|01",E7,detail pages,Stars via reactions; optional highlights,3
Story,S1: Map star ratings to reactions,Iteration 4,E17,"type/story area/reactions","25",E7,detail pages,0–5 stars computed deterministically,2

Epic,E18: Payments (Display),Iteration 7,E18,"type/epic area/payments phase/3 priority/P2","57|05|01",E10,detail pages,Show zaps where appropriate with context,2

Epic,E19: Observability & Ops,Iteration 7,E19,"type/epic area/ops phase/3 priority/P2","89|01",E1,ops docs and toggles,Minimal telemetry and runbooks present,2
Story,S1: Perf logging (flagged),Iteration 7,E19,"type/story area/ops","01",,logging,Query/hydration timings logged when enabled,1

Epic,E20: Community Interaction & Messaging,Iteration 6,E20,"type/epic area/messaging area/community phase/3 priority/P1","10|04|01|42",E10,src/components/comments/*|src/components/messaging/*,Comments/discussions and DM system functional,8
Story,S1: Comments and discussion forums,Iteration 6,E20,"type/story area/messaging","10",E10,src/components/comments/*,Threaded comments on content; moderation tools,3
Story,S2: Direct messaging,Iteration 6,E20,"type/story area/messaging","04",E10,src/components/messaging/*,Encrypted DMs between users,3
Story,S3: Notification system,Iteration 6,E20,"type/story area/notifications","01",E10,src/components/notifications/*,Notifications for interactions and events,2

Epic,E21: Content Management & Version Control,Iteration 9,E21,"type/epic area/versioning phase/3 priority/P1","01|33|68|16",E3|E10,src/lib/versioning/*,Version control and rights management implemented,8
Story,S1: Version control for cultural data,Iteration 9,E21,"type/story area/versioning","16|33",E3,src/lib/versioning/*,Content versioning and history tracking,3
Story,S2: Rights management and IP protection,Iteration 9,E21,"type/story area/versioning","33|68",E10,content licensing system,Licensing and attribution system,3
Story,S3: Authenticity verification,Iteration 9,E21,"type/story area/versioning","01",E10,verification workflows,Content authenticity mechanisms,2

Epic,E22: Advanced Analytics & Reporting,Iteration 7,E22,"type/epic area/analytics phase/3 priority/P2","01|89",E8|E19,src/lib/analytics/*,Comprehensive analytics and impact reporting,5
Story,S1: Usage statistics and insights,Iteration 7,E22,"type/story area/analytics","89",E19,analytics dashboard,Content popularity and engagement analytics,2
Story,S2: Contributor and community reports,Iteration 7,E22,"type/story area/analytics","01",E19,contributor dashboards,Activity dashboards and community metrics,2
Story,S3: Cultural impact measurement,Iteration 7,E22,"type/story area/analytics","89",E22,reporting tools,Preservation effectiveness metrics,1

Epic,E23: Enhanced Educational Tools,Iteration 8,E23,"type/epic area/language phase/3 priority/P2","23|51|30023",E9|E5,src/components/education/*,Structured learning modules and assessments,8
Story,S1: Structured learning modules,Iteration 8,E23,"type/story area/language","51|30023",E9,learning modules,Modular lesson framework,3
Story,S2: Assessments and quizzes,Iteration 8,E23,"type/story area/language","23",E9,assessment system,Quiz and assessment system,3
Story,S3: Progress tracking and certification,Iteration 8,E23,"type/story area/language","01",E23,progress tracking,Learner progress and achievements,2

Epic,E24: Exhibition Curation Tools,Iteration 8,E24,"type/epic area/exhibitions phase/3 priority/P2","33|23|94",E4|E2,src/components/exhibitions/curation/*,Advanced curation and virtual tours,5
Story,S1: Virtual tours and immersive experiences,Iteration 8,E24,"type/story area/exhibitions","94",E4,virtual tour interface,360° tours and immersive experiences,2
Story,S2: External integrations,Iteration 8,E24,"type/story area/exhibitions","33",E4,external APIs,Museum and institution integrations,2
Story,S3: Advanced curation tools,Iteration 8,E24,"type/story area/exhibitions","33|23",E4,curation interface,Visual exhibition builder,1

Epic,E25: Technical Infrastructure & API,Iteration 9,E25,"type/epic area/api area/offline phase/3 priority/P1","01|11",E1|E19,src/api/*|src/lib/offline/*,API and offline access implemented,13
Story,S1: Public API for external integrations,Iteration 9,E25,"type/story area/api","01",E1,API implementation,REST/GraphQL API with docs,5
Story,S2: Offline access and sync,Iteration 9,E25,"type/story area/offline","01",E1,offline architecture,Offline-first for remote communities,5
Story,S3: Security and scalability,Iteration 9,E25,"type/story area/api","01|11",E19,security measures,Security audit and scaling architecture,3

Epic,E26: Moderation & Community Management,Iteration 6,E26,"type/epic area/moderation phase/3 priority/P0","56|36|68",E10|E20,src/components/moderation/*,Moderation tools and community governance,5
Story,S1: Content moderation tools,Iteration 6,E26,"type/story area/moderation","56",E20,moderation dashboard,Reporting and review system,3
Story,S2: Community governance,Iteration 6,E26,"type/story area/moderation","36|68",E10,governance policies,Guidelines and verification system,2
```

## How to use this file

- Review and tweak iterations/estimates/labels.
- Copy the CSV block into your GitHub Project (Table view) to create items quickly. Map columns to fields. Create custom fields for Iteration, Epic, NIPs if desired.
- When approved, we can script issue creation and link them to the Project.

---

## References

- Source plan: reference/NIP-list.md (implementation order and NIP mappings)
- Requirements integration: reference/user-flows.md "Typical Requirements for a Cultural Bridge Platform" (comprehensive feature coverage across 8 requirement categories systematically integrated into epics E20-E26)
- UI types: src/types/content.ts
- Pages: `src/app/*` and `src/components/pages/*`
