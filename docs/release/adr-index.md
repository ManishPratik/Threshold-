# V1 ADR Index

*Frozen at v1.0.0. Canonical list of every accepted architecture decision.*

| # | Title | Established in | File |
| - | ----- | -------------- | ---- |
| 0001 | Feature-first folder structure | Foundation | docs/adr/0001-feature-first-architecture.md |
| 0002 | IndexedDB via idb, one repository per aggregate | Foundation | docs/adr/0002-indexeddb-storage.md |
| 0003 | Offline-first, single-user, single-device V1 | Foundation | docs/adr/0003-offline-first.md |
| 0004 | No global state store in V1 | Foundation | docs/adr/0004-no-global-store.md |
| 0005 | PWA via vite-plugin-pwa in injectManifest mode | Foundation | docs/adr/0005-pwa-vite-plugin.md |
| 0006 | Bootstrap seed lives inside the repository layer | Milestone 1 | docs/adr/0006-bootstrap-repository-seed.md |
| 0007 | Mission lifecycle rules live in a domain service | Milestone 2 | docs/adr/0007-mission-domain-service.md |
| 0008 | Self-Trust measures promise integrity, not productivity | Milestone 5 | docs/adr/0008-self-trust-integrity-not-productivity.md |

## Conventions (from docs/adr/README.md)

- One ADR per file, numbered sequentially. Never renumber.
- Never edit an accepted ADR — supersede it with a new one that references the old.
- Each ADR contains: Context, Decision, Consequences, Alternatives considered.

## Freeze note

No ADR beyond 0008 was added during the audit + hardening pass. Any new ADR belongs to a V1.1 or V2 planning cycle, not to this baseline.
