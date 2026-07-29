# ADR 0004 — No global state store in V1

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Personal OS is a single-user PWA with four top-level routes. Persistent state lives in IndexedDB. UI state is local to each route or component. Introducing a global store (Redux, Zustand, Recoil, Jotai) at foundation time would add ceremony, indirection, and boilerplate for state that has no consumers outside the component that owns it.

## Decision

- **No Redux, no Zustand, no Recoil, no Jotai.**
- UI state is held with `useState` / `useReducer`, colocated with the component that owns it.
- URL state (selected date, open modal, active tab) lives in the router (React Router 6), not a store.
- Server/DB state is accessed via the repository layer directly. Adding a query cache (TanStack Query or a slim custom equivalent) is permitted **only when a repeat-read hot path emerges** — not proactively.
- If a genuine cross-route shared state need appears (e.g. a global command palette), the smallest possible primitive is chosen (React Context for tree-scoped state; a store library only if the state has non-trivial reducer logic or requires devtools).

## Consequences

- Fewer dependencies, smaller bundle, less boilerplate.
- Refactoring a component's state does not require touching a global store.
- The barrier to adding a global store is high (must justify with a concrete use case), preventing early over-engineering.

## Alternatives considered

- **Redux Toolkit from day one**: rejected — no evidence of shared complex state; DevTools alone are not sufficient justification.
- **Zustand from day one**: rejected — even the "lightweight" option adds indirection without a use case; deferrable.
