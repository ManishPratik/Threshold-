# ADR 0003 — Offline-first, single-user, single-device V1

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Personal OS is a daily-driver personal surface. Reliance on network for core actions (recording a promise kept/broken, viewing today's routine) would break the primary user promise. There is no authentication, no backend, and no cloud sync in V1.

## Decision

- **All feature flows must function with zero network.** Boot loads the shell from precache; feature reads/writes go to IndexedDB directly.
- **No network calls exist in V1.** Any future telemetry/analytics is opt-in and out of the primary flow.
- **Identity is device-bound.** Losing the device = losing the data. Recovery is only possible if the user has exported a backup (Import/Export is designed-in but implementation is deferred).
- **Every persisted record carries a stable UUID (v7).** This is a forward-compatibility choice: if V2 ever adds cloud sync, retrofitting stable ids would be painful; adding them now costs nothing.
- **Time-based logic runs on device clock.** Streaks, day rollovers, and Self-Trust decay all read `Date.now()` (via `dayBoundary.ts`). Clock rollback detection is deferred — Personal OS trusts the user not to game their own scoreboard.

## Consequences

- The service worker (see ADR 0005) precaches the app shell and all Vite-emitted assets so first paint works offline after first load.
- IndexedDB is the source of truth. There is no server-side reconciliation to fall back on.
- Second-device policy is undefined for V1 — opening the PWA on a second device produces an independent instance. Merge-on-import is deferred to Backup & Restore.
- iOS Safari evicts IndexedDB from non-installed PWAs after ~7 days of inactivity — the app must prompt for home-screen install for reliable persistence (UI deferred).

## Alternatives considered

- **Online-first with offline fallback**: rejected — inverts the reliability model the product depends on.
- **Cloud-sync in V1 (Firestore/Supabase)**: rejected — adds auth, cost, and a schema mismatch layer for a solo-user MVP.
