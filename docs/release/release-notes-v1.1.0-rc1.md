# Personal OS — Release Notes v1.1.0-rc1

*Release Candidate 1. Baseline snapshot of the shipped product.*

## Overview

Personal OS is a calm, local-first PWA for keeping promises to yourself. Single-user. Offline-first. Zero AI. Local storage only (IndexedDB). No authentication, no backend, no cloud sync.

The primary metric is **Self-Trust** — a score derived from the append-only log of kept and broken declarations across a Promise arc.

## Major features (this release)

- **Today screen** — Promise anchor + Self-Trust line + Daily Flow Summary + Intervention Queue + program ambient widgets + routine (anchor-grouped) + Current-Focus card + Reflection invitation.
- **Chain** — per-promise day-arc with kept / broken / awaiting glyphs; taps navigate to Reflection variants.
- **History** — every past + current Promise with attempt number, title, dates, outcome (kept / broken / active). Renders safely for legacy or malformed rows.
- **Settings** — About, Life Programs toggle, Daily Flow Analytics link, Erase Data (transactional).
- **Daily Flow Analytics** — 30-day timeline of ack / dismiss counts and rolling percentages, retention-bounded.
- **Reflection** — question / kept / broken / read-only variants. Backfill queue capped at 7 modals per session.
- **Recovery** — post-broken interstitial that reloads on terminated arcs.
- **Completion** — end-of-arc celebration surface on the final kept day.
- **Craving SOS overlay** — 3-minute physiological-sigh timer + trigger tagging.
- **Peak-crossed / hurdle-crossed celebrations** — one-shot per milestone.
- **PWA install + update flow** — prompt-based service worker updates.

## New architecture (v1.1)

- **Daily Flow Engine** (`src/features/daily-flow-engine/`) — engine-owned scheduler + queue over ADR 0009 §3–§8. Components:
  - `InterventionQueue` — engine-owned list rendered on Today; caps p1 = 3 / p2 = 3 / above-fold = 6 per phase.
  - `DailyFlowSummary` — one-line supportive engagement summary between Self-Trust and the queue.
  - `AckLog` — reused legacy `settings` store; one row per calendar day (`dailyFlow-ack-YYYY-MM-DD`) with `acked[]` + `dismissed[]`.
  - `DailyAnalytics` — reads the last 30 days of ack rows, aggregates totals + per-day rates.
  - `SurfaceErrorBoundary` — engine-owned silent error boundary that drops a failing surface to `null` without affecting siblings.
  - `QueueVersion` — program-agnostic revision counter + subscribe/notify pattern for realtime queue re-render.
  - `resolvePhase` — deterministic phase (`morning | midday | evening | night`) from ISO input.
- **Program contract** (`src/features/programs/types.ts`) — two-track surface: `interventions[]` data descriptors + `surfaces[]` engine-slotted React components (`hero | ambient | overlay`). Legacy `todayWidget` alias supported.
- **Program registry** (`src/features/programs/registry.ts`) — static Map + `getProgramSurfaces` alias helper.
- **Anchor system** (`src/features/routine-engine/anchors.ts`) — four fixed anchors (`morning | midday | evening | night`) with optional `custom:${slug}` extension. `getBlockAnchor` defaults legacy blocks to morning.
- **Boot flow** (`src/app/frozen/boot.ts`) — fires `purgeOlderThan30Days` on the ack log at boot; loads active promise / declaration / completions / routine in parallel.

## Kernel components (retained)

- **Promise** — `PromiseService.createPromise` (single-active invariant + attempt number), `breakPromise`, `completePromise`, `getActivePromise`. Multi-store writes run inside one readwrite transaction.
- **Routine** — one routine per Promise, anchor-grouped blocks, `replaceBlocks` now cross-store transactional and cascades orphan `blockCompletions` for removed block ids.
- **Reflection** — one Declaration per (promiseId, date); idempotent on same-verdict re-tap; refuses to overwrite opposite verdict.
- **Self-Trust** — pure derivation from PromiseRecord + Declarations + BlockCompletions + Routine; per ADR 0008 "integrity, not productivity".

## Life Programs

- **Smoking Cessation** — Threshold-parity behavioural program:
  - Ambient widget: nicotine chamber, peak-withdrawal countdown, hurdles chain, health milestones, editable pledge / lapse / mantra slots, craving log, SOS overlay, celebrations.
  - Interventions: 11 records covering morning-full (Days 1-7), morning-short (Day 8+), midday, evening, night — with high / medium / low engagement-tier wording variants for morning-full, morning-short, and evening.
  - Full-relapse reset is transactional over the 4 smoking-scoped `settings` rows.
- **Life Program contract** proven end-to-end: manifest → surfaces → interventions → runtime cache preload → queue-version subscription.

## Daily Flow

- **Interventions** — data-only descriptors keyed on `phase`, `priority`, `ackKind`, `shouldFire(ctx)`.
- **Ack log** — one row per day; retention 30 days; boot-time purge; per-key uniqueness via encoded date.
- **Daily Flow Summary** — one supportive sentence between Self-Trust and the queue; hidden when no program is enabled or no data.
- **Analytics** — 30-day timeline available at `/settings/daily-flow`.
- **Tier adaptation** — `readAggregateAckRate` fills `InterventionContext.ackRate`; programs pick between high (≥0.8) / medium (≥0.4) / low (<0.4) wording without changing the number of cards rendered.

## Reliability improvements shipping in this release

- `fullRelapseReset` at `src/programs/smoking/state.ts:284-292` is transactional over `settings`.
- `RoutineService.replaceBlocks` at `src/features/frozen/routine/RoutineService.ts:84-125` cross-store transactional; cascades orphan block completions.
- Reflection backfill at `src/app/frozen/adapters.tsx:22-77` capped at 7 modals per session.
- History rendering at `src/routes/frozen/history/FrozenHistoryPage.tsx:117, 138, 148-183` is defensive against missing / null / invalid dates.

## PWA support

- Vite PWA in `injectManifest` mode; own service worker source at `src/pwa/sw.ts`.
- Precached shell + hashed assets; `cleanupOutdatedCaches` on activation.
- Prompt-based update flow via `virtual:pwa-register`; user clicks "Update" to activate the waiting worker.
- Manifest: standalone display, portrait, 192 + 512 + maskable 512 SVG icons.
- Netlify config: SPA rewrite, long-cache hashed assets, zero-cache for `sw.js` + `manifest.webmanifest`, baseline security headers.

## Offline support

- IndexedDB via `idb`; all reads / writes are local.
- No network dependency at boot or during use.
- SW navigation fallback returns `/index.html` for unknown paths (hash-routed).
- Cross-origin `StaleWhileRevalidate` runtime cache exists for future asset needs; empty in this release.

## Breaking changes vs v1.0.0 baseline

- **Onboarding path is unchanged in v1.1** — new users still land on Promise creation.
- **DB_VERSION unchanged (2)** — no schema migration required for existing installs.
- **Old v1 stores (`missions`, `dayLogs`, `promiseEvents`, `snapshots`, `reviews`, `routines`, `notes`)** are created empty by the v1 migration and remain unused; consumers are the Frozen v2 stores.

## Known limitations (deferred)

- Non-Promise onboarding (Routine-only, Program-only) not surfaced.
- Ambient program widget hidden when no active Promise.
- iOS PNG icon matrix not generated (SVG icons ship today).
- Dark mode not implemented.
- Import / Export JSON not implemented.

## Verification at release

- Typecheck: exit 0.
- Lint: 0 errors, 4 pre-existing warnings.
- Tests: 335 pass across 23 files.
- Build: exit 0. Main JS ~153 KiB. PWA precache 14 entries at ~525 KiB.
- Live: end-to-end verified across Today / Chain / History / Settings / Daily Flow Analytics; SW install + offline confirmed via `[pwa] App is ready to work offline.`

## Release tag

- Suggested tag: `v1.1.0-rc1`.
- Prerequisites: deployment checklist at `docs/release/deployment-checklist.md`.
