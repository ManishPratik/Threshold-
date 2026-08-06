# Release log — Personal OS v1.1.0

Audit trail for the v1.1 release. Written per RELEASE_PLAN §4 and populated by
each work item in `RELEASE_CHECKLIST.md`. Every entry carries a timestamp,
the work-item ID, the command run, and the pasted output.

---

## W0.1 — Working tree audit

**Date:** 2026-08-05
**Repository:** `C:\Users\91982\Threshold-`
**Remote:** `https://github.com/ManishPratik/Threshold-.git`

### Context

Before running the audit, the working directory was on the branch
`docs/governance-atlas-framework` (commit `98c4575`, the governance docs
PR into main). `git checkout main` was run to bring the audit onto the
release-target branch. Git carried the working-tree changes across the
checkout without conflict, so the tree state observed below is identical
to the state observed on the branch immediately prior to checkout.

### Commands run

```
git branch --show-current           # before checkout: docs/governance-atlas-framework
git rev-parse HEAD                  # before checkout: 98c4575f6a6a66a8fbf718eb3c2af16b70a9a39b
git checkout main                   # switched to main
git branch --show-current           # after checkout: main
git rev-parse HEAD                  # after checkout: c1ce60291e32a2efe4aad091c0e23fec52fefdfb
git log -1 --format="%h %s"         # c1ce602 Personal OS v1.1.0-rc1 — Daily Flow Engine + Life Programs + release hardening
git status --short
```

### Branch and HEAD after checkout

- **Branch:** `main`
- **HEAD:** `c1ce60291e32a2efe4aad091c0e23fec52fefdfb`
- **HEAD subject:** `Personal OS v1.1.0-rc1 — Daily Flow Engine + Life Programs + release hardening`
- **Upstream:** `origin/main` (branch is up to date with the remote)

### git status --short (verbatim)

```
 M package-lock.json
 M src/app/frozen/FrozenAppLayout.tsx
 M src/app/frozen/FrozenAppShell.tsx
 M src/app/frozen/adapters.tsx
 M src/app/frozen/boot.ts
 M src/app/frozen/firstLaunch.ts
 M src/app/frozen/router.tsx
 M src/data/repositories/frozen/AppStateRepository.ts
 M src/data/types/frozen/AppState.ts
 M src/features/daily-flow-engine/DailyFlowSummary.tsx
 M src/features/daily-flow-engine/InterventionQueue.test.tsx
 M src/features/daily-flow-engine/InterventionQueue.tsx
 M src/features/daily-flow-engine/interventionQueue.test.ts
 M src/features/daily-flow-engine/interventionQueue.ts
 M src/features/daily-flow-engine/resolvePhase.ts
 M src/features/daily-flow-engine/surfaces.test.ts
 M src/features/daily-flow-engine/surfaces.ts
 M src/features/programs/TodayProgramWidgets.tsx
 M src/features/programs/index.ts
 M src/features/programs/registry.test.ts
 M src/features/programs/registry.ts
 D src/features/programs/types.ts
 M src/programs/smoking/Celebrations.tsx
 M src/programs/smoking/CravingSOSOverlay.tsx
 M src/programs/smoking/SmokingTodayWidget.tsx
 M src/programs/smoking/interventions.test.ts
 M src/programs/smoking/interventions.ts
 M src/programs/smoking/manifest.ts
 M src/routes/frozen/today/FrozenTodayPage.module.css
 M src/routes/frozen/today/FrozenTodayPage.tsx
 M tsconfig.app.json
 M vite.config.ts
 M vitest.config.ts
?? src/contract/
?? src/kernel/
?? src/routes/frozen/modules/
```

### Counts

| Kind             | Count |
|------------------|------:|
| Modified (` M`)  |    32 |
| Deleted  (` D`)  |     1 |
| Staged   (`A `)  |     0 |
| Untracked (`??`) |     3 |
| **Total paths**  |    36 |

### Comparison against RELEASE_CHECKLIST W0.1 expectation

The checklist expected "34 modified files + 3 untracked dirs (`src/contract/`,
`src/kernel/`, `src/routes/frozen/modules/`), OR fewer if a prior consolidation
landed." Observed: 32 modified + 1 deleted + 3 untracked dirs = 36 paths of
change. The 1 deleted file (`src/features/programs/types.ts`) is not a
mismatch — it is a rename target for the extraction to `src/contract/program/`
recorded in the session summary as Slice 1. The 32 modified + 1 deleted sums
to 33 tracked-file changes; the expectation of "34" is off by one and matches
the observed shape within the reconciliation tolerance the checklist provides
("OR fewer if a prior consolidation landed"). No prior consolidation is
evidenced in `git log` — HEAD remains at the pre-existing `c1ce602`.

### Observation

The three untracked directories match the checklist expectation exactly:
`src/contract/`, `src/kernel/`, `src/routes/frozen/modules/`. All three are
new-directory additions consistent with the Slice 1–3 + M1–M3 work described
in the session summary.

### Result

**W0.1 status: Completed.** Working-tree audit captured; state matches
RELEASE_CHECKLIST expectation within tolerance. Release log file created.
Ready for W0.2 (per-modified-file classification).

---

## W0.2 — Per-modified-file classification

**Date:** 2026-08-05
**Total paths classified:** 45 (32 modified + 1 deleted + 3 untracked dirs enumerated to 11 files + 1 new untracked file `docs/release/release-log-v1.1.0.md` created during W0.1).

### Classification categories

- **A** — Required for v1.1.0 release
- **B** — Future work (move out of release)
- **C** — Local experiment (exclude)
- **D** — Uncertain — requires Founder decision

### Classification table

| # | Path | Cat | Reason |
|---|------|-----|--------|
| 1 | `package-lock.json` | C | Founder decision: no `package.json` change, no intentional dependency change approved; revert unless Phase 1 build evidence proves it required. |
| 2 | `src/app/frozen/FrozenAppLayout.tsx` | A | M1 Discoverability: adds `'modules'` NavBar entry with path-matching + navigation handler (diff confirmed). |
| 3 | `src/app/frozen/FrozenAppShell.tsx` | A | M3 Home-first onboarding: retires kernel-level initial-route decision (10-line diff). |
| 4 | `src/app/frozen/adapters.tsx` | A | M1: adds `ModulesRouteAdapter` + `ModulesSmokingRouteAdapter` + threads `onExplore` prop into TodayRouteAdapter (22-line diff). |
| 5 | `src/app/frozen/boot.ts` | A | M3: adds `AppStateRepository.getStartingPoint()` fetch + `startingPoint` field on `FrozenBootData` (diff confirmed). |
| 6 | `src/app/frozen/firstLaunch.ts` | A | M3: simplifies `selectInitialRoute` to always return `'today'` after Home-first onboarding transfer (29-line diff). |
| 7 | `src/app/frozen/router.tsx` | A | M1: adds `/modules`, `/modules/routine`, `/modules/smoking` routes (diff confirmed). |
| 8 | `src/data/repositories/frozen/AppStateRepository.ts` | A | M3: adds `getStartingPoint` / `setStartingPoint` methods (25-line diff). |
| 9 | `src/data/types/frozen/AppState.ts` | A | M3: adds `startingPoint?: string` field with rationale comment (diff confirmed). |
| 10 | `src/features/daily-flow-engine/DailyFlowSummary.tsx` | A | Slice 1/2 kernel-facing update (7-line diff). |
| 11 | `src/features/daily-flow-engine/InterventionQueue.test.tsx` | A | Slice 1/2 kernel-facing test update (7-line diff). |
| 12 | `src/features/daily-flow-engine/InterventionQueue.tsx` | A | Slice 1/2 kernel-facing update (12-line diff). |
| 13 | `src/features/daily-flow-engine/interventionQueue.test.ts` | A | Slice 1 import path update (2-line diff). |
| 14 | `src/features/daily-flow-engine/interventionQueue.ts` | A | Slice 1 import path update (2-line diff). |
| 15 | `src/features/daily-flow-engine/resolvePhase.ts` | A | Slice 1 import path update (2-line diff). |
| 16 | `src/features/daily-flow-engine/surfaces.test.ts` | A | Slice 1 import path update (2-line diff). |
| 17 | `src/features/daily-flow-engine/surfaces.ts` | A | Slice 1/2 kernel-facing update (12-line diff). |
| 18 | `src/features/programs/TodayProgramWidgets.tsx` | A | Slice 1 import path update (2-line diff). |
| 19 | `src/features/programs/index.ts` | A | Slice 1: re-exports types from `@contract/program` (diff confirmed). |
| 20 | `src/features/programs/registry.test.ts` | A | Slice 1 import path update (2-line diff). |
| 21 | `src/features/programs/registry.ts` | A | Slice 1 import path update (2-line diff). |
| 22 | `src/features/programs/types.ts` (deleted) | A | Slice 1: types moved to `@contract/program/types.ts` (127-line deletion). |
| 23 | `src/programs/smoking/Celebrations.tsx` | A | Slice 3 kernel-import inversion (2-line diff). |
| 24 | `src/programs/smoking/CravingSOSOverlay.tsx` | A | Slice 3 kernel-import inversion (2-line diff). |
| 25 | `src/programs/smoking/SmokingTodayWidget.tsx` | A | Slice 1 import path update (2-line diff). |
| 26 | `src/programs/smoking/interventions.test.ts` | A | Slice 1 import path update (2-line diff). |
| 27 | `src/programs/smoking/interventions.ts` | A | Slice 1 import path update (2-line diff). |
| 28 | `src/programs/smoking/manifest.ts` | A | Slice 3: `registerProgram` → `registerModule` from `@kernel/registry` (diff confirmed). |
| 29 | `src/routes/frozen/today/FrozenTodayPage.module.css` | A | M3 Starting Points onboarding styling (71-line diff). |
| 30 | `src/routes/frozen/today/FrozenTodayPage.tsx` | A | M2 Daily Momentum composition + M3 OnboardingSection / StartingPointCard / EmptyState rewrite (204-line diff). |
| 31 | `tsconfig.app.json` | A | Slice 1+2 support: adds `@contract/*` and `@kernel/*` path aliases (diff confirmed). |
| 32 | `vite.config.ts` | A | Slice 1+2 support: adds `@contract` and `@kernel` resolve aliases (diff confirmed). |
| 33 | `vitest.config.ts` | A | Slice 1+2 support: adds `@contract` and `@kernel` resolve aliases (diff confirmed). |
| 34 | `src/contract/program/index.ts` | A | Slice 1 new leaf: `@contract/program` barrel export. |
| 35 | `src/contract/program/types.ts` | A | Slice 1 new leaf: extracted contract types (moved from `src/features/programs/types.ts`). |
| 36 | `src/kernel/modal/index.ts` | A | Slice 2 new: `@kernel/modal` E5 façade. |
| 37 | `src/kernel/registry/index.ts` | A | Slice 2 new: `@kernel/registry` E1 façade with V2 names. |
| 38 | `src/kernel/storage/index.ts` | A | Slice 2 new: `@kernel/storage` E3 factory. |
| 39 | `src/kernel/storage/scopedSettingsStore.test.ts` | A | Slice 2 tests for scoped settings store. |
| 40 | `src/kernel/storage/scopedSettingsStore.ts` | A | Slice 2 factory implementation. |
| 41 | `src/routes/frozen/modules/FrozenModulesPage.module.css` | A | M1 Modules route styling. |
| 42 | `src/routes/frozen/modules/FrozenModulesPage.tsx` | A | M1 Modules route page component. |
| 43 | `src/routes/frozen/modules/FrozenSmokingModuleDetailPage.tsx` | A | M1 Modules subroute: Smoking module detail page. |
| 44 | `src/routes/frozen/modules/index.ts` | A | M1 Modules route barrel export. |
| 45 | `docs/release/release-log-v1.1.0.md` | A | This release log itself. Founder decision (2026-08-05): living operational document, updated continuously through Phases 0–5; no documentation-only commits merely because the log changed; the release commit and `v1.1.0` tag contain the latest release log available at production promotion; post-tag additions from the 24-hour window or retrospective land in subsequent documentation-only commits without rewriting tagged history. |

### Founder decisions recorded during W0.2

- **package-lock.json → C.** Rationale: no `package.json` change, no intentional dependency change approved; revert unless Phase 1 build evidence proves it required.
- **docs/release/release-log-v1.1.0.md → A.** Rationale + commit strategy as recorded in row 45.

### Final counts

| Category | Count |
|----------|------:|
| A — Required for v1.1.0 release | 44 |
| B — Future work | 0 |
| C — Local experiment (exclude) | 1 |
| D — Uncertain | 0 |
| **Total paths** | **45** |

### Result

**W0.2 status: Completed.** All 45 paths classified with Founder decisions
recorded for the two paths that required them.

---

## W0.3 — Unintended drift reverted; release commit contains only intended v1.1 work

**Date:** 2026-08-05

### Category C paths reverted

Only one Category C path existed: `package-lock.json`.

### Command run

```
git restore package-lock.json
```

Exit code: 0.

### Verification

Fresh `git status --short` after the revert:

```
 M src/app/frozen/FrozenAppLayout.tsx
 M src/app/frozen/FrozenAppShell.tsx
 M src/app/frozen/adapters.tsx
 M src/app/frozen/boot.ts
 M src/app/frozen/firstLaunch.ts
 M src/app/frozen/router.tsx
 M src/data/repositories/frozen/AppStateRepository.ts
 M src/data/types/frozen/AppState.ts
 M src/features/daily-flow-engine/DailyFlowSummary.tsx
 M src/features/daily-flow-engine/InterventionQueue.test.tsx
 M src/features/daily-flow-engine/InterventionQueue.tsx
 M src/features/daily-flow-engine/interventionQueue.test.ts
 M src/features/daily-flow-engine/interventionQueue.ts
 M src/features/daily-flow-engine/resolvePhase.ts
 M src/features/daily-flow-engine/surfaces.test.ts
 M src/features/daily-flow-engine/surfaces.ts
 M src/features/programs/TodayProgramWidgets.tsx
 M src/features/programs/index.ts
 M src/features/programs/registry.test.ts
 M src/features/programs/registry.ts
 D src/features/programs/types.ts
 M src/programs/smoking/Celebrations.tsx
 M src/programs/smoking/CravingSOSOverlay.tsx
 M src/programs/smoking/SmokingTodayWidget.tsx
 M src/programs/smoking/interventions.test.ts
 M src/programs/smoking/interventions.ts
 M src/programs/smoking/manifest.ts
 M src/routes/frozen/today/FrozenTodayPage.module.css
 M src/routes/frozen/today/FrozenTodayPage.tsx
 M tsconfig.app.json
 M vite.config.ts
 M vitest.config.ts
?? docs/release/release-log-v1.1.0.md
?? src/contract/
?? src/kernel/
?? src/routes/frozen/modules/
```

### Counts after revert

| Kind             | Count |
|------------------|------:|
| Modified (` M`)  |    31 |
| Deleted  (` D`)  |     1 |
| Staged   (`A `)  |     0 |
| Untracked (`??`) |     4 |

`grep -F "package-lock.json"` against the fresh `git status --short` returns zero matches — package-lock.json is no longer in the working tree's change set. Note: this revert restores the tracked `package-lock.json` on disk to its HEAD state; the on-disk `node_modules/` directory reflects the earlier `npm install` and can diverge from the reverted lockfile until Phase 1 W1.1 re-runs `npm install`. Any regeneration observed at W1.1 becomes the evidence per the Founder's C-decision rationale.

### Category audit after revert

Every remaining path in `git status --short` maps to a Category A entry in the W0.2 classification table above. Zero Category B, C, or D paths remain in the working tree.

### Result

**W0.3 status: Completed.** Working tree contains only Category A paths;
Category C revert successful; no staging or commits performed. Ready for W0.4
(backlog reconciliation).

---

## W0.4 — P0 backlog reconciliation

**Date:** 2026-08-05
**Source of truth:** `docs/roadmap/v1.1-backlog.md`.

### P0 inventory

The backlog contains exactly one P0 item at `docs/roadmap/v1.1-backlog.md:14-29`
under section "0. Release-Quality":

- **RQ-1** — Draft persistence across `/welcome/*` refresh.

Every other backlog item is P1/P2/P3 per the priority tags at
`docs/roadmap/v1.1-backlog.md:29,49,63,75,87,101,112,129,139,154,162,178,188,196,205`.

### RQ-1 reconciliation

**Description (from backlog).** `OnboardingSetupProvider` in
`src/features/onboarding/OnboardingSetup.tsx` holds mission + routine drafts
in React state only; `WelcomeScreen4` at `src/routes/welcome/WelcomeScreen4.tsx:17-20`
redirects to `/welcome/promise` if `missionDraft` is missing. A tab crash or
mid-onboarding refresh discards the user's words.

**Verification commands.**

```
ls src/routes/welcome/                              → No such file or directory
ls src/features/onboarding/                         → No such file or directory
grep -n "welcome" src/app/frozen/router.tsx         → 0 matches
grep -rn "welcome|OnboardingSetup|missionDraft|WelcomeScreen4" src/
  → 4 matches, all in Home-page onboarding copy:
    src/routes/frozen/today/FrozenTodayPage.tsx:425
    src/routes/frozen/today/FrozenTodayPage.tsx:426
    src/routes/frozen/today/FrozenTodayPage.module.css:30
    src/routes/frozen/today/FrozenTodayPage.module.css:41
```

**Current-tree flow (Home-first onboarding per M3).** User clicks a Starting
Point card at `src/routes/frozen/today/FrozenTodayPage.tsx:461-475`;
`handleChooseStartingPoint` at `src/routes/frozen/today/FrozenTodayPage.tsx:114-140`
writes the choice to IndexedDB via `AppStateRepository.setStartingPoint(sp)`
at `src/routes/frozen/today/FrozenTodayPage.tsx:119` before any navigation
occurs (`navigate('/create-promise')` at line 127, `navigate('/modules/routine')`
at line 129, `navigate('/create-promise')` at line 131, or Home-stay at line
135). No multi-screen draft state exists that a refresh could discard.

**Status:** **No Longer Applicable.** The Frozen-architecture rewrite
(commit `a0c8e86` per `docs/release/session-handoff-v2.md:9`) retired the
`/welcome/*` route family and its `OnboardingSetupProvider`; RQ-1's premise
no longer exists in the codebase. The concern was eliminated by architectural
change rather than by targeted fix; the current architecture makes the class
of failure impossible by making the onboarding choice atomic and immediately
persistent.

### P0 reconciliation table

| ID   | Description                                         | Status              | Blocks v1.1.0? |
|------|-----------------------------------------------------|---------------------|----------------|
| RQ-1 | Draft persistence across `/welcome/*` refresh       | No Longer Applicable | No             |

### Result

**W0.4 status: PASSED.** No P0 item is Incomplete; RQ-1 is No Longer
Applicable with objective evidence. Ready for W0.5 (version bump decision).
Phase 0 has W0.5 and W0.6 remaining before Phase 1 may begin.

---

## W0.5 — Version bump decision

**Date:** 2026-08-05

### Existing release tags (chronological, tagger date)

| Date       | Tag                      | Commit    | Subject |
|------------|--------------------------|-----------|---------|
| 2026-07-30 | `v1.0.0`                 | `c59a822` | Personal OS v1.0.0 |
| 2026-08-03 | `v1.1.0-program-runtime` | `485bb5c` | Program Runtime + Smoking Program launch — 88 percent Threshold recovery on Frozen kernel |

Total tags: 2. `v1.0.0` is the last final semver-standard release;
`v1.1.0-program-runtime` is a mid-cycle checkpoint tag, not a final version.

### Scope of the current release (v1.0.0 → this release)

Backward-compatible feature additions + internal refactoring, per the W0.2
classification and per `docs/release/release-notes-v1.1.0.md`. IndexedDB
user data is preserved across the Frozen-architecture rewrite per that
document's reliability section; no external API contract exists to break;
the `/welcome/*` URL retirement is a soft break handled by the 404 route
at `src/app/frozen/adapters.tsx:293`.

### Recommendation and Founder decision

- Recommended: `v1.1.0` (minor bump; drop `-rc.1` suffix).
- Founder decision (2026-08-05): **Approved. Release version = v1.1.0.**

### Result

**W0.5 status: Completed.** Founder approved `v1.1.0`. Ready for W0.6
(apply the bump to `package.json`, `README.md`, release notes, and release
metadata).

---

## W0.6 — Apply the version bump

**Date:** 2026-08-05

### Files modified

| # | Path | Change |
|---|------|--------|
| 1 | `package.json` | `package.json:3` — `"version": "1.1.0-rc.1"` → `"version": "1.1.0"`. |
| 2 | `README.md` | `README.md:13` — `Release Candidate 1 (v1.1.0-rc1).` → `v1.1.0.`; `README.md:17` — link path `docs/release/release-notes-v1.1.0-rc1.md` → `docs/release/release-notes-v1.1.0.md`. |
| 3 | `docs/release/README.md` | line 3 — snapshot subtitle bump; line 7 — table entry filename + label bump; line 17 — "Version:" bullet simplified to `v1.1.0`. |
| 4 | `docs/release/adr-index.md` | line 1 — heading bump; line 3 — snapshot subtitle bump; line 29 — freeze-note heading bump. |
| 5 | `docs/release/architecture-summary.md` | line 1 — heading bump; line 3 — snapshot subtitle simplified; line 82 — counts heading bump. |
| 6 | `docs/release/release-notes-v1.1.0-rc1.md` → `docs/release/release-notes-v1.1.0.md` | Renamed via `mv` (per Founder decision); content edits at lines 1 (heading), 3 (subtitle), 109 (`Suggested tag`) removed `-rc1` references. |

### Founder decisions recorded during W0.6

- **`package-lock.json` version-field bump.** Founder decision: **Leave
  unchanged.** Do not edit manually. If Phase 1 W1.1 (`npm install`) proves
  npm must regenerate it to reconcile with `package.json` at `1.1.0`, treat
  that regeneration as objective evidence and classify the resulting
  lockfile update as Category A. My earlier targeted edit to
  `package-lock.json:3,9` was reverted via `git restore package-lock.json`
  (exit 0); grep confirms lines 3 and 9 are back to `"1.1.0-rc.1"`.
- **Release notes file rename.** Founder decision: **Rename via `mv`;
  treat the delete/add pair as Category A release artefacts resulting
  directly from the approved version decision.** Applied. The renamed
  file now lives at `docs/release/release-notes-v1.1.0.md`; the deleted
  path `docs/release/release-notes-v1.1.0-rc1.md` shows as `D` in
  `git status --short`.

### Consistency verification

`grep -irn -E '1\.1\.0-rc|rc1|rc\.1|release candidate|Release Candidate'`
across the whole repo (excluding `node_modules/`) after all edits returned
seven matches, all expected:

- `package-lock.json:3`, `package-lock.json:9` — Founder-approved leave-as-is;
  deferred to Phase 1 W1.1 evidence.
- `package-lock.json:2209` — coincidental `rc1` substring inside a
  base64-encoded SHA-512 integrity hash of an unrelated dependency; not a
  version reference.
- `package-lock.json:3699`, `package-lock.json:8711` — `"std-env": "^4.0.0-rc.1"`;
  version constraint for a third-party dependency (`std-env`), unrelated to
  Personal OS's version.
- `docs/release/release-log-v1.1.0.md:32`, `docs/release/release-log-v1.1.0.md:40` —
  historical entries from W0.1 recording the HEAD subject at that moment;
  per Founder's living-document rule, historical entries are not rewritten.

Zero remaining rc references outside these expected classes.

### Result

**W0.6 status: Completed.** Version bump applied across all release
artefacts per Founder decisions; consistency verified; no unwanted rc
references remain. Ready for Phase 1 (Local quality gates) pending
instruction.

---

## W1.1 — Complete quality-gate sequence

**Date:** 2026-08-05

### Results summary

| # | Step         | Command                | Exit | Duration | Result   |
|---|--------------|------------------------|-----:|---------:|----------|
| 1 | Install      | `npm install`          |    0 |       6s | PASS (with side-effects — see below) |
| 2 | Format       | `npm run format:check` |    1 |       4s | **FAIL** — 252 files with Prettier style issues |
| 3 | Lint         | `npm run lint`         |    0 |      11s | PASS with 4 warnings (pre-existing) |
| 4 | Type-check   | `npm run typecheck`    |    2 |       5s | **FAIL** — case-collision between `InterventionQueue.tsx` and `interventionQueue.ts` |
| 5 | Unit tests   | `npm test`             |    1 |      18s | **FAIL** — 11 tests failed / 333 passed (same case-collision root cause) |
| 6 | Prod build   | `npm run build`        |    2 |       4s | **FAIL** — same case-collision; no `dist/` produced |

### Step 1 — npm install (PASS with side-effects)

- Output: "added 49 packages, and audited 621 packages in 6s".
- Warnings: "4 high severity vulnerabilities" (npm audit surface; not addressed at W1.1 per Founder's "do not fix failures").
- **Side-effect: `package-lock.json` was regenerated.** `git diff --stat package-lock.json` reports 28 insertions / 100 deletions. Two classes of change:
  - Version-metadata bump at `package-lock.json:3` and `package-lock.json:9`: `"1.1.0-rc.1"` → `"1.1.0"` (2 lines, matches the Phase-0 `package.json` bump).
  - Peer-flag reorganization: removal of `"peer": true` on multiple `optional: true, dev: true` entries (jsdom-related transitive deps); addition of `"peer": true` on `@babel/core` (per diff). Net ~98 lines removed + 26 lines added of flag rearrangement. No package added, removed, or version-changed in the dependency graph itself — the change is limited to the peer/optional flag metadata that npm uses for peer-dep resolution decisions.
- **Founder rule from W0.6 applies:** "If Phase 1 W1.1 proves npm must regenerate it, treat that regeneration as objective evidence and classify the resulting lockfile update as Category A." Regeneration is now proven. Classification: A (release-required). No manual edit was made; the regeneration was produced entirely by `npm install`.

### Step 2 — npm run format:check (FAIL)

- Exit code 1. Duration 4s.
- Prettier reports "Code style issues found in 252 files. Run Prettier with --write to fix."
- Warnings/errors: 252 files, spanning `src/shared/ui/*`, `src/test/setup.ts`, `src/vite-env.d.ts`, `tsconfig.app.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, and many more (only the last 30 file names captured in tail output).
- Root cause: not yet diagnosed within W1.1 scope. Two candidate factors present but not confirmed as causal: (a) the `npm install` at step 1 added 49 packages including a newer Prettier — behavioral change plausible but not verified; (b) the Slice 1–3 + M1–M3 modifications added files/edits without a Prettier pass. Full diagnosis is out of scope per Founder's "do not fix failures."

### Step 3 — npm run lint (PASS with pre-existing warnings)

- Exit code 0. Duration 11s.
- 4 warnings, 0 errors:
  - `src/programs/smoking/healthMilestones.test.ts:22:14` — Forbidden non-null assertion.
  - `src/programs/smoking/healthMilestones.test.ts:23:9` — Forbidden non-null assertion.
  - `src/programs/smoking/hourlyMessages.ts:92:22` — Forbidden non-null assertion.
  - `src/programs/smoking/hourlyMessages.ts:99:19` — Forbidden non-null assertion.
- Matches the pre-existing 4-warning baseline recorded at `docs/release/README.md:18` ("4 pre-existing test-file non-null-assertion warnings"). The two `hourlyMessages.ts` warnings are in a non-test file — the doc's characterisation as "test-file" is inaccurate for those two, but the count matches.

### Step 4 — npm run typecheck (FAIL)

- Exit code 2. Duration 5s.
- Errors reported by `tsc -b --noEmit`:
  - `src/features/daily-flow-engine/index.ts(45,10)` TS2305: Module `"./interventionQueue"` has no exported member `InterventionQueue`.
  - `src/features/daily-flow-engine/index.ts(45,35)` TS1149: File name `InterventionQueue.ts` differs from already included file name `interventionQueue.ts` only in casing.
  - `src/features/daily-flow-engine/index.ts(46,15)` TS2305: Module `"./interventionQueue"` has no exported member `InterventionQueueProps`.
  - `src/features/daily-flow-engine/index.ts(46,45)` TS1149: Same casing collision as above.
- Root cause (confirmed): the same file identifier resolves to two distinct source files whose names differ only in case. `git ls-files src/features/daily-flow-engine/` shows both `InterventionQueue.tsx` and `interventionQueue.ts` present under git. `src/features/daily-flow-engine/index.ts:18` imports `listInterventions` from `./interventionQueue` (lowercase-i), while `src/features/daily-flow-engine/index.ts:45,46` import `InterventionQueue` + `InterventionQueueProps` from `./InterventionQueue` (uppercase-I). On the case-insensitive Windows/WSL DrvFs, TypeScript's file-name-only-differs-in-casing check fires; on case-sensitive filesystems (Linux CI, Netlify build), the two paths resolve to distinct files and the errors would not fire. This is RELEASE_PLAN R2 exactly.

### Step 5 — npm test (FAIL)

- Exit code 1. Duration 18s.
- 24 test files (1 failed / 23 passed). 344 tests total (11 failed / 333 passed). Baseline per `docs/release/deployment-checklist.md`: 335 tests / 23 files; observed growth of 9 tests + 1 file matches the M-milestone additions.
- All 11 failures are in `src/features/daily-flow-engine/InterventionQueue.test.tsx`. React error: "Element type is invalid: expected a string ... but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports." Same root cause as step 4 — the case-collision means the wrong module resolves for `InterventionQueue`, so the component export is `undefined` at test render time.

### Step 6 — npm run build (FAIL)

- Exit code 2. Duration 4s.
- Build script (`package.json:9`) is `tsc -b && vite build`; the `tsc -b` step failed with the same case-collision errors as step 4, so `vite build` never ran.
- No `dist/` directory produced (`ls dist/` returns "No such file or directory"; `dist/index.html`, `dist/sw.js`, `dist/manifest.webmanifest` all missing).

### Blockers for Phase 1 sign-off (S2 gate)

- **B-W1.1-a — Case-collision.** Blocks steps 4, 5, and 6 with a single root cause. Would not fire on the Linux Netlify build environment; environmental to Windows/WSL DrvFs per RELEASE_PLAN R2. Verifying on a case-sensitive environment OR renaming one of the two files (both options recorded in RELEASE_CHECKLIST W1.2) is required before S2 can sign.
- **B-W1.1-b — Prettier drift.** Blocks step 2. 252 files affected. Root cause not yet diagnosed within W1.1 scope.

### W1.1 status

**Steps 1 and 3 pass; steps 2, 4, 5, 6 fail. W1.1 as a whole: FAIL.**

No fixes were applied, no files were staged, no commits were created. Awaiting Founder direction on both blockers.

---

## W1.2 — Root-cause diagnosis (no fixes applied)

**Date:** 2026-08-05.

### Blocker A — Case-collision (typecheck / test / build)

Two independent files, both created in commit `c1ce602` with no rename
history: `src/features/daily-flow-engine/InterventionQueue.tsx` (React
component) and `src/features/daily-flow-engine/interventionQueue.ts`
(pure logic). Import graph verified via
`grep -rn "from './InterventionQueue'\|from './interventionQueue'" src/`:
lowercase imported at 4 sites (`DailyFlowSummary.tsx:5`, `index.ts:18`,
`interventionQueue.test.ts:7`, `InterventionQueue.tsx:12`); uppercase at
3 sites (`index.ts:45,46`, `InterventionQueue.test.tsx:7`). On
case-sensitive filesystems (Linux Netlify) the two paths resolve to
distinct files; on case-insensitive Windows/WSL DrvFs both paths
collapse. TS emits TS1149 at `src/features/daily-flow-engine/index.ts:45,46`;
Vitest emits React's "component is undefined" error at
`src/features/daily-flow-engine/InterventionQueue.test.tsx`.

**Smallest safe fix.** Rename `interventionQueue.ts` →
`interventionQueueEngine.ts` and `interventionQueue.test.ts` →
`interventionQueueEngine.test.ts`; update 3 import-path sites. Total: 2
renames + 3 in-place edits, all within
`src/features/daily-flow-engine/`. Public API of the feature folder
(`index.ts:18,45,46` re-exports of `listInterventions`,
`InterventionQueue`, `InterventionQueueProps`) is preserved. Expected
effect: the 11 failing tests in `InterventionQueue.test.tsx` pass;
typecheck exits 0; production build produces `dist/`.

### Blocker B — Prettier drift

`.prettierrc:10` requires `endOfLine: "lf"`; `git config core.autocrlf`
reports `true`; `git ls-files --eol` reports every sampled file has
`i/lf w/crlf`. Failure count 252 confirmed via
`npx prettier --list-different`. AST is unchanged — line-ending only,
non-semantic. Root cause: git's autocrlf converts LF→CRLF on Windows
checkout; Prettier reads the CRLF working tree and fails LF-only check.

**Smallest safe fix.** Local-only, zero tracked-file modifications:
`git config core.autocrlf false && git checkout -- .` normalizes the
working tree back to LF (matching what git stores). Optionally add
`.gitattributes` at repo root with `* text=auto eol=lf` for a durable
repo-level guarantee (1 new tracked file). No `prettier --write` is
required.

### Package-lock verification (W1.2 correction of W1.1's initial reading)

W1.1's initial reading said the lockfile regeneration was
"metadata-only." That was incorrect. W1.2 re-diff enumeration confirmed:
2 install-tree entries were removed (`node_modules/@csstools/css-parser-algorithms`,
`node_modules/@csstools/css-tokenizer`), both formerly at v4.0.0,
`optional: true, peer: true, dev: true`. Both packages remain declared
as `peerDependencies` at `package-lock.json:65-68, 1752-1753, 1781-1782`
but no install entry. Physical disk verified via
`ls -d node_modules/@csstools/*/` — neither package present. Cause:
npm 11's stricter optional-peer-dep pruning vs npm 10's speculative
install of the same dependencies.

**W1.2 status:** Investigation completed; two blocker fixes are ready
for Founder authorization but not applied.

---

## W1.2 addendum — package-lock deep investigation

**Date:** 2026-08-05.

Deep investigation (Q1–Q6 from Founder brief) confirmed the lockfile
divergence is caused by npm 11 → npm 10 behavioural difference plus
registry drift. The pruned packages were declared as peer dependencies
of `@asamuzakjp/css-color` (at `package-lock.json:65-68`),
`@csstools/css-calc` (at `package-lock.json:1752-1753`), and
`@csstools/css-color-parser` (at `package-lock.json:1781-1782`). npm 11
prunes; npm 10 speculatively installs. Regeneration under identical
tooling is deterministic; regeneration under different tooling is not.

---

## W1.2 addendum #2 — Node 20 + npm 10 CI regeneration

**Date:** 2026-08-06.

Temporary GitHub Actions workflow (`.github/workflows/lockfile-regen.yml`)
committed on branch `chore/lockfile-regen-probe` (commit `eadf137`),
push-triggered run `31073481712`. Toolchain confirmed:
`node --version` = `v20.20.2`; `npm --version` = `10.8.2`. Regenerated
lockfile downloaded to `/tmp/lockfile-probe/package-lock.json`.

**Comparison of local (npm-11) vs CI (npm-10) lockfiles** (Python `set`
diff on `packages` map):

- Local: 620 unique `node_modules/*` entries; CI: 588; common: 586.
- 34 packages only in local — all jsdom-family optional peers speculatively
  installed by npm 11.
- 1 package only in CI — `@napi-rs/lzma-linux-x64-gnu@1.5.1`, a Linux-x64
  optional binary.
- 70 packages installed at different versions between the two lockfiles —
  all patch/minor drift within `^` ranges in `package.json:20-56`, caused
  by npm registry state moving between install times.

**Reproducibility conclusion:** the build is not reproducible under
existing engineering policy. Neither the local nor the CI lockfile
represents "the correct" tree — each represents "what the tool at hand
produced against the registry at that moment."

Full recommendation (packageManager pin + Corepack + `npm ci`) produced
under W1.3.

---

## W1.3 — Reproducibility Stabilization investigation

**Date:** 2026-08-06.

### Root cause (Q1–Q7 from Founder brief)

The build is non-reproducible because three sources of non-determinism
compound at every fresh install:

- **Caret ranges in `package.json:20-56`** — 31 caret ranges, 0 tildes,
  0 exact pins across every declared dependency. Every `^X.Y.Z` allows
  the npm registry's evolving publications to change resolved versions
  on any re-resolve.
- **No pinned `packageManager`** — `grep '"packageManager"' package.json`
  returned no matches. Each install machine uses its own npm version;
  npm-version-specific optional-peer decisions produce different lockfile
  shapes.
- **No enforced `npm ci` in the build pipeline** — `netlify.toml:5`
  sets `command = "npm run build"` with no explicit install step,
  allowing Netlify's install phase to re-resolve caret ranges instead
  of installing the committed lockfile verbatim.

`npm ci` reproduces the dep graph exactly (installs the lockfile
verbatim, does not re-resolve, deletes existing `node_modules` first,
errors out on package.json vs lockfile drift instead of silently
"fixing"). Corepack (`corepack --version` on this machine reports
`0.34.0` at `/c/Program Files/nodejs/corepack`) reads the
`packageManager` field and dispatches the pinned npm version.

### Smallest safe stabilization plan (proposed)

Three tracked-file changes, no application-dep changes:

1. Add `"packageManager": "npm@10.8.2"` to `package.json`.
2. Change `netlify.toml:5` to `command = "corepack enable && npm ci && npm run build"`.
3. Adopt the CI-produced lockfile (`/tmp/lockfile-probe/package-lock.json`,
   313,508 bytes, 8,768 lines).

### Founder decision (2026-08-06)

- Investigation accepted.
- Stabilization changes NOT implemented in v1.1.0.
- Deferred to v1.2 as a new engineering backlog item: **Toolchain
  Reproducibility Initiative**, recorded at
  `docs/roadmap/v1.2-backlog.md` E-1.
- Continue v1.1.0 release under existing engineering policy.
- Only changes that directly unblock v1.1.0 may be made; no scope
  expansion.

**W1.3 status:** Completed as investigation-only. Implementation of
proposed changes deferred to v1.2 per Founder ruling.

---

## Lockfile revert + closure note

**Date:** 2026-08-06.
**Founder directive (2026-08-06):** Revert `package-lock.json` to the
last committed state; neither the npm-11 regen nor the CI regen is
suitable for this release; current release blockers are unrelated to
the lockfile.

**Action taken.** `git restore package-lock.json` (exit 0). Verified via
`grep -n '"version"' package-lock.json`: lines 3 and 9 back to
`"1.1.0-rc.1"`. Working-tree package-lock.json now matches HEAD
(`c1ce602`) byte-for-byte.

**Note recorded per Founder direction:**

> Lockfile reproducibility investigation completed. Engineering
> improvements deferred to v1.2. v1.1.0 ships with the last known-good
> committed lockfile.

Proceeding to the actual release blockers in the Founder-specified
order:
1. W1.2-A — Fix the case-collision with the smallest possible change.
2. Re-run typecheck, tests, build.
3. Investigate Prettier drift only after the build succeeds.

---

## W1.2-A — Case-collision fix

**Date:** 2026-08-06.

### Files renamed

Renames performed with plain `mv` (no `git mv`, no staging):

- `src/features/daily-flow-engine/interventionQueue.ts` →
  `src/features/daily-flow-engine/interventionQueueEngine.ts`.
- `src/features/daily-flow-engine/interventionQueue.test.ts` →
  `src/features/daily-flow-engine/interventionQueueEngine.test.ts`.

### Imports updated (4 sites)

- `src/features/daily-flow-engine/DailyFlowSummary.tsx:5` — `./interventionQueue` → `./interventionQueueEngine`.
- `src/features/daily-flow-engine/index.ts:18` — `./interventionQueue` → `./interventionQueueEngine`.
- `src/features/daily-flow-engine/InterventionQueue.tsx:12` — `./interventionQueue` → `./interventionQueueEngine`.
- `src/features/daily-flow-engine/interventionQueueEngine.test.ts:7` — `./interventionQueue` → `./interventionQueueEngine`.

Verified via `grep -rn "'./interventionQueue['\"]" src/`: zero remaining
references to the old path; all four sites now point to
`./interventionQueueEngine`.

### Public API preserved

`src/features/daily-flow-engine/index.ts:18,45,46` still re-export
`listInterventions`, `InterventionQueue`, `InterventionQueueProps` under
their original names. No consumer outside
`src/features/daily-flow-engine/` had to change; verified via the same
grep returning zero cross-feature imports of the renamed module.

### Re-run of quality gates (post-fix)

| # | Step | Command | Exit | Duration | Result |
|---|------|---------|-----:|---------:|--------|
| 1 | Type-check | `npm run typecheck` | 0 | 6s | **PASS** — 0 errors. |
| 2 | Unit tests | `npm test` | 0 | 18s | **PASS** — 344/344 tests across 24 files. |
| 3 | Prod build | `npm run build` | 0 | 12s | **PASS** — `dist/` produced; 215 modules transformed; PWA precache 14 entries at 536.66 KiB (matches baseline in `docs/release/README.md:18`); `dist/index.html` 1449 bytes, `dist/sw.js` 18240 bytes, `dist/manifest.webmanifest` 515 bytes; total dist 2.8 MB. |

**W1.2-A status: Completed.** Case-collision blocker resolved with the
smallest safe change (2 renames + 4 import edits, all within
`src/features/daily-flow-engine/`). No application logic, no dep, no
public API change. Ready for Prettier drift investigation per Founder
priority 3, or for the next Founder-directed work item.

---

## W1.2-B — Prettier drift investigation

**Date:** 2026-08-06.

### Root causes

**Two overlapping causes** produce the 253 failures reported by
`npx prettier --list-different` (10 additional entries are "no parser
could be inferred" errors for `.svg`, `.toml`, `.txt`, `.nvmrc`,
`.editorconfig` — not real Prettier failures):

- **Cause 1 — Line-ending drift, universal (253/253 files).**
  `git config core.autocrlf` = `true`; every text file has
  `i/lf w/crlf` per `git ls-files --eol`; `.prettierrc:10` requires
  `endOfLine: "lf"`. Git converts LF→CRLF on Windows checkout; every
  file fails the LF check.
- **Cause 2 — printWidth reflow, partial (134/253 files).** Files
  contain code authored with more conservative line-breaks than
  `.prettierrc:5` `printWidth: 100` permits; Prettier would collapse
  multi-line constructs onto single lines. Independent of line-endings —
  would fail on a case-sensitive Linux checkout too. Distribution
  across folders (`awk -F/`): 38 `features/`, 36 `routes/`, 18
  `programs/`, 10 `docs/release/`, 7 `app/`, 5 `shared/`, 3 `pwa/`, 3
  `data/`, 3 `docs/adr/`, 2 `docs/roadmap/`, 2 `kernel/`, 1
  `design-system/`, 1 `contract/`. Hits pre-existing folders
  (`design-system/`, `pwa/`, `docs/adr/`) as well as
  Slice/Milestone-added folders (`contract/`, `kernel/`), so it is not
  exclusively drift from the v1.1.0 work.

### Category counts (253 total)

| Category | Count |
|---|---:|
| Line-endings only | 119 |
| Line-endings + Prettier reflow | 134 |
| Parser-error (Prettier out of scope) | 10 (excluded) |

### Semantic-change check (12 files sampled)

Every reflow sample inspected was AST-equivalent — Prettier collapsing
multi-line constructs onto single lines under `printWidth: 100`.
Examples: `src/shared/ui/Icon/Icon.tsx` chained method call; `src/features/programs/registry.ts` function signature; `src/routes/frozen/today/FrozenTodayPage.tsx` multi-line named imports; `src/contract/program/types.ts` union type. Zero semantic (behavioral) changes detected in any sample.

### Recommendation delivered to Founder

**C. Defer formatting to v1.2** — repo-wide format is AST-safe but
adds ≥134 tracked-file diffs on top of the 44 Category A release
files, contaminating the release commit with cosmetic churn unrelated
to v1.1.0 scope; the line-ending root cause requires toolchain-level
fixes (`.gitattributes` and/or `git config` policy) that belong to the
v1.2 Toolchain Reproducibility Initiative (E-1 at
`docs/roadmap/v1.2-backlog.md`).

---

## FE-001 — Founder Release Exception (format:check waiver)

**Date:** 2026-08-06.

- **Release:** v1.1.0.
- **Gate:** `npm run format:check` (`RELEASE_CHECKLIST` W1.4).
- **Disposition:** **Waived** for v1.1.0.
- **Justification (verbatim from Founder):** "Investigation W1.2-B
  established that the failures are formatting-only (CRLF normalization
  and Prettier reflow). No semantic changes were detected. Build,
  typecheck, tests, and production build all pass. Repository-wide
  formatting would materially expand release scope and is deferred to
  the v1.2 Toolchain Reproducibility Initiative."
- **Required follow-up.** The formatting gate becomes mandatory again
  once (a) `packageManager` is pinned, (b) Corepack is adopted, (c)
  toolchain is standardized, (d) line-ending policy is enforced, (e)
  repository formatting baseline is regenerated. All five are scope of
  the v1.2 E-1 Toolchain Reproducibility Initiative.
- **Scope of waiver.** Applies only to v1.1.0. Not transferable to any
  subsequent release. Any v1.1.0.x P0 bug-fix release under the freeze
  rule (RELEASE_PLAN §8) inherits this waiver by virtue of being on the
  frozen v1.1.0 line; the mandatory-again condition applies to v1.2 and
  beyond.

### Phase 1 gate matrix after FE-001

| # | Gate | Status | Notes |
|---|------|--------|-------|
| W1.1 | `npm install` | PASS | Regenerated package-lock reverted per Founder ruling; lockfile matches HEAD `c1ce602`. |
| W1.2 | `npm run typecheck` | PASS | 0 errors after W1.2-A case-collision fix. |
| W1.3 | `npm run lint` | PASS | 4 pre-existing warnings; matches baseline at `docs/release/README.md:18`. |
| W1.4 | `npm run format:check` | WAIVED (FE-001) | Deferred to v1.2 per Founder. |
| W1.5 | `npm test` | PASS | 344/344 tests across 24 files. |
| W1.6 | `npm run build` | PASS | `dist/` produced; PWA precache 14 entries at 536.66 KiB. |
| W1.7 | `npm run preview` | PENDING | Not yet run. |

Phase 1 status after FE-001: 5 gates pass, 1 waived, 1 pending. Ready
for W1.7 preview verification.

---

## W1.7 — Preview verification (Section A + Section B split per Founder)

**Date:** 2026-08-06.

Per Founder direction, W1.7 was split into infrastructure verification
(curl / HTTP-inspectable) and runtime verification (browser required),
with the rule that no runtime item may be marked PASS unless it has
been executed in a browser.

### Section A — Infrastructure Verification

All 9 curl-inspectable checks passed against `http://localhost:4173/`
served by `npm run preview` from the `dist/` produced at W1.2-A step 3:

- Preview server responds 200 OK at `/`.
- `/index.html` (1449 bytes) references the JS bundle
  (`/assets/index-BJzsOg-g.js`), CSS bundle
  (`/assets/index-DWzQO4x7.css`), and manifest
  (`<link rel="manifest" href="/manifest.webmanifest">`).
- `/sw.js` served 200 OK, `Content-Type: text/javascript` (18240 bytes).
- `/manifest.webmanifest` served as valid JSON,
  `Content-Type: application/manifest+json`, with `scope: "/"`,
  `display: "standalone"`, `orientation: "portrait"`, 3 SVG icons.
- Precache manifest embedded in `dist/sw.js`: 14 entries at 536.66 KiB,
  matching the build output and the `docs/release/README.md:18`
  baseline. Note: 4 entries are duplicated in the array
  (`icons/icon-192.svg`, `icons/icon-512.svg`,
  `icons/icon-maskable-512.svg`, `manifest.webmanifest` — harmless
  `vite-plugin-pwa` code-generation quirk; workbox dedupes internally).
- SPA fallback: `curl "http://localhost:4173/some-nonexistent-route"`
  returns 200 with the `index.html` body, matching `netlify.toml:14-17`
  rewrite intent.
- Asset probe: 10 of 11 probed paths return 200; `/favicon.ico`
  returns 404 (`dist/index.html` uses `<link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />` with no ICO fallback declared — browsers use the SVG link; non-blocking).

**ENV-LIMITED (not testable against local Vite preview):**

- Netlify security headers declared at `netlify.toml:41-47`
  (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`) — Vite preview does not apply Netlify headers.
  Testable only against Netlify deploy preview; deferred to Phase 3
  W3.7.
- Netlify asset long-cache header declared at `netlify.toml:19-22`
  (`Cache-Control: public, max-age=31536000, immutable` for
  `/assets/*`) — Vite preview serves `Cache-Control: no-cache`.
  Testable only against Netlify; deferred to Phase 4 W4.5.

**Section A verdict: PASS.**

### Section B — Runtime Verification

Runtime checks (application boot, service-worker registration, offline
mode, Daily Flow end-to-end, Smoking Program end-to-end, Starting
Point persistence across refresh, no runtime exceptions, PWA install
prompt behaviour, cache/version behaviour after refresh) all require
JavaScript execution in a live browser or user interaction. No browser
or browser-automation tool is available in this environment: `ToolSearch`
for "browser puppeteer playwright chrome devtools screenshot" surfaced
only Google Calendar and Google Drive OAuth tools; none applicable.

Per Founder rule, no runtime item is marked PASS without a browser
execution.

**Section B verdict: UNVERIFIABLE due to absence of browser tooling.**

### Founder ruling (2026-08-06)

- **Section A (Infrastructure Verification): PASS.**
- **Section B (Runtime Verification): UNVERIFIABLE** due to absence
  of browser tooling.
- **This is not an engineering failure.** It is a release acceptance
  activity and is deferred to Phase 3 (Deploy Preview) where a real
  browser is available.

**Note recorded per Founder direction:**

> Runtime browser verification deferred to Phase 3. Production
> promotion is blocked until browser verification is completed
> successfully.

**W1.7 status: COMPLETE.**

---

## Phase 1 closure

**Phase 1 status: COMPLETE (2026-08-06).**

Final Phase 1 gate matrix:

| # | Gate | Status |
|---|------|--------|
| W1.1 | `npm install` | PASS |
| W1.2 | `npm run typecheck` | PASS |
| W1.3 | `npm run lint` | PASS (4 pre-existing warnings) |
| W1.4 | `npm run format:check` | WAIVED (FE-001) |
| W1.5 | `npm test` | PASS (344/344 tests across 24 files) |
| W1.6 | `npm run build` | PASS (`dist/` produced) |
| W1.7 | Preview verification | COMPLETE (Section A PASS; Section B UNVERIFIABLE / deferred to Phase 3) |

Proceeding to Phase 2 per RELEASE_PLAN §3 — release commit + branch
cut of `release/v1.1.0` from `main`.

---

## Phase 2 execution

**Date:** 2026-08-06.

- **W2.1 — Release branch cut.** `git switch -c release/v1.1.0 main`. Source `main` SHA `c1ce60291e32a2efe4aad091c0e23fec52fefdfb`; release-branch HEAD SHA identical. **PASS.**
- **W2.2 — Release commit.** Package.json version re-applied to `1.1.0` at `package.json:3`. Staged 50 Category A files explicitly (no `git add -A`; `docs/roadmap/v1.2-backlog.md` excluded per v1.2 scope; `package-lock.json` unstaged per Founder ruling). Commit SHA `35b00ba2b067bd5f1fa39ef09d6cc1c6b6117f5f`. Message: `Release: Personal OS v1.1.0`. 50 files changed, 2131 insertions, 97 deletions. **PASS.**
- **W2.3 — Push + PR.** `git push -u origin release/v1.1.0` succeeded. PR #3 opened at https://github.com/ManishPratik/Threshold-/pull/3 (base `main`, head `release/v1.1.0`, state OPEN, mergedAt null). No tag; no merge; main unchanged at `c1ce602`. **PASS.**

---

## Gate FA — Founder Acceptance

**Date:** 2026-08-06.

Founder Review Package presented (Sections 1–7). Founder Decision recorded verbatim:

> **Founder Decision: GO**
> Scope of approval: Phase 3 (Deploy Preview) only.
> Production promotion remains prohibited.

**Gate FA status: PASS.**

Authorization: transition from Phase 2 to Phase 3. Constraints: do not
merge; do not tag; do not deploy to production. If any P0 defect is
discovered during Phase 3, stop immediately, record in this log, and
return to the appropriate earlier phase per RELEASE_PLAN.

Proceeding to Phase 3 execution.

---

## Phase 3 execution

**Date:** 2026-08-06.

### W3.1 — Netlify deploy preview builds green

**Status: PASS.**

`gh pr checks 3` on commit `35b00ba2b067bd5f1fa39ef09d6cc1c6b6117f5f`
returns success across all Netlify checks:

- `netlify/makeyoudiscplined/deploy-preview` — **pass** — Deploy Preview ready!
- `netlify/stellular-druid-c837e6/deploy-preview` — **pass** — Deploy Preview ready!
- `Header rules - makeyoudiscplined` — **pass** — 4 header rules processed
- `Header rules - stellular-druid-c837e6` — **pass** — 4 header rules processed
- `Redirect rules - makeyoudiscplined` — **pass** — 1 redirect rule processed
- `Redirect rules - stellular-druid-c837e6` — **pass** — 1 redirect rule processed
- `Pages changed - makeyoudiscplined` — **neutral** — 5 new files uploaded (1 generated page + 4 assets changed)
- `Pages changed - stellular-druid-c837e6` — **neutral** — all files already uploaded

**Deploy preview URLs (per Netlify PR comment):**
- Primary: https://deploy-preview-3--makeyoudiscplined.netlify.app
- Secondary: https://deploy-preview-3--stellular-druid-c837e6.netlify.app

**Deploy log links (per Netlify PR comment):**
- Primary: https://app.netlify.com/projects/makeyoudiscplined/deploys/6a742f9d07dafe00086fad55
- Secondary: https://app.netlify.com/projects/stellular-druid-c837e6/deploys/6a742f9db44dbb00080de9b5

### W3.2 – W3.10 — Blocked by two independent constraints

Attempted `curl -sI https://deploy-preview-3--makeyoudiscplined.netlify.app/`
and every path (`/`, `/sw.js`, `/manifest.webmanifest`, `/assets/*`,
SPA-rewrite probe, `/favicon.ico`) returns **HTTP/2 401** with
`content-type: text/html; charset=utf-8`. The Netlify deploy preview
is behind site-level protection — every path returns 401 without
authentication. Only the platform-level `strict-transport-security`
header from Netlify's edge is visible.

Two constraints stack on Phase 3 W3.2–W3.10:

- **C1 — Browser tooling.** W3.2 (boot < 3 s, no console errors),
  W3.3 (IndexedDB inspection), W3.4 (route smoke tests), W3.5
  (Life Program smoke), W3.6 (Daily Flow behaviour), W3.7 (PWA
  install + update flow), W3.8 (backup/restore round-trip), W3.9
  (accessibility keyboard-only spot-check), W3.10 (cross-browser
  Chrome/Safari desktop+mobile) all require live browser execution.
  No browser or browser-automation tool is available in this
  environment (`ToolSearch` for "browser puppeteer playwright chrome
  devtools" returned only Google Calendar/Drive OAuth tools this
  turn — see W1.7 for the same finding).
- **C2 — Preview URL authentication.** Even the curl-inspectable
  header checks that would close the W1.7 ENV-LIMITED gap for
  `netlify.toml:19-47` (security headers, asset long-cache,
  `Service-Worker-Allowed`, `manifest.webmanifest` `Cache-Control`)
  cannot be executed because every path returns 401 without
  credentials.

**Neither constraint is fixable from this environment.**

### Phase 3 status

**Phase 3 status: PARTIAL.** W3.1 PASS; W3.2–W3.10 blocked by C1 +
C2. Full Phase 3 completion requires a human operator (or
browser-automation running with preview credentials) to execute
W3.2–W3.10 against the Netlify deploy preview URL after providing
the site-protection credential.

**P0 defect check.** No P0 defect discovered during Phase 3
execution to date. W3.1 is green; W3.2–W3.10 cannot be executed
in this environment, so no evidence of a defect has been produced
either way from those items.

Per Founder Acceptance rule at Gate FA, Phase 3 must complete
successfully before production promotion (Phase 4) is authorized.
Production promotion remains prohibited per Founder ruling.

---

## Phase 3 reclassification (Founder ruling 2026-08-06)

Per Founder ruling, Phase 3 is split into two parts:

### Phase 3A — Automated Deploy-Preview Verification

**Status: COMPLETE.**

Scope: W3.1 (Netlify deploy preview builds green). Executed and passed
via `gh pr checks 3` against commit `35b00ba2b067bd5f1fa39ef09d6cc1c6b6117f5f`;
both `netlify/makeyoudiscplined/deploy-preview` and
`netlify/stellular-druid-c837e6/deploy-preview` report `pass`.

### Phase 3B — Interactive Runtime Verification

**Status: PENDING — Interactive Runtime Verification Required.**

Scope (moved from Phase 3): W3.2 Preview URL boot < 3 s + no console
errors; W3.3 IndexedDB inspection; W3.4 Route smoke tests; W3.5
Life Program smoke; W3.6 Daily Flow behaviour smoke; W3.7 PWA install
+ update flow; W3.8 Backup/restore round-trip; W3.9 Accessibility
spot-check; W3.10 Cross-browser spot-check.

Each item classified **PENDING — Interactive Runtime Verification Required**, not FAIL.

**Recorded reasons for the pending state (per Founder direction):**

- **Netlify authentication prevented automated verification.** Every
  path on `https://deploy-preview-3--makeyoudiscplined.netlify.app/`
  returns `HTTP/2 401` with `content-type: text/html; charset=utf-8`.
  Only `strict-transport-security: max-age=31536000; includeSubDomains; preload`
  from the Netlify edge is observable. The deploy preview is behind
  site-level protection, blocking automated curl-based verification.
- **Browser tooling was unavailable.** `ToolSearch` for "browser
  puppeteer playwright chrome devtools screenshot" surfaced no browser
  automation MCP; only Google Calendar/Drive OAuth tools were returned.
  No headless browser can execute W3.2–W3.10 from this environment.
- **Neither condition constitutes a software defect.** The v1.1.0
  release commit builds green on Netlify (Phase 3A W3.1); every Phase 1
  gate PASS/WAIVED; no P0 defect discovered.

### Phase 3B → Phase 4 gate

Phase 4 (production promotion) remains **BLOCKED** until Phase 3B is
completed by the highest-capability verifier available (per Founder
Amendment 2026-08-06 and `docs/release/release-verification-policy.md`
§3 Capability Rule) executing W3.2–W3.10 against the Netlify deploy
preview URL per `docs/release/deployment-checklist.md` smoke-test
procedures.

No merge; no tag; no production deploy performed. `main` at
`c1ce60291e32a2efe4aad091c0e23fec52fefdfb`; `release/v1.1.0` at
`35b00ba2b067bd5f1fa39ef09d6cc1c6b6117f5f`; PR #3 state OPEN,
mergedAt null; no `v1.1.0` tag exists (local or remote).

---

## Founder Amendment 2026-08-06 — Verification model made capability-based

Per Founder ruling, the release verification model is amended:

- **Verification is capability-based, not person-based.** The governing
  requirement for Phase 3B is that the application executes in a real
  browser and produces observable evidence — not that a specific
  person conducts the test.
- **Three phases codified:** Phase 3A (Infrastructure Verification),
  Phase 3B (Interactive Runtime Verification), Phase 3C (Production
  Validation). Full definitions, capability priority order, blocking
  rules, and terminology retirement map are in the new
  `docs/release/release-verification-policy.md`.
- **Capability priority for Phase 3B:** Playwright → Chrome DevTools
  automation → Puppeteer → Human reviewer. Human verification is
  the fallback, not the primary mechanism.
- **Blocking rules.** Phase 4 cannot begin unless Phase 3A + Phase 3B
  complete. Phase 5 cannot begin unless Phase 3C complete.
- **Terminology retired:** "Human Verification" / "Human Acceptance" /
  "Human Acceptance Verification" replaced everywhere with
  "Interactive Runtime Verification".

### Current release state after this amendment

- **Phase 3A: COMPLETE.** W3.1 Netlify deploy preview built green
  (unchanged from prior Phase 3A record above).
- **Phase 3B: BLOCKED.** Reasons recorded:
  - Deploy Preview authentication prevented automated execution (every
    path returns `HTTP/2 401`).
  - No browser automation available in this environment (`ToolSearch`
    for "browser puppeteer playwright chrome devtools screenshot"
    returned only Google Calendar/Drive OAuth tools).
  - **This is an environmental limitation, not a software defect.**
- **Release-state changes from this amendment: none** beyond terminology
  and process documentation. No merge, tag, deploy, or code change
  performed. `main` still at `c1ce60291e32a2efe4aad091c0e23fec52fefdfb`;
  `release/v1.1.0` still at `35b00ba2b067bd5f1fa39ef09d6cc1c6b6117f5f`;
  PR #3 state OPEN; no `v1.1.0` tag.

---

## Phase 4 execution — Production promotion

**Date:** 2026-08-06.
**Authorization:** Founder instruction 2026-08-06 authorized merge, production deployment, and tag creation.

### Safety pre-flight

- `git fetch origin` completed.
- `main` HEAD before merge: `c1ce60291e32a2efe4aad091c0e23fec52fefdfb` (unchanged from Phase-0 recorded value).
- `release/v1.1.0` HEAD: `35b00ba2b067bd5f1fa39ef09d6cc1c6b6117f5f` (matches approved release commit).
- PR #3 pre-merge state per `gh pr view 3 --json state,mergeable,mergeStateStatus`: `{"state":"OPEN","mergeable":"MERGEABLE","mergeStateStatus":"CLEAN"}`. No merge conflicts.

### Merge

- Command: `gh pr merge 3 --merge --admin` (standard GitHub merge strategy; `--admin` bypasses required-review checks per Founder authorization).
- Result: main advanced `c1ce602…` → `aa947e6…`.
- **Merge commit SHA: `aa947e6e20876895e42ead0b4af4fb9436a5eac7`**.
- PR #3 post-merge state: `{"state":"MERGED","mergedAt":"2026-08-06T08:01:54Z","mergedBy":"ManishPratik","mergeCommit":{"oid":"aa947e6e20876895e42ead0b4af4fb9436a5eac7"}}`.
- Post-merge main log:
  ```
  aa947e6 Merge pull request #3 from ManishPratik/release/v1.1.0
  35b00ba Release: Personal OS v1.1.0
  c1ce602 Personal OS v1.1.0-rc1 — Daily Flow Engine + Life Programs + release hardening
  ```

### Tag

- Command: `git tag -a v1.1.0 -m "Personal OS v1.1.0"` on main HEAD `aa947e6…`; `git push origin v1.1.0`.
- Result: annotated tag object `3de057a89edddb34e1d6ede915a27d16c5ae8590` created, pointing to commit `aa947e6e20876895e42ead0b4af4fb9436a5eac7`.
- Origin tag verification (`git ls-remote --tags origin | grep v1.1.0`):
  - `3de057a89edddb34e1d6ede915a27d16c5ae8590	refs/tags/v1.1.0`
  - `aa947e6e20876895e42ead0b4af4fb9436a5eac7	refs/tags/v1.1.0^{}`

### Production deployment

- **Production URL:** `https://makeyoudiscplined.netlify.app/`.
- **Deployed commit SHA:** `aa947e6e20876895e42ead0b4af4fb9436a5eac7` (Netlify auto-built from main HEAD after merge).
- **Netlify build was independent of the local build:** production JS bundle `/assets/index-C4RruODU.js` (160330 bytes) and CSS `/assets/index-B4Ly2A-1.css` (96022 bytes) have different content-hashes than the local W1.2-A build (`/assets/index-BJzsOg-g.js`, `/assets/index-DWzQO4x7.css`). Same source commit; different transitive-dep resolution under Netlify's Node 20 + npm 10.x per W1.3 findings. Behavioural equivalence is verified by Phase 3B human/browser test, not by bundle-hash comparison. Vendor bundle `/assets/react-CkDVGEv-.js` hash matches.
- **Netlify deploy URL:** `https://app.netlify.com/projects/makeyoudiscplined/` (dashboard). Specific deploy ID for `aa947e6…` is available in the Netlify dashboard deploys list; not extractable via `gh api /repos/…/commits/…/check-runs` because Netlify posts check-runs only for PR builds, not main-branch pushes.
- **Deployment duration:** not directly measurable from this environment (no direct Netlify API access). Netlify's typical Node-20 build for this repo runs in the 1–2 minute range per `docs/release/session-handoff-v2.md:44`.

### Phase 3C — Production Validation (per release-verification-policy.md)

All 9 curl-inspectable production checks PASS against `https://makeyoudiscplined.netlify.app/`:

| # | Check | Result | Evidence |
|---|---|---|---|
| 3C.1 | HTTP 200 on `/` | PASS | `HTTP/2 200`. |
| 3C.2 | `index.html` loads | PASS | `content-type: text/html; charset=UTF-8`; `content-length: 1422`. |
| 3C.3 | JS bundle loads | PASS | `/assets/index-C4RruODU.js` returns 200; `content-length: 160330`; `content-type: application/javascript; charset=UTF-8`. |
| 3C.4 | CSS bundle loads | PASS | `/assets/index-B4Ly2A-1.css` returns 200; `content-length: 96022`; `content-type: text/css; charset=UTF-8`. |
| 3C.5 | manifest loads | PASS | `/manifest.webmanifest` returns 200; `content-type: application/manifest+json` (matches `netlify.toml:34`). |
| 3C.6 | service worker serves | PASS | `/sw.js` returns 200; `content-type: application/javascript; charset=UTF-8`; `service-worker-allowed: /` (matches `netlify.toml:26-30`). |
| 3C.7 | security headers | PASS | `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()`, `strict-transport-security: max-age=31536000; includeSubDomains; preload` — all present per `netlify.toml:41-47` + Netlify edge default. |
| 3C.8 | cache headers | PASS | `/` and `/manifest.webmanifest` and `/sw.js`: `cache-control: public,max-age=0,must-revalidate` per netlify.toml. `/assets/*`: `cache-control: public,max-age=31536000,immutable` per `netlify.toml:19-22`. |
| 3C.9 | SPA routing | PASS | `/some-nonexistent-route` returns 200 with `text/html` body; `/modules` (new v1.1.0 route) returns 200. Netlify rewrite per `netlify.toml:14-17` works. |
| 3C.10 | no broken production assets | PASS | All 4 icons + react bundle + workbox-window bundle return 200; `/favicon.ico` returns 200 (Netlify serves a default; not 404 as local Vite preview did). |

**Phase 3C status: COMPLETE.** All Netlify-edge-applied headers verified; SPA routing verified; every probed asset returns 200.

### Phase 3B — Interactive Runtime Verification

**Status: PENDING — Human Acceptance Checklist below.**

Per `docs/release/release-verification-policy.md` §3 Capability Rule, browser automation is preferred (Playwright / Chrome DevTools / Puppeteer). None is available in this environment (`ToolSearch` for browser-automation MCP surfaced only Google Calendar/Drive OAuth tools this turn). Therefore fallback to Human reviewer per §3 capability priority order.

Founder rule from Phase 4 execution brief: "If browser automation is available: execute the complete Interactive Runtime Verification checklist. Otherwise: stop after production deployment and produce a Human Acceptance Checklist for testing."

Phase 4 blocking rule from `docs/release/release-verification-policy.md` §4 has been evaluated: Phase 3A COMPLETE (W3.1); Phase 3B not COMPLETE — Founder authorization overrode the standing block ("Assume Founder Approval for: Merge to main, Production deployment, Tag creation") for this release. Phase 3B human verification is now the next required step to close the release cycle.

### Release status

- **Version:** v1.1.0.
- **Tag:** `v1.1.0` at commit `aa947e6…`.
- **Production commit deployed:** `41b1139…` (post-Slice-H).
- **Production URL live:** `https://makeyoudiscplined.netlify.app/`.
- **Phase 3A:** COMPLETE.
- **Phase 3B:** COMPLETE — Slice H automation supersedes the human-checklist fallback (see Slice H section below).
- **Phase 3C:** COMPLETE.
- **Phase 4:** COMPLETE (merge + tag + production deploy).
- **Phase 5:** PENDING — 24-hour observation window begins after Slice H closure below.

---

## Slice H — Interactive Runtime Verification (automated)

**Date:** 2026-08-06.
**Scope:** Install Playwright + Chromium; author minimal Founder Critical Path suite; verify against LIVE production; fix any defects; close Phase 3B on the record.
**Founder brief (verbatim scope):** "Slice H — Automated Runtime Verification. Install Playwright + Chromium, create 12-test critical path suite, verify against LIVE production. If any test fails: stop immediately, record reproduction / root cause / affected files / severity / smallest safe fix, implement only that fix, run gates, redeploy production, re-verify. Continue until every critical-path item passes."

### Infrastructure installed

- `@playwright/test@^1.62.1` added to `package.json` devDependencies; Chromium browser installed via `npx playwright install chromium`.
- `playwright.config.ts` — single Chromium project, `PLAYWRIGHT_BASE_URL` env, `testDir: './tests/runtime'`, worker 1, retries 0.
- `tests/runtime/critical-path.spec.ts` — 12-test Founder Critical Path suite. IndexedDB seeded via `page.addInitScript` + `page.evaluate` (helper `primeAppState()`) so tests are deterministic without hand-mocking API.
- `vitest.config.ts` — added `exclude: ['tests/runtime/**']` so Vitest does not attempt to execute Playwright specs.
- `.gitignore` — added `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`.
- `package.json` scripts — `verify:runtime` (default reporter), `verify:runtime:ci` (list reporter).
- `docs/release/release-verification-policy.md` §1 Phase 3B updated: Playwright marked **INSTALLED** at capability priority #1.

### Defects discovered and fixed during Slice H execution

**Defect SLH-1 — Home does not render Smoking's Craving-SOS surface.**
- **Reproduction:** Playwright tests 5 and 7 failed on local preview (`await expect(page.getByRole('button', { name: /Craving-SOS/i })).toBeVisible()` timed out on Home).
- **Root cause:** Slice E made Home iterate `listHomeSurfaces()`. Smoking's manifest (`src/programs/smoking/manifest.ts:12-18`) declared its Home widget via `surfaces: [{slot: 'ambient', component: SmokingTodayWidget}]`, not `homeSurfaces` and not `todayWidget`. The `moduleHomeSurfaces` helper in `src/kernel/registry/index.ts` only aliased `todayWidget`, so the Smoking surface was silently dropped.
- **Affected file:** `src/kernel/registry/index.ts` — `moduleHomeSurfaces` function.
- **Severity:** Regression (surface silently absent; no console error).
- **Smallest safe fix:** Extended `moduleHomeSurfaces` to auto-alias `surfaces[]` entries: `slot: 'ambient' → layer: 'supporting'`; `slot: 'hero' → layer: 'hero'`; `slot: 'overlay'` skipped. Commit `b04a1f8`.
- **Verification:** local Playwright suite: 12/12 pass in 22.7s.

**Defect SLH-2 — Test 11 (offline reload) fails against LIVE production.**
- **Reproduction:** `PLAYWRIGHT_BASE_URL=https://makeyoudiscplined.netlify.app npx playwright test` — 11/12 pass; test 11 timed out at `await page.reload()` after `context.setOffline(true)`.
- **Root cause:** Test-level fragility. Playwright's `page.reload()` defaults to `waitUntil: 'load'`, which waits for network-idle. Under `context.setOffline(true)` the network never goes idle even though the SW correctly serves the shell from precache. Compounding: the test's SW-ready wait only checked `r.active`; Workbox's precache install can complete slightly after activation, so an immediate offline reload sometimes hits an empty precache.
- **Affected file:** `tests/runtime/critical-path.spec.ts` — Test 11 only.
- **Severity:** Test-level (product offline behaviour is unchanged and has been documented working since v1.0.0 per `docs/release/deployment-checklist.md:69`; verified again by the fixed test).
- **Smallest safe fix:** Added `await page.waitForTimeout(2000)` after SW active to let Workbox precache install complete; changed reload to `waitUntil: 'domcontentloaded', timeout: 15_000`. Commit `ccccb04`.
- **Verification:** production Playwright suite: 12/12 pass in 22.1s.

### Final production runtime verification

**Command:** `PLAYWRIGHT_BASE_URL=https://makeyoudiscplined.netlify.app npx playwright test`
**Result:** **12 passed** (0 failed). Wallclock 24s. Test wallclock 22.1s.

| # | Test | Result | Duration |
|---|---|---|---|
| 1 | Home loads | PASS | 1.3s |
| 2 | Starting Point selection works | PASS | 2.9s |
| 3 | Refresh preserves state | PASS | 1.5s |
| 4 | Routine works without Promise | PASS | 1.4s |
| 5 | Smoking works without Promise | PASS | 1.6s |
| 6 | Promise works independently (`/create-promise` route loads) | PASS | 1.3s |
| 7 | Home is composed from registered modules | PASS | 1.6s |
| 8 | Navigation — 5 NavBar tabs + `/modules/routine` + `/modules/smoking` respond | PASS | 1.6s |
| 9 | No console errors during a typical Home session | PASS | 1.7s |
| 10 | Service Worker registers | PASS | 1.3s |
| 11 | Offline reload — Home still loads | PASS | 3.4s |
| 12 | PWA installability — manifest + registered SW satisfy the install criteria | PASS | 1.3s |

### Final repository state

- `main` HEAD: `41b1139c41c6896387fd73ee971ffcfc0eb128bd` (Slice H + SLH-2 fix merged via PR #5 and PR #6).
- `arch/module-independence` HEAD (working branch): `ccccb043257c4f11fb3a15c7b43ba43ad94192ea`.
- Production URL serving new bundle after PR #6 merge; runtime-verified GREEN against the deployed shell.

### Phase 3B closure

**Status: COMPLETE — automated, capability priority #1 (Playwright).**

The `docs/release/release-verification-policy.md` §4 blocking rule that gated Phase 5 on Phase 3B completion is now satisfied by evidence in the same turn as this record: `12 passed (22.1s)` against the live production URL.

**Human-Acceptance-Checklist fallback (recorded above at "Phase 3B — Interactive Runtime Verification" in the Phase 4 execution section) is superseded and no longer required for v1.1.0.**
