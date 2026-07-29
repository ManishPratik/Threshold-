# ADR 0002 — IndexedDB via `idb`, one repository per aggregate

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Personal OS must persist Mission Contracts, DayLogs, PromiseEvents, SelfTrustSnapshots, Notes, Reviews and Settings entirely on-device with no server. Data must survive years of daily use — the Knowledge Vault alone is expected to reach tens of thousands of rows. `localStorage` is ~5MB, string-only, synchronous, and blocks the main thread; it is unsuitable as the primary store.

## Decision

- Primary store: **IndexedDB**, wrapped with `idb` (~4KB gzipped, promise-based API).
- Access is mediated by a **repository per aggregate** (Mission, Routine, DayLog, PromiseEvent, SelfTrustSnapshot, Note, Review, Setting).
- All repositories extend a base `Repository<T extends BaseEntity>` that provides typed CRUD plus `putMany` / `exportAll` — the primitives required by the future JSON Import / Export flow.
- Schema is versioned in `src/data/db/schema.ts`; migrations are pure functions keyed by target version in `src/data/db/migrations.ts`. Shipped migrations are never edited.
- `PromiseEvent` is append-only. The repository exposes `append()` which rejects duplicate ids; `put()` is inherited but not used by feature code.
- Every persisted entity carries `id` (UUID v7), `createdAt`, `updatedAt`, `schemaVersion`. UUID v7 is chosen for lexicographic time-ordering so cursor traversal is chronological.

## Consequences

- Feature code never touches raw IndexedDB — always through a repository.
- Domain-specific queries live on concrete repositories (e.g. `DayLogRepository.getByDate`), keeping the query surface typed and discoverable.
- The Import / Export flow can be built later by iterating every repository's `exportAll()` and calling `putMany()` on restore — no repository changes required.
- Localstorage is reserved only for boot-critical preferences (day-start hour, theme) if future need appears; it is not used for domain data.

## Alternatives considered

- **Dexie**: richer, but ~30KB gzipped and its query DSL duplicates work the repository layer already does. Rejected in favour of the thinner primitive.
- **localStorage**: rejected — 5MB ceiling, string-only, main-thread sync.
- **OPFS**: rejected — meant for file blobs, not structured records; browser support is uneven.
- **SQLite via WASM**: rejected as overkill for a personal-scale app; the repository interface leaves this door open if data volume ever demands it.
