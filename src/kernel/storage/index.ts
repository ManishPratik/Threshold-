// @kernel/storage — E3 scoped storage capability.
//
// V2 Kernel Public API for module-scoped persistence. Modules request
// a namespaced store via `scopedSettingsStore(moduleId)` and receive
// a small `get`/`put`/`delete`/`listKeys` surface that writes into the
// reused `settings` v1 IndexedDB store per ADR 0009 §6
// (docs/adr/0009-daily-flow-engine.md:56-58). Every record id and key
// is namespaced by module id so co-existing modules cannot collide.
//
// ─────────────────────────────────────────────────────────────
// Architectural invariant enforced across every module in V2:
//   Modules may import only:
//     - @kernel/*
//     - @contract/*
//     - @shared/*
//   Modules must not import:
//     - other modules
//     - kernel internals
// ─────────────────────────────────────────────────────────────

export { scopedSettingsStore } from './scopedSettingsStore';
export type { ScopedSettingsStore } from './scopedSettingsStore';
