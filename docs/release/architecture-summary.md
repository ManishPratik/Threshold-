# Architecture Summary — v1.1.0

*Baseline snapshot.*

## Stack

- React 19 + TypeScript 6 + Vite 7
- PWA via vite-plugin-pwa (injectManifest — we own src/pwa/sw.ts)
- IndexedDB via idb (through a Repository base class)
- CSS Modules + hand-authored design tokens
- Testing: Vitest + happy-dom + fake-indexeddb + Testing Library

## Source layout

```
src/
  app/                 Router, providers, root layout, error boundary
  routes/              One folder per top-level nav item (today, knowledge, analytics, settings)
  features/            Bounded contexts:
    mission-contract   Mission lifecycle + inline editor
    routine-engine     Routine builder + focus FSM + useRoutineToday hook
    self-trust         Strategy pattern + snapshot projection
    recovery-mode      Auto-detect missed days + emit deferred events
    knowledge-vault    Notes CRUD + soft delete + undo
    reviews            Daily / weekly / monthly reflections
    analytics          Read-only text-first dashboard
    settings           Trash, Backup & Restore, About, Danger zone
  shared/
    ui/                Design system primitives (Button, Card, Surface, Typography, Icon, ProgressBar, TextField, TextArea)
    lib/               Pure utilities (date, dayBoundary, id, time)
  data/
    db/                IndexedDB client, schema, migrations, seed, stats, reset, backup
    repositories/      One repository per aggregate
    types/             Domain entity types (BaseEntity + 8 aggregates)
  design-system/
    tokens/            colors, spacing, typography, radii, motion, shadows
    styles/            reset, tokens (CSS custom properties), global
  pwa/                 Service worker + update-prompt hook + component
  test/                Vitest setup (jest-dom + fake-indexeddb polyfill)
```

## Layering

```
Route  →  Feature service (domain rules)  →  Repository (single-store CRUD)  →  idb / IndexedDB
      ↘   Feature UI component (derived state consumer)  ↗
```

- **UI never touches IndexedDB directly.** All reads/writes go through a domain service or a data-layer utility.
- **Repositories are single-aggregate CRUD.** No business rules.
- **Domain services are the write path for lifecycle events** (activation, save, delete, restore) — validate inputs, enforce invariants, orchestrate across repositories.
- **Feature-boundary ESLint rule** prevents `@features/A/subpath` imports from any file under `src/features/**` or `src/routes/**`. Bare-index composition (`@features/self-trust`) remains allowed.

## Cross-cutting patterns

- **Factory + default-singleton services** — `createXService(deps)` + `xService` export. Deps take repositories + `TimeProvider` (recovery service today; other services inject-on-demand as tests require).
- **Structured field-keyed validation errors** — `{ field, message }` returned from `validate*` functions; used inline in forms.
- **Named domain error class per service** — `MissionContractError`, `RoutineServiceError`, `KnowledgeServiceError`, `ReviewsServiceError`.
- **Two-step confirmation for destructive actions** — Delete Forever (Trash), Reset all data (Danger zone), Restore from backup. No modal; inline second-step reveal.
- **Mode-swap navigation** at the route level for editor flows (Mission Create, Routine Builder, Note Editor, Review Editor). No sub-routes for editors.
- **Bootstrap seed** inserts example data on first launch (ADR 0006). Purged on Mission activation (ADR 0007). Guarded by mission-count so import restores do not re-add bootstrap.
- **Self-Trust snapshots are projections** derived from PromiseEvents (ADR-independent invariant). Rebuild is a single call.

## Key invariants

- Every persisted entity extends `BaseEntity`: `id` (UUID v7), `createdAt`, `updatedAt`, `schemaVersion`.
- `PromiseEvent` is append-only (enforced in `PromiseEventRepository.append`).
- One active Mission at a time (enforced in `activateNewMission`).
- One active Routine per Mission (enforced by `RoutineRepository.replaceAllForMission`).
- One Review per (kind, periodStart) pair.
- Bootstrap records use fixed `bootstrap-` id prefix and are purgeable in one call.
- Day boundary = 04:00 local (fixed in V1; documented as configurable in a future milestone).
- Self-Trust score floor = 0.

## PWA + deployment

- Deployed on Netlify. Config lives in netlify.toml.
- SPA rewrite `/*` → `/index.html`; long-cache for `/assets/*`; zero-cache for the SW file + manifest so updates ship.
- Baseline security headers set (X-Frame-Options DENY, nosniff, strict Referrer, locked Permissions-Policy).
- Update prompt is a sticky bar; explicit user action to reload; no silent reloads.

## Counts at v1.1.0

- Feature folders: `frozen`, `routine-engine`, `self-trust`, `programs`, `daily-flow-engine`.
- Concrete Life Programs: `smoking`.
- Domain services: `PromiseService`, `DeclarationService`, `RoutineService`, `BlockCompletionService`, `NoteService`.
- Repositories: `PromiseRepository`, `DeclarationRepository`, `RoutineRepository`, `BlockCompletionRepository`, `NoteRepository`, `AppStateRepository`.
- Numbered ADRs: 9 (0001–0009).
- Tests: 335 across 23 test files (unit + integration).
- Production bundle: 14 precache entries at ~525 KiB. Main JS ~153 KiB.
- Zero TODO / FIXME / XXX markers in `src/`.
- IDB schema: `DB_VERSION = 2` (v1 legacy baseline + v2 frozen stores; no v3 migration in this release).
