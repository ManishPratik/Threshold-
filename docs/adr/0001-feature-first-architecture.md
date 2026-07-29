# ADR 0001 — Feature-first folder structure

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Personal OS has a small, fixed set of top-level surfaces (Today, Knowledge, Analytics, Settings) and a slightly larger set of cross-cutting domain modules (Mission Contract, Routine Engine, Recovery Mode, Self-Trust, Reviews). A type-first layout (`components/`, `hooks/`, `utils/` at the src root) does not scale beyond a few dozen files: a change to one feature scatters across many folders, and dead code from removed features becomes hard to detect.

## Decision

The `src/` tree is organised by concern rather than by file type:

- `app/` — root providers, router, layout, error boundary.
- `routes/` — one folder per top-level nav item, each exporting the page component.
- `features/` — cross-route domain modules (each self-contained: components, hooks, logic).
- `shared/` — reusable primitives, hooks, and utilities used by two or more features.
- `data/` — persistence: types, DB client, repositories.
- `design-system/` — tokens and global styles.
- `pwa/` — service worker source and registration.
- `test/` — test setup and factories.

Import paths use `@`-prefixed aliases (`@app`, `@routes`, `@features`, `@shared`, `@data`, `@ds`) resolved by both Vite and TypeScript.

## Consequences

- New features live in one folder. Deleting a feature = deleting one folder.
- Cross-feature imports go through `@shared` or `@data`, making coupling visible.
- ESLint boundary rules can be added later to prevent `@features/A` importing from `@features/B` directly (must go through `@shared`).

## Alternatives considered

- **Type-first**: rejected — does not scale, hurts feature-level cohesion.
- **Monorepo with per-feature packages**: rejected as overkill for a single PWA (see ADR 0004's rationale on complexity floors).
