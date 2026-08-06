# Release Artefacts

*Baseline snapshot for v1.1.0. Any change here is a release-management change, not a product or architectural one.*

| Artefact | File |
| -------- | ---- |
| Release notes (v1.1.0) | ./release-notes-v1.1.0.md |
| Architecture summary | ./architecture-summary.md |
| ADR index | ./adr-index.md |
| Deployment checklist | ./deployment-checklist.md |
| Rollback procedure | ./rollback-procedure.md |
| Backup / restore verification | ./backup-restore-verification.md |
| Deferred roadmap | ./deferred-roadmap.md |

## Baseline

- Version: **v1.1.0**.
- Verification pipeline at freeze: typecheck clean, lint 0 errors (4 pre-existing test-file non-null-assertion warnings), 335 tests across 23 files, production build with 14 precache entries at ~525 KiB.
- Zero TODO / FIXME / XXX markers in `src/`.

## Change control

The main branch is release-candidate quality. From this point:

- **Permitted:** production bugs, security issues, data-loss bugs, build or deployment failures.
- **Not permitted without a separate planning cycle:** feature requests, architectural cleanups, refactors, "small improvements".
- Any material work opens as v1.2 or v2 planning — not by extending this baseline directly.
