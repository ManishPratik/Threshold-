// @kernel/registry — E1 module registry capability.
//
// V2 Kernel Public API for module registration and lookup. Every
// module registers itself at boot via `registerModule`; kernel
// surfaces (layout host, navigation host, analytics reader) discover
// modules through `listModules` and their contributed slot surfaces
// through `getModuleSurfaces`.
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
//
// The V1 function names (registerProgram / getProgram / listPrograms
// / getProgramSurfaces at src/features/programs/registry.ts:16-57)
// remain in their existing home for backward compatibility with
// pre-V2 imports (e.g., src/programs/smoking/manifest.ts:1). This
// namespace exposes only V2 names. V2 code paths MUST consume through
// this namespace.

import {
  registerProgram as _registerProgram,
  getProgram as _getProgram,
  listPrograms as _listPrograms,
  getProgramSurfaces as _getProgramSurfaces,
} from '@features/programs';

/**
 * Register a module with the kernel. Idempotent by manifest.id —
 * re-registration replaces the existing record while preserving
 * insertion order.
 */
export const registerModule = _registerProgram;

/**
 * Look up a registered module by id. Returns `undefined` when the id
 * is not registered.
 */
export const getModule = _getProgram;

/** Every registered module, in insertion order. */
export const listModules = _listPrograms;

/**
 * Normalise a module's contributed surface list under the ADR 0009 §3
 * legacy alias rule: an explicit `surfaces` array wins; otherwise a
 * legacy `todayWidget` is surfaced as one ambient entry; otherwise
 * the empty list.
 */
export const getModuleSurfaces = _getProgramSurfaces;
