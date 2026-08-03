# Architecture Decision Records

This directory records the significant architectural decisions taken for Personal OS.
Each ADR captures a single decision, its context, and its consequences.

## Index

| #    | Title                                                    | Status   |
| ---- | -------------------------------------------------------- | -------- |
| 0001 | [Feature-first folder structure](./0001-feature-first-architecture.md) | Accepted |
| 0002 | [IndexedDB via idb, one repository per aggregate](./0002-indexeddb-storage.md) | Accepted |
| 0003 | [Offline-first, single-user, single-device V1](./0003-offline-first.md) | Accepted |
| 0004 | [No global state store in V1](./0004-no-global-store.md) | Accepted |
| 0005 | [PWA via vite-plugin-pwa in injectManifest mode](./0005-pwa-vite-plugin.md) | Accepted |
| 0006 | [Bootstrap seed lives inside the repository layer](./0006-bootstrap-repository-seed.md) | Accepted |
| 0007 | [Mission lifecycle rules live in a domain service, not on the repository](./0007-mission-domain-service.md) | Accepted |
| 0008 | [Self-Trust measures promise integrity, not productivity](./0008-self-trust-integrity-not-productivity.md) | Accepted |
| 0009 | [Daily Flow Engine, Program Contract, and Today Layout Ownership](./0009-daily-flow-engine.md) | Accepted |

## Conventions

- One ADR per file, numbered sequentially. Never renumber.
- Never edit an accepted ADR — supersede it with a new one that references the old.
- Each ADR must have sections: **Context**, **Decision**, **Consequences**, **Alternatives considered**.
