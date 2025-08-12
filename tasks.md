# Culture Bridge – Tasks Tracker

Updated: 2025-08-12

This document tracks actionable items with statuses and percent complete, plus a summary at the top. Update the status column below; the table here reflects totals and overall progress.

## Summary

| Scope           | Total | Done | In Progress | Blocked | Not Started | % Complete |
|-----------------|:-----:|:----:|:-----------:|:-------:|:-----------:|:----------:|
| High priority   |  12   |  12  |      0      |    0    |      0      |   100%     |
| Medium priority |   3   |   3  |      0      |    0    |      0      |   100%     |
| Nice-to-haves   |   3   |   2  |      0      |    0    |      1      |   66.7%    |
| Overall         |  18   |  17  |      0      |    0    |      1      |   94.4%    |

Legend: Status ∈ {Not Started, In Progress, Blocked, Done}. % is per-task completion (0/25/50/75/100 typically), and the summary % Complete is (Done/Total).

---

## High priority (safe, low effort)

| Task | Status | % | Owner | Notes |
|------|--------|---|:-----:|-------|
| Add stub page: `/privacy` | Done | 100% |  |  |
| Add stub page: `/terms` | Done | 100% |  |  |
| Add stub page: `/contact` | Done | 100% |  |  |
| Add dynamic route stub: `/downloads/[id]` | Done | 100% |  |  |
| Add dynamic route stub: `/explore/[id]` | Done | 100% |  |  |
| Add dynamic route stub: `/community/members/[id]` | Done | 100% |  |  |
| Add dynamic route stub: `/community/events/[id]` | Done | 100% |  |  |
| Add stub page: `/community/join` | Done | 100% |  |  |
| Add stub page: `/community/about` | Done | 100% |  |  |
| Add stub page: `/downloads/contribute` | Done | 100% |  |  |
| Update tsconfig: target "ES2020"; lib ["DOM","DOM.Iterable","ES2022"] | Done | 100% |  | Aligned with Next 15 |
| Align ESLint/TS versions (pin TS ~5.5.x OR upgrade @typescript-eslint for TS 5.8) | Done | 100% |  | Pinned TypeScript to ~5.5.4 |

---

## Medium priority

| Task | Status | % | Owner | Notes |
|------|--------|---|:-----:|-------|
| Move Explore inline data to `src/data/explore.ts` with matching types | Done | 100% |  | Standardize data source |
| Add per-page metadata for Home (server wrapper with client content) | Done | 100% |  | Implemented in `app/page.tsx` + `app/home-content.tsx` |
| Add per-page metadata for About, Explore, Downloads, Community, etc. | Done | 100% |  | Verified all pages export metadata/generateMetadata |
| Self-host fonts via `next/font` (replace `@import`) | Done | 100% |  | next/font wired; Tailwind uses CSS vars |

---

## Nice-to-haves

| Task | Status | % | Owner | Notes |
|------|--------|---|:-----:|-------|
| Add CI (GitHub Actions) for typecheck/lint/build | Done | 100% |  | .github/workflows/ci.yml added |
| Add `blurDataURL` placeholders to common hero/cover images | Done | 100% |  | Applied across key pages/components |
| Tighten next/image config with `remotePatterns` if adding new hosts | Not Started | 0% |  | Future-proof |

---

## How to update

- Change the Status and % columns as work progresses.
- Recalculate the Summary row counts and % Complete (Done/Total).
- Keep brief Notes (links to PRs, blockers, or scope).
