# V1 Deferred Roadmap

*Consolidated from every milestone report. Everything below is deliberately out of the v1.0.0 scope. Nothing here is a defect. Prioritise post-launch based on observed user behaviour, not on this list's order.*

## Data model / Schema

- Per-DayLog snapshot of scheduled block ids (fixes historical Self-Trust bonus attribution after routine edits). Ships alongside V2 Self-Trust.
- Cross-store transaction primitive (would unify the sequenced writes in the Today Complete flow, the Recovery sweep, and any future bulk import operations). Deferred: two call sites do not yet establish the pattern.
- Structural repository interfaces per method group (replace `typeof missionRepository` shapes on service deps types). Cosmetic; deferred.
- `Mission.status = 'draft'` is defined but never used. Remove or wire when a real draft flow arrives.

## Self-Trust (V2 design captured in Milestone-4 Design Review + ADR 0008)

- Explicit break-commitment UI to produce `kind: 'broken'` PromiseEvents.
- Skip cost (non-zero) to close the "skip everything" loophole while remaining calm.
- Streak multiplier on the day's positive delta.
- Recovery-day scoring at reduced weight (both positive and negative sides).
- Score normalisation to a 0–100 scale.
- Boot-time strategy-version rebuild trigger when the persisted `formulaVersion` differs from the current strategy.
- Snapshot compaction / retention (daily granularity for 90 days, then weekly rollups).
- **Explicitly rejected under ADR 0008:** weighting blocks by duration.

## Recovery

- Timestamp sweep events at yesterday's end-of-day — shipped in the architectural hardening milestone.
- Backfill absent DayLogs for gaps longer than one day.
- First-class `RecoveryEntered` event kind for Analytics counts.
- Adaptive Recovery Card copy after N consecutive missed days — rejected as coaching drift.

## Today

- Split `useRoutineToday` before it accretes more concerns.
- Per-block skip UI (data model already supports `skippedBlockIds`).
- Recovery Card dismissal state (persist within a day).

## Knowledge Vault

- Chip-based tag input with autocomplete against existing tags.
- Search across title / body / tags.
- Filter by tag chips.
- Rich text / markdown rendering in bodies — **rejected**: not the product's identity.
- Empty-Trash bulk action.

## Analytics

- Sparkline of Self-Trust over the window.
- User-selectable window (7 / 30 / 90 days).
- Past-reviews list surfaced on the Analytics route.
- Move `NoteRepository.getActive` filtering into the service layer alongside Trash work.

## Reviews

- Sub-routes for reviews (analytics/reviews/weekly, /monthly).
- Distinct "Save draft" vs "Submit review" actions in the editor.
- Reflected-today gating on the Daily card — **rejected** as coupling + paternalism.
- Custom user-defined prompts — out of scope for a calm reflection surface.

## Settings

- Configurable day-start hour (documented as future work in src/shared/lib/dayBoundary.ts).
- Notifications settings (needs notification infrastructure first).
- "Last exported" timestamp on the Backup section.
- User-facing "Rebuild Self-Trust snapshots" action (mechanism exists; no consumer yet).
- Selective per-mission / per-routine archive UI.

## Import / Export

- Cross-version import migration (needs a `BACKUP_SCHEMA_VERSION` bump first).
- Merge-mode import (add-only, dedupe by id) alongside replace-all.
- Encryption / password protection — **explicitly out of V1**.
- Compression — **explicitly out of V1**.

## PWA / Deployment

- iOS Add-to-Home-Screen PNG icon matrix (manifest currently ships SVG only).
- Persistent update-prompt dismissal for the current waiting worker.
- Periodic update polling in long-lived tabs.
- "What's new" changelog surface tied to the update flow.
- Cross-tab update coordination.

## Testing

- fake-indexeddb-backed migration tests for v1→v2 (harness ready; no v2 exists).
- Component render tests for the flows currently covered by visual review only (Mission Create, Routine Builder, Note Editor, Review Editor, Recovery Card, Update Prompt, Backup Section).
- Extend TimeProvider injection to the mission, routine, self-trust, knowledge, reviews, and analytics services (currently only recovery injects it).

## Multi-user / Cloud

- Any form of cloud sync — **explicitly out of V1**.
- User identity / account system — **explicitly out of V1**.
- Automatic backups, scheduled backups, remote backups — **explicitly out of V1**.
- Second-device policy (currently: second device produces an independent instance).

## Product infrastructure

- Product telemetry (opt-in usage analytics).
- Crash reporting (Sentry or equivalent).
- ESLint feature-boundary rule already covers routes; consider stricter (allow-list of cross-feature edges) if the pattern is ever violated intentionally.
- Split-out shared/hooks and shared/icons folders (currently empty placeholders — cosmetic).
