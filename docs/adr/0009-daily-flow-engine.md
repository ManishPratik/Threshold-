# ADR 0009 — Daily Flow Engine, Program Contract, and Today Layout Ownership

- **Status:** Accepted
- **Date:** 2026-08-03

## Context

Personal OS ships a Program Runtime (single `todayWidget` per program) and a flat Routine (RoutineBlock = `id`, `name`, `durationMinutes`, `type`). Smoking has grown into a 450-line composite widget that owns its own Today presentation and taper logic in local render code. There is no shared intervention primitive, no ack log, no priority queue, no phase concept, no anchor grouping, and no daily fatigue cap.

Three problems block any second Life Program landing on the same foundation:

1. **Programs mount arbitrary React into Today.** `TodayProgramWidgets` iterates enabled ids and renders each program's widget with no size, no ordering, and no error-boundary contract. Two programs enabled at once compete for layout with no rules.
2. **Behavioural taper is implicit.** Smoking's morning/afternoon/evening pledge cadence is coded into render trees — there is no way to express "fire this pledge only during peak withdrawal" or to reduce intensity as clean-hours grow past PEAK_END_HOURS. Every future program would have to reinvent its own scheduler.
3. **Routine is context-free.** Blocks are a flat ordered list with no morning/midday/evening/night grouping and no importance signal. The prior calendar-style clock scheduling was removed in the Frozen migration and must not return — clocks fail for shift workers, parents, students, and travellers.

The behavioural product principle is: **the app removes decisions, never adds them.** Today's single job is answering "what should I do right now?" — never becoming a dashboard.

## Decision

### 1. Split the concerns

- **Kernel (unchanged):** Promise, Declaration, Routine, BlockCompletion, Self-Trust, Reflection, Recovery remain the source of truth for what happened.
- **Daily Flow Engine (new):** a generic scheduler that owns phase resolution, intervention queueing, ack logging, layout, and slot placement. Program-agnostic.
- **Programs (extended):** each Life Program is a behavioural protocol. Programs own their stage machines, taper curves, relapse handling, and `shouldFire()` predicates. The engine never learns domain logic.

### 2. Four fixed anchor phases with future custom extension

Anchor values are `'morning' | 'midday' | 'evening' | 'night'` in V1. The Block field is typed as an open string so V2 can extend to `` `custom:${slug}` `` without a schema migration or DB_VERSION bump. Anchors are contexts, not clock windows. Time hints are display-only, never persisted per-Block, and never surface as time pickers in the routine editor.

### 3. Programs contribute two orthogonal things

- **`interventions: Intervention[]`** — data-only descriptors the engine renders: `id`, `programId`, `title`, `body`, `phase`, `priority` (`'p1'|'p2'|'p3'`), `ackKind` (`'per-day'|'per-arc'|'per-milestone'|'passive'`), `shouldFire(ctx): boolean`. Engine owns rendering, ordering, ack.
- **`surfaces: ProgramSurface[]`** — React components placed in engine-defined slots: `slot: 'ambient'|'hero'|'overlay'`, `component`, `weight`. Programs own their content; the engine controls placement, dimensions, error boundaries, lifecycle.

Programs may still author sophisticated React (Chamber visualisation, Peak-withdrawal banner, Hurdles chain, Celebrations). Programs must never inject arbitrary layout into Today, never choose position, and never touch the ack log or completion writes.

Legacy `todayWidget` continues to work as an alias for one `slot: 'ambient'` surface — Smoking's existing 450-line composite renders unchanged during migration.

### 4. Fatigue caps and priority tiers

Priority tiers (user-facing labels chosen by the owner; encoded in the type layer as `p1`, `p2`, `p3` where p1 is highest):

- **p1** — phase-slot cap 3/day; overflow queues to next phase or demotes to p3 per program's `overflowBehaviour`.
- **p2** — phase-slot cap 3/day; overflow same rule.
- **p3** — uncapped in data, collapsed below the fold in UI, auto-hidden on phase-transition boundary.
- **Aggregate above-fold cap: 6 per phase.** If p1 uses 3 and p2 supplies 4, one p2 demotes to p3.

These caps come from evidence: per-app health-behaviour engagement drops sharply past 5 daily touchpoints (Baumel et al, JMIR 2019; Pielot & Church, MobileHCI 2014). With multiple programs enabled, the aggregate ceiling prevents adherence collapse.

### 5. Slot cardinality

- `hero` — one active at a time; program with the highest-weight enabled surface wins.
- `ambient` — unbounded vertical stack, rendered below the intervention queue and above the routine.
- `overlay` — one active at a time; late-arriving overlays queue behind the current one.

### 6. Ack log

One row per day in the reused legacy `settings` v1 store, key `dailyFlow-ack-<YYYY-MM-DD>`, value `{ acked: string[], dismissed: string[] }`. Boot-time sweep purges rows older than 30 days. No new IDB store. No DB_VERSION bump. This reuses the same store the Smoking program already writes to, per the pattern already validated.

### 7. Program feedback signal (read-only)

Engine exposes `getInterventionAckRate(interventionId, windowDays = 7): Promise<number>` returning 0-1. Programs use this inside their own `shouldFire()` to self-taper. The engine never auto-tunes intervention priority or frequency on the program's behalf — that logic belongs to each program.

### 8. Today layout ownership

Today's render tree is engine-owned:

```
<Greeting />                    ← existing kernel
<PromiseAnchor />               ← existing kernel
<SelfTrustLine />               ← existing kernel
<HeroCard />                    ← engine, hero-slot surface if any
<InterventionQueue />           ← engine, p1 → p2 → p3, capped
<AmbientStrip />                ← engine, ambient surfaces (Chamber, Peak, Vitals)
<RoutineByAnchor />             ← engine, blocks grouped by anchor
<ReflectionInvitation />        ← existing kernel evening trigger
<OverlayHost />                 ← engine, overlay-slot surface if any
```

Today never shows more than 1 hero + 6 interventions above the fold + N ambient below fold + routine by anchor + reflection. "What should I do right now?" is always the top item of the intervention queue.

### 9. Routine editor stays clock-free

No time picker in the block editor. Time bias, if it ever ships, lives on the Anchor as `expectedTriggerHint: 'HH:MM' | null` — one hint per anchor, not per block. The prior calendar-style scheduling was deleted in commit `a0c8e86` (Frozen migration) and does not return.

### 10. Rejected: separate Behaviour Engine layer

A middle "Behaviour Engine" between Program and Routine would need to know each program's semantics (Smoking's clean-hours taper, Weight-Loss's meal-time proximity, Meditation's session-cadence). That defeats program-agnosticism. Behaviour lives inside each program as `shouldFire()` predicates that close over program-derived state. The engine is a scheduler + queue, not a behaviour library.

## Consequences

- Smoking migrates in one manifest change plus a surface split: 4 `interventions` (morning/midday/evening pledge + nightly Reflection cue, each with `shouldFire` closing over clean-hours + ack-rate) and 2 `surfaces` (ambient = SmokingScienceWidget, overlay = Celebrations). No visual regression on Today.
- Future programs (Weight Loss, Public Speaking, Meditation, Reading, Fitness) declare `interventions[]` + optional `surfaces[]` and inherit the engine's queue, caps, ack log, and layout for free.
- Adherence stays bounded: multi-program enablement cannot exceed 6 above-fold interventions per phase. Programs that want more must express taper via `shouldFire`, not raw quantity.
- Programs cannot crash Today: every `shouldFire()` and every surface component wraps in an engine-owned error boundary and drops silently on failure.
- Cross-program isolation preserved: full-relapse in program A touches only A's state; program B's interventions keep firing. This mirrors the store-scoping already in place.
- Rollback path: every new field on `Block` and every new manifest field is optional. Reverting the engine code leaves existing users on a Today identical to the pre-engine layout.
- The engine ships without behaviour-pattern anchors ("after coffee", "after gym"), without a calendar bridge, without cross-program semantic dedupe, without shift-worker phase overrides. All deferred behind explicit owner unlocks.

## Alternatives considered

- **Separate Behaviour Engine layer.** Rejected: would need per-program semantics; defeats program-agnostic engine.
- **Full ban on program-authored React (data-only intents).** Rejected: forces the engine to grow a fixed catalog of visualisation primitives to cover Chamber, Peak banner, Hurdles chain, Craving SOS overlay; long-term constraint on future programs is worse than the current slot-ownership rule.
- **Restore per-Block clock scheduling** (the pre-Frozen `expectedStart` field). Rejected: clock-based routines fail for shift workers, parents, travellers, students; the prior audit confirmed the field was deliberately deleted in `a0c8e86` and the block editor has no time input on disk.
- **Automatic cross-program dedupe.** Rejected for V1: semantic dedupe across programs (Smoking "Read Pledge" vs Weight-Loss "Read Commitment") is a domain call, not an engine call. User-facing "hide" per intervention is the escape valve.
- **Silent adaptive learning of user patterns.** Rejected for V1: dark-pattern territory. Engine exposes `getInterventionAckRate` as read-only feedback; programs decide what to do with the signal. Any future auto-tune ships behind an explicit user-consented setting.
- **Bump DB_VERSION for new stores.** Rejected: every new field is optional; reusing the existing `settings` v1 store for the ack log avoids the migration risk entirely.
- **Multiple ADRs** (one per sub-rule: anchors, tiers, slots, ack log). Rejected: the sub-rules are internally coherent and must land together; splitting them across ADRs would allow partial adoption and defeat the "one Daily Flow contract" principle.
