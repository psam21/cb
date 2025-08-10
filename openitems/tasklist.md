# Culture Bridge Codebase Task List

This document tracks actionable improvements, ordered by priority and dependency. Categories: Quick Wins, Moderate Refactors, Advanced / Future Roadmap. Each item has an ID for cross‑reference. Check off as completed.

Legend:

- [ ] open / not started
- [x] done / complete
- (Optionally add ~ later for in-progress if needed)
- 🔁 parallelizable
- ⛓ depends-on -> prerequisite IDs
- 🚩 potential risk / requires decision

## Phase Progress Overview

High-level snapshot of execution progress by phase.

| Phase                     | Scope                               | Done / Total | Percent | Progress   |
| ------------------------- | ----------------------------------- | ------------ | ------- | ---------- |
| 🟢 0 – Foundations        | Core conventions & primitives       | 4 / 4        | 100%    | ██████████ |
| � 1 – Quick Wins          | Fast UX/Perf/A11y improvements      | 15 / 15      | 100%    | ██████████ |
| 🟦 2 – Moderate Refactors | Architecture & component extraction | 0 / 13       | 0%      | ·········· |
| 🟣 3 – Advanced / Future  | Nostr, auth, i18n, SEO deepening    | 0 / 11       | 0%      | ·········· |

Legend: █ = 10% block, ▎ = partial (~3%), · = remaining. Color tags: 🟢 complete, 🟡 in flight, 🟦 upcoming refactors, 🟣 future roadmap.

Narrative:

1. Foundations complete: linting, types, data layer pattern (home + about), and core primitives in place—technical debt reduction baseline achieved.
2. Quick Wins momentum: component reuse, `clsx`, StarRating consolidation, server component conversions (QW4), full per‑page metadata (QW6), skip link (QW8), large file lint baseline (QW12), smoke test harness (QW15), and full image optimization migration to `next/image` (QW5) completed.
3. Refactors & Advanced phases intentionally untouched until more quick wins reduce surface area of change—keeps momentum while minimizing rework risk.

Phase 1 complete: image optimization, semantic links, and comprehensive alt text audit finished. Optional polish (e.g., re-tighten large file threshold or custom rule script—extend QW12) will occur after initial moderate refactors.

### 1.1 Post-Quick Wins Hygiene (Completed)

Additional cleanup passes performed after Quick Wins closure to establish a quiet baseline before refactors:

| Status | ID   | Task / Hygiene Pass                                | Notes                                                                          | Depends |
| ------ | ---- | --------------------------------------------------- | ------------------------------------------------------------------------------ | ------- |
| [x]    | HYG1 | Remove unused imports & dead state                  | Pruned across header, home, language, community, elder voices, etc.            | F1      |
| [x]    | HYG2 | Remove explicit `any` usages in icons/handlers      | Strengthened type safety                                                       | F2      |
| [x]    | HYG3 | Associate all form labels / radios correctly       | Contribute form fieldset + ids/htmlFor                                        | F1      |
| [x]    | HYG4 | Replace non-semantic interactive elements          | Converted interactive div to button on Nostr page                              | F1      |
| [x]    | HYG5 | Escape remaining unescaped quotes/apostrophes      | Cleared react/no-unescaped-entities warnings                                   | F1      |
| [x]    | HYG6 | Temporarily raise max-lines threshold to 600       | Prevent noise until MR1–MR2 slimming; will drop to 250 (MR11) post-refactor    | QW12    |
| [x]    | HYG7 | Global Prettier normalization pass                 | Ensures stable diffs going forward                                             | QW14    |

## 0. Foundations & Conventions

| Status | ID  | Task                                          | Notes                                                 | Depends |
| ------ | --- | --------------------------------------------- | ----------------------------------------------------- | ------- |
| [x]    | F1  | Establish coding standards & lint/a11y config | Add ESLint a11y + Prettier, baseline before refactors |         |
| [x]    | F2  | Introduce shared TypeScript interfaces file   | Prevents ad-hoc types scattered later                 | F1      |
| [x]    | F3  | Create data directory for mock datasets       | Enables page slimming & reuse (home + about migrated) | F2      |
| [x]    | F4  | Add UI component primitives folder            | SectionHeading & StatBlock added (grounds QW10/QW11)  | F2      |

## 1. Quick Wins (High Impact / Low Effort)

| Status | ID   | Task                                                                           | Notes                                                                                   | Depends |
| ------ | ---- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------- |
| [x]    | QW1  | Remove duplicate carousel interval in home page                                | Bug fix (double interval).                                                              |         |
| [x]    | QW2  | Extract StarRating component                                                   | Replaces repeated star loops.                                                           | F2,F4   |
| [x]    | QW3  | Replace inline rating stars usages with component                              | After QW2                                                                               | QW2     |
| [x]    | QW4  | Convert static pages to Server Components (remove 'use client') where no state | Initial batch converted (About, Community, Explore, Downloads, Elder Voices).           | F2      |
| [x]    | QW5  | Introduce `next/image` for all images                                          | All legacy image tags replaced with Next.js Image component; domains covered in config. | F1      |
| [x]    | QW6  | Add per-page `metadata` export (title/description)                             | All primary pages covered.                                                              | F1      |
| [x]    | QW7  | Improve alt text (contextual, non-duplicative)                                 | Completed: descriptive + contextual alt text; decorative imagery avoided                | F1      |
| [x]    | QW8  | Add skip-to-content anchor in RootLayout                                       | Accessibility                                                                           | F1      |
| [x]    | QW9  | Wrap navigational buttons with `<Link>` where appropriate                      | Completed across remaining pages (exhibitions, exchange, get-involved, nostr, language) | F1      |
| [x]    | QW10 | Create `SectionHeading` component (title + subtitle)                           | Reduces repeated markup                                                                 | F2,F4   |
| [x]    | QW11 | Create `StatBlock` reusable component                                          | For stats grids across pages                                                            | F2,F4   |
| [x]    | QW12 | Add eslint rule to detect large files > 300 lines (custom)                     | Baseline max-lines (350) added (now 600 temp); custom slim-enforce script later (MR11). | F1      |
| [x]    | QW13 | Introduce `clsx` dependency for conditional class handling                     | Dependency added & used in primitives                                                   | F1      |
| [x]    | QW14 | Add Prettier config + formatting script                                        | Consistency                                                                             | F1      |
| [x]    | QW15 | Provide simple smoke test (Jest/RTL) for rendering homepage                    | Baseline test harness                                                                   | F1      |

## 2. Moderate Refactors

| Status | ID   | Task                                                                      | Notes                                 | Depends       |
| ------ | ---- | ------------------------------------------------------------------------- | ------------------------------------- | ------------- |
| [ ]    | MR1  | Move mock data from pages into `src/data/*` modules                       | Start with cultures, stories.         | F3            |
| [ ]    | MR2  | Refactor pages to import data + map with extracted components             | Slim pages                            | MR1,QW10,QW11 |
| [ ]    | MR3  | Build `Button` component variants (primary, outline, accent, etc.)        | Replace utility classes               | F4            |
| [ ]    | MR4  | Build `Card` wrapper component                                            | Centralize card styles                | F4            |
| [ ]    | MR5  | Replace raw `<img>` with `<Image>` systematically                         | Continue after QW5 pilot              | QW5           |
| [ ]    | MR6  | Add `<StarRating>` aria enhancements & screen-reader text                 | Accessibility upgrade                 | QW2           |
| [ ]    | MR7  | Introduce route-level dynamic OG images (optional later)                  | Marketing                             | QW6           |
| [ ]    | MR8  | Migrate repeated hero sections to `Hero` component                        | Standardize layout & gradients        | F4            |
| [ ]    | MR9  | Extract filter chip / badge components                                    | Reuse across explore, downloads, etc. | F4            |
| [ ]    | MR10 | Convert most pages back to Server Components with client islands          | Better perf split                     | QW4,MR2       |
| [ ]    | MR11 | Implement lint rule / script to report any page > 250 lines post-refactor | Enforce slim pages                    | QW12,MR2      |
| [ ]    | MR12 | Add structured data (JSON-LD) for cultural entities                       | SEO                                   | QW6,MR2       |
| [ ]    | MR13 | Centralize animation variants in a motion config                          | DRY framer-motion code                | F4            |

## 3. Advanced / Future Roadmap

| Status | ID    | Task                                                                              | Notes                               | Depends     |
| ------ | ----- | --------------------------------------------------------------------------------- | ----------------------------------- | ----------- |
| [ ]    | ADV1  | Scaffold Nostr integration library (`lib/nostr.ts`)                               | Add types & placeholder publish fn  | F2          |
| [ ]    | ADV2  | Add `nostr-tools` dependency and key management helpers                           | After scaffold                      | ADV1        |
| [ ]    | ADV3  | Replace Contribute mock submit with signed Nostr event publish                    | Real data path                      | ADV2,QW4    |
| [ ]    | ADV4  | Add persistence layer (e.g., simple API route + DB or edge KV) for non-Nostr data | Consider Supabase / PlanetScale     | F1          |
| [ ]    | ADV5  | Introduce authentication (passkeys or NIP-07 extension)                           | Security for contributions          | ADV2,ADV3   |
| [ ]    | ADV6  | Internationalization scaffold (app/[locale])                                      | Later once content components ready | MR2         |
| [ ]    | ADV7  | Implement sitemap & RSS feeds                                                     | SEO & discovery                     | QW6,MR2     |
| [ ]    | ADV8  | Add Playwright e2e tests (core user journeys)                                     | Build on initial Jest harness       | QW15,MR2    |
| [ ]    | ADV9  | Implement image optimization strategy (remote patterns, blur placeholders)        | After next/image adoption           | QW5,MR5     |
| [ ]    | ADV10 | Add analytics event instrumentation plan                                          | Product insights                    | F1          |
| [ ]    | ADV11 | Performance budget & Lighthouse CI integration                                    | Ongoing quality gate                | QW5,QW4,MR2 |

## 4. Sequencing Justification

1. Foundations ensure consistent coding, typing, and structure; doing them early reduces rework.
2. Quick Wins deliver immediate UX, accessibility, performance, and maintainability improvements with minimal risk.
3. Moderate refactors leverage established primitives to shrink pages and improve architecture.
4. Advanced roadmap builds real functionality (Nostr, auth, i18n) atop a clean UI/component + data separation layer.

## 5. Immediate Proposed Sprint (Suggestion)

Focus: F1–F4, QW1, QW2, QW4, QW5 (pilot on 1-2 pages), QW6, QW14, QW15.
Outcome: Clean baseline, test harness, minor performance & a11y gains, start of component library.

## 6. Dependency Graph Highlights

- Data & component extraction (MR1–MR4) depend on foundational typing & structure (F2,F4).
- Nostr work (ADV1+) waits until typing + some refactors to avoid churn.
- SEO structured data (MR12) after per-page metadata & page slimming (QW6, MR2).

## 7. Open Questions (Need Decision Before Advancing Some Items)

1. Target database / storage solution for non-Nostr assets? (Affects ADV4).
2. Preferred auth model (NIP-07 browser extension vs custom key mgmt)? (Affects ADV5).
3. Image sources expansion—add all remote domains now or incrementally? (Affects QW5/MR5).
4. Internationalization library preference (`next-intl` vs native routing)? (Affects ADV6).
5. Do we want dark mode theming early (affects design tokens) or later?

## 8. Tracking Format

Update this file via PRs; reference IDs in commit messages, e.g., `feat: add StarRating component (QW2)`.

---

(Feel free to edit ordering or scope; we can then proceed implementing the initial sprint items.)
