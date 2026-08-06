# Personal OS

A calm, local-first Progressive Web App for keeping promises to yourself.

Single-user. Offline-first. Zero AI in V1. Local storage only (IndexedDB). No authentication, no backend, no cloud sync.

The primary metric is **Self-Trust** — a score derived from an append-only log of kept, broken, and deferred promises.

---

## Status

v1.1.0.

Shipped surfaces: Today, Chain, History, Settings, Daily Flow Analytics. Shipped kernel: Promise, Routine (with anchor grouping), Reflection, Self-Trust. Shipped runtime: Daily Flow Engine (Intervention Queue, Ack Log, Daily Flow Summary, tier-adaptive interventions, per-day retention purge). Shipped Life Program: Smoking Cessation.

See `docs/release/release-notes-v1.1.0.md` for a feature-by-feature manifest.

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
- ADR 0006 — Bootstrap seed lives inside the repository layer (superseded by the Frozen boot flow)
- ADR 0007 — Mission lifecycle rules live in a domain service (historical; Mission was renamed to Promise)
- ADR 0008 — Self-Trust measures promise integrity, not productivity
- ADR 0009 — Daily Flow Engine, Program Contract, and Today Layout Ownership

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

Schema changes require adding a numbered migration in `src/data/db/migrations.ts` and bumping `DB_VERSION` in `schema.ts`. Shipped migrations are never edited.

### Live stores (as of this release)

- `appState` — singleton pointer to the active Promise + enabled program ids.
- `promises` — Promise records with unique `by-attemptNumber` / `by-startDate` / `by-activatedAt` / `by-brokenAt` indexes.
- `declarations` — one row per (promiseId, date) — Reflection verdicts.
- `blockCompletions` — one row per (promiseId, date, blockId) — routine block completions.
- `frozenRoutines` — one row per Promise (unique `by-promiseId`).
- `frozenNotes` — notes per Promise.
- `settings` — reused v1 store; hosts Smoking-scoped rows (`smoking-quit-time`, `smoking-craving-log`, `smoking-peak-crossed-acked`, `smoking-hurdles-acked`, editable-slot rows) and Daily Flow ack-log rows (`dailyFlow-ack-YYYY-MM-DD`).

## PWA & deployment

Deployed on Netlify. Configuration lives in `netlify.toml`:

- SPA rewrite (`/*` → `/index.html`).
- Long-cache hashed assets (`/assets/*`).
- Zero-cache for `sw.js` and `manifest.webmanifest` so updates ship reliably.
- Baseline security headers.

Service worker source: `src/pwa/sw.ts` (`injectManifest` mode — we own the SW code).

## Deferred / not implemented

- Onboarding chooser for non-Promise first-run experiences (Routine-only, Program-only). Present onboarding routes every new user through Promise creation.
- Ambient program widget rendering when no active Promise is present.
- Real PNG icon matrix (SVG icons ship today; `pwa-asset-generator` sweep deferred for iOS install polish).
- Dark mode.
- Import / Export JSON flow.

## Contributing

Before pushing:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```
