# ADR 0008 — Self-Trust measures promise integrity, not productivity

- **Status:** Accepted
- **Date:** 2026-07-28
- **Supersedes:** the "block-weight = f(durationMinutes)" element of the Milestone-4 V2 design review only. All other V2 directions from that review remain valid.

## Context

Self-Trust is the product's identity metric. Its purpose is stated in one sentence:

> "The consistency with which I keep promises to myself."

During Milestone 4 a V2 evolution direction was proposed that would weight each block by its duration (a 90-minute focus block would earn more points than a 15-minute ritual). That direction quietly reframes Self-Trust as a proxy for output — the more you commit to, the more you earn. If shipped it would push the product toward optimising *how much you did* rather than *whether you honoured what you said*.

That drift needs a hard stop. This ADR locks the founding principle so future formula revisions cannot re-open it through incrementalism.

## Decision

Every Self-Trust strategy — V1, V2, and beyond — must comply with the following principles:

1. **Equal promises have equal psychological weight.** A promise kept is one unit of trust regardless of the block that carried it.
2. **Duration alone does not increase trust.** A 10-minute meditation kept and a 90-minute focus block kept move Self-Trust by the same base amount. The commitment is the unit, not the workload.
3. **Difficulty alone does not increase trust.** The engine has no visibility into how hard a promise was to keep and must not attempt to infer it (from duration, type, time-of-day, or any other proxy).
4. **Self-Trust is earned by consistency.** Multipliers, streaks, coverage bonuses, and time-window normalisations are allowed insofar as they reward *keeping the pattern of showing up*.
5. **Productivity metrics belong elsewhere.** Output, hours worked, efficiency, throughput, deep-work minutes — all valid metrics, none of them Self-Trust. If those become product-worthy, they ship under a different name in a different surface.

Any future strategy that assigns different point values to two kept promises purely on the basis of duration, difficulty, or workload requires an explicit ADR that supersedes this one. Reviewers must treat that as a product-identity change, not a scoring tune.

## Consequences

- **The Milestone-4 V2 direction "Per-block score = 1 + floor(durationMinutes / 30)" is rejected.** V2 must find another way to add resolution to the formula (streaks, coverage, recovery-day weighting, normalisation) that does not weight blocks by size.
- **Routine design incentives stay honest.** Users cannot game Self-Trust by inflating durations of blocks they intend to keep anyway; the number would not move.
- **Reviewability improves.** A single-file check (this ADR) tells anyone whether a proposed formula is in-principle acceptable before code review.
- **New Recovery Mode PromiseEvents (this milestone) must respect the principle.** Recovery-related events must not carry duration-derived multipliers.

## Alternatives considered

- **Encoding the principle only in code comments on `V1_CONSTANTS`**: rejected. Comments are advisory; the next contributor with a strong opinion about weighting could rewrite them in one PR without triggering review scrutiny. An ADR forces the conversation to be explicit.
- **Adding a `pointsPerBlock` field to `RoutineBlock`** for user-declared importance: rejected as a corollary. Same drift by a different route — the product's identity metric becomes a user-declared scoring toy.
- **Treating this as an implicit norm** without an ADR: rejected on the grounds that the founder explicitly asked for a permanent record.
