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

import { createElement } from 'react';
import type {
  HomeSurface,
  HomeSurfaceLayer,
  LifeProgram,
} from '@contract/program';
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

/**
 * Slice E — Home multi-module composition.
 *
 * Enumerate the home surfaces contributed by every registered module,
 * in weight-descending order per layer. When `layer` is provided the
 * list is filtered to that layer only; otherwise all layers are
 * returned in a single flat list (still weight-descending per layer,
 * layer-order preserved as `identity → hero → supporting → quiet`).
 *
 * A module's `todayWidget` legacy entry (per ADR 0009 §3) is exposed
 * here as an auto-aliased `HomeSurface` at layer `supporting` with
 * weight `0`, so pre-existing programs (e.g., `src/programs/smoking/manifest.ts:5`
 * which declares only `todayWidget`) contribute to Home through the
 * same mechanism as modules that declare `homeSurfaces` explicitly.
 * Every module receives identical treatment; Home does not privilege
 * any module id.
 */
export function listHomeSurfaces(
  layer?: HomeSurfaceLayer,
): readonly HomeSurface[] {
  const modules = listModules();
  const layerOrder: readonly HomeSurfaceLayer[] = [
    'identity',
    'hero',
    'supporting',
    'quiet',
  ];
  const surfaces: HomeSurface[] = [];
  for (const mod of modules) {
    for (const s of moduleHomeSurfaces(mod)) {
      if (layer === undefined || s.layer === layer) {
        surfaces.push(s);
      }
    }
  }
  return surfaces.sort((a, b) => {
    if (a.layer !== b.layer) {
      return layerOrder.indexOf(a.layer) - layerOrder.indexOf(b.layer);
    }
    return b.weight - a.weight;
  });
}

function moduleHomeSurfaces(mod: LifeProgram): readonly HomeSurface[] {
  const explicit = mod.homeSurfaces ?? [];
  if (explicit.length > 0) return explicit;
  if (mod.todayWidget) {
    // Wrap the legacy `todayWidget` (typed against `TodayWidgetProps`)
    // in an adapter that consumes `HomeSurfaceProps` and calls the
    // widget with no props. `TodayWidgetProps` is fully optional per
    // Slice A so `<LegacyWidget />` compiles cleanly.
    const LegacyWidget = mod.todayWidget;
    function LegacyTodayWidgetHomeSurface() {
      return createElement(LegacyWidget, {});
    }
    return [
      {
        layer: 'supporting',
        component: LegacyTodayWidgetHomeSurface,
        weight: 0,
      },
    ];
  }
  return [];
}
