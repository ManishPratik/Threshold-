# ADR 0006 — Bootstrap seed lives inside the repository layer

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

The Today experience only becomes meaningful when there is an active Mission, an active Routine, and today's DayLog to render against. On a first-ever visit the IndexedDB stores are empty, so the primary product objective — "the user opens the app and immediately knows what to do right now" — cannot be met without seeding.

Milestone 1 does not ship Mission creation, Routine editing, or an onboarding flow. Those are later milestones. Something must fill the gap in a way that:

- keeps UI code unaware that scaffolding data exists,
- runs exactly once (no re-seed after user data exists),
- is trivially removable when the creation flows land,
- does not become a hidden second source of truth outside the DB.

## Decision

Seeding lives entirely inside the data layer, in `src/data/db/seed.ts`, exposing one function `seedIfEmpty(db)`.

- It is called once from the promise chain inside `getDb()` in `src/data/db/client.ts`, immediately after `openDB()` resolves. Because `dbPromise` is a memoised singleton, the seed runs at most once per app session.
- It is idempotent: it looks up the active Mission via the `by-status` index and returns immediately if one is present. This guards against re-seeding on subsequent boots (the previous session's seeded data remains).
- The seeded records use fixed ids prefixed `bootstrap-` (e.g. `bootstrap-mission-01`) so they can be identified and purged programmatically.
- UI code never imports from `seed.ts` and has no branch on "was seeded". It reads from repositories exactly like a Mission-creation flow would produce.

## Consequences

- The UI is written against real repository data on day one — no mock adapter, no fixture context provider.
- Removing the seed later is a two-line change: delete `src/data/db/seed.ts`, delete the one call site in `getDb()`. Nothing in the UI changes.
- Bootstrap records survive across sessions until the user manually clears the DB (via browser devtools or, later, Settings → Reset). This is deliberate — users are not shown a fresh empty state every time they refresh.
- If a real Mission-creation flow lands later, seed remains idempotent: it only runs if no active Mission exists. Users who created their own Mission will never see the seed.

## Alternatives considered

- **Hardcoded UI fallbacks (`mission ?? DEFAULT_MISSION`)**: rejected. Creates two sources of truth; the fallback state is invisible in devtools; harder to remove.
- **Migration-time seeding (in `migrations.ts` v1)**: rejected. Migrations run once per schema version; if the user's schema is already v1 (e.g. re-installed the app), no seed runs and Today is empty again.
- **A dev-only seed script (`npm run seed`)**: rejected. End users on a fresh visit would see an empty Today — violates the product objective.
- **Onboarding wizard in Milestone 1**: rejected. Explicitly out of scope; Mission creation is deferred.
