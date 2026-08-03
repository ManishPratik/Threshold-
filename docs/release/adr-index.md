# v1.1.0-rc1 ADR Index

*Baseline snapshot for v1.1.0-rc1. Canonical list of every accepted architecture decision.*

| # | Title | Established in | File |
| - | ----- | -------------- | ---- |
| 0001 | Feature-first folder structure | Foundation | docs/adr/0001-feature-first-architecture.md |
| 0002 | IndexedDB via idb, one repository per aggregate | Foundation | docs/adr/0002-indexeddb-storage.md |
| 0003 | Offline-first, single-user, single-device V1 | Foundation | docs/adr/0003-offline-first.md |
| 0004 | No global state store in V1 | Foundation | docs/adr/0004-no-global-store.md |
| 0005 | PWA via vite-plugin-pwa in injectManifest mode | Foundation | docs/adr/0005-pwa-vite-plugin.md |
| 0006 | Bootstrap seed lives inside the repository layer | Milestone 1 (superseded by Frozen boot) | docs/adr/0006-bootstrap-repository-seed.md |
| 0007 | Mission lifecycle rules live in a domain service | Milestone 2 (historical — Mission became Promise) | docs/adr/0007-mission-domain-service.md |
| 0008 | Self-Trust measures promise integrity, not productivity | Milestone 5 | docs/adr/0008-self-trust-integrity-not-productivity.md |
| 0009 | Daily Flow Engine, Program Contract, and Today Layout Ownership | v1.1 planning | docs/adr/0009-daily-flow-engine.md |

## Conventions (from docs/adr/README.md)

- One ADR per file, numbered sequentially. Never renumber.
- Never edit an accepted ADR — supersede it with a new one that references the old.
- Each ADR contains: Context, Decision, Consequences, Alternatives considered.

## Historical notes

- ADR 0006's bootstrap-seed mechanism was superseded by the Frozen boot flow at `src/app/frozen/boot.ts`. The ADR remains accepted; the mechanism it describes is not in the live boot path.
- ADR 0007 documents the Mission-Contract service pattern. The Mission aggregate was renamed to Promise; the service pattern applies verbatim to `PromiseService`, `DeclarationService`, `RoutineService`.
- ADR 0009 governs the Daily Flow Engine, Program contract (interventions + surfaces + slot ownership), Today render tree, ack log semantics, retention window, and the three engagement tiers.

## Freeze note for v1.1.0-rc1

No ADR beyond 0009 is required for this release. Any new ADR belongs to a v1.2 or v2 planning cycle.
