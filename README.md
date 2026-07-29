# Personal OS

A calm, local-first Progressive Web App for keeping promises to yourself.

Single-user. Offline-first. Zero AI in V1. Local storage only (IndexedDB). No authentication, no backend, no cloud sync.

The primary metric is **Self-Trust** — a score derived from an append-only log of kept, broken, and deferred promises.

---

## Status

This repository contains **only the engineering foundation** (routing, design system, IndexedDB layer, PWA config, tooling). Product features — Mission Contract, Routine Engine, Recovery Mode, Knowledge Vault, Analytics, Reviews — are implemented in later milestones.

## Requirements

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Scripts

| Command                 | What it does                                     |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Start the Vite dev server                        |
| `npm run build`         | Type-check then produce a production bundle      |
| `npm run preview`       | Preview the production bundle locally            |
| `npm run typecheck`     | Type-check only, no emit                         |
| `npm run lint`          | Lint the codebase (ESLint flat config)           |
| `npm run format`        | Format the codebase with Prettier                |
| `npm run format:check`  | Check formatting without writing                 |
| `npm test`              | Run the Vitest suite once                        |
| `npm run test:watch`    | Run Vitest in watch mode                         |
| `npm run test:coverage` | Run Vitest with V8 coverage                      |

## Architecture

Feature-first source tree; import aliases are configured in both `tsconfig.app.json` and `vite.config.ts`.

```
src/
  app/                 Router, providers, root layout, error boundary
  routes/              One folder per top-level nav item (Today, Knowledge, Analytics, Settings)
  features/            Cross-route domain modules (Mission Contract, Routine Engine, Recovery Mode, Self-Trust, Reviews)
  shared/              Reusable primitives (ui/, hooks/, lib/, icons/)
  data/                Persistence — types, DB client, repositories
  design-system/       Tokens (colors, spacing, typography, radii, motion, shadows) and global styles
  pwa/                 Service worker source and registration
  test/                Test setup

docs/adr/              Architecture Decision Records
```

See `docs/adr/` for the reasoning behind each major decision:

- ADR 0001 — Feature-first folder structure
- ADR 0002 — IndexedDB via `idb`, one repository per aggregate
- ADR 0003 — Offline-first, single-user, single-device V1
- ADR 0004 — No global state store in V1
- ADR 0005 — PWA via `vite-plugin-pwa` in `injectManifest` mode

## Design system

Tokens are the single source of truth for colour, spacing, typography, radii, and motion:

- **TypeScript tokens** (`src/design-system/tokens/`) — imported by components that need values in code.
- **CSS custom properties** (`src/design-system/styles/tokens.css`) — imported into every CSS Module via `global.css`.

Never introduce raw pixel values, hex colours, or hard-coded durations in a component; extend the token layer instead.

Light theme only in V1 (`color-scheme: light` in `global.css`). Dark mode is deliberately out of scope.

Accessibility target: **WCAG AA**. Every foreground/background pair in `colors.ts` is annotated with its contrast ratio. `prefers-reduced-motion` is respected globally in `global.css`.

## Data layer

Every persisted entity extends `BaseEntity` (`id`, `createdAt`, `updatedAt`, `schemaVersion`).

Access is always via a repository — feature code never touches `idb` directly.

```ts
import { missionRepository } from '@data/repositories';

const active = await missionRepository.getActive();
```

The `PromiseEvent` store is append-only — call `append()`, never `put()` on an existing id.

Schema changes require adding a numbered migration in `src/data/db/migrations.ts` and bumping `DB_VERSION` in `schema.ts`. Shipped migrations are never edited.

## PWA & deployment

Deployed on Netlify. Configuration lives in `netlify.toml`:

- SPA rewrite (`/*` → `/index.html`).
- Long-cache hashed assets (`/assets/*`).
- Zero-cache for `sw.js` and `manifest.webmanifest` so updates ship reliably.
- Baseline security headers.

Service worker source: `src/pwa/sw.ts` (`injectManifest` mode — we own the SW code).

## Deferred / not implemented

The following are intentionally out of the foundation milestone:

- All product features: Mission Contract, Routine Engine, Recovery Mode, Knowledge Vault, Analytics UI, Reviews UI, Self-Trust UI, Backup & Restore, Settings UI.
- Real PNG icon set (currently placeholder SVGs). Generate a full icon matrix via `pwa-asset-generator` before iOS install rollout.
- In-app "update available" prompt UI (currently console-only).
- Dark mode (locked out of V1).
- Import / Export JSON flow (repository primitives exist; UI does not).
- Self-Trust formula body (function is present with a placeholder score of 0).
- Boundary-enforcement ESLint rule preventing cross-feature imports.

## Contributing

Before pushing:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```
