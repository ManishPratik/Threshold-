# V1 Release Artefacts

*Frozen at v1.0.0. Any change here is a release-management change, not a product or architectural one.*

| Artefact | File |
| -------- | ---- |
| Architecture summary | ./architecture-summary.md |
| ADR index | ./adr-index.md |
| Deployment checklist | ./deployment-checklist.md |
| Rollback procedure | ./rollback-procedure.md |
| Backup / restore verification | ./backup-restore-verification.md |
| Deferred roadmap | ./deferred-roadmap.md |

## Baseline

- Version: **v1.0.0** (see package.json).
- Verification pipeline at freeze: typecheck clean, lint clean, 189 tests across 17 files, production build with 14 precache entries at ~402 KiB.
- Zero TODO / FIXME / XXX markers in src or docs.

## Change control

The main branch is release-candidate quality. From this point:

- **Permitted:** critical production bugs, security issues, data-loss bugs, build or deployment failures.
- **Not permitted without a separate planning cycle:** feature requests, architectural cleanups, refactors, "small improvements".
- Any material work opens as V1.1 or V2 planning — not by extending this baseline directly.
