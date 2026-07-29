# ADR 0007 — Mission lifecycle rules live in a domain service, not on the repository

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Milestone 2 introduces multi-aggregate lifecycle rules that repositories cannot express in isolation:

- Activating a new Mission must, in one logical operation: persist the Mission, purge every bootstrap record (Mission + Routine + DayLog), and ensure today's DayLog exists.
- Post-activation edits are restricted to `notes` and `reward`. Every other field is locked. Attempting to change a locked field is a domain error — not a UI concern.
- Only one active Mission may exist at a time. Activating a new one while a non-bootstrap active Mission exists is a domain error.

Placing this logic on `MissionRepository.put()` would either (a) make the repository reach into other stores, breaking the single-aggregate boundary, or (b) require every caller to remember the rules — the exact fragility that led to bugs.

## Decision

- **Multi-aggregate lifecycle rules live in feature-level *service* modules**, one per bounded context. For Missions this is `src/features/mission-contract/missionContractService.ts`. Services are plain async functions, not classes.
- **Repositories stay single-aggregate and CRUD-shaped.** They persist and query one store. They enforce store-local invariants only (e.g. `PromiseEventRepository.append()` rejects duplicate ids).
- **UI never calls a repository write path for lifecycle events.** UI calls the service; the service calls the repositories.
- **Services are stateless plain functions**, tested by mocking the repositories with `vi.mock`. No class hierarchy, no factory, no DI container.

## Consequences

- The Mission mutability rule ("only notes + reward after activation") has one enforcement point — bypassing it means editing the service, which is visible in code review.
- Bootstrap purge is atomic from the UI's perspective: activation either succeeds fully (new Mission + no bootstrap + DayLog present) or the caller sees an error and the DB is untouched.
- Adding a second bounded context (Routine editor, later) follows the same shape — one service file per feature area, repositories underneath.
- Services can compose repositories that live under different stores without giving repositories cross-store knowledge.

## Alternatives considered

- **Fat repositories** (`MissionRepository.activateNew()` that also touches routines + dayLogs): rejected — breaks single-aggregate boundary; `MissionRepository` starts depending on every other store.
- **Event bus** (activation emits `MissionActivated`, handlers purge bootstrap): rejected — adds indirection for a synchronous same-transaction operation; harder to reason about ordering and failure.
- **Class-based service with dependency injection**: rejected as premature; plain functions + `vi.mock` cover the current test needs with less scaffolding.
- **Encoding rules in TypeScript types alone** (branded types, sealed unions): rejected — would prevent some misuse at compile time but cannot express "only when active".
