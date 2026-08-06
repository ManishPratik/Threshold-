import type { LifeProgram, ProgramSurface } from '@contract/program';

/**
 * Static Life Program registry. Programs register at module-load time
 * via side-effect imports at the app root. No dynamic loading, no
 * factories — the runtime is deliberately the smallest thing that
 * works.
 *
 * Re-registration of the same id overwrites the previous record. This
 * keeps HMR clean during development and makes tests trivially
 * isolable via `clearRegistry()`.
 */
const registry = new Map<string, LifeProgram>();

/** Register or replace a Life Program by id. */
export function registerProgram(program: LifeProgram): void {
  registry.set(program.id, program);
}

/** Look up a registered program by id. Undefined when absent. */
export function getProgram(id: string): LifeProgram | undefined {
  return registry.get(id);
}

/** Every registered program, in insertion order. */
export function listPrograms(): readonly LifeProgram[] {
  return Array.from(registry.values());
}

/** Remove all registered programs. Testing hook — do not call from app code. */
export function clearRegistry(): void {
  registry.clear();
}

/**
 * Normalise a program's surface list under the ADR 0009 §3 legacy
 * alias rule:
 *   - if `surfaces` exists → use it verbatim (no wrapping, no merge)
 *   - else if `todayWidget` exists → expose it as one ambient surface
 *   - else → empty list
 *
 * Rendering is never duplicated: a program that provides both fields
 * declares `surfaces` explicitly, so the legacy alias is skipped.
 * Engine consumers (later phase) call this instead of reading
 * `todayWidget` / `surfaces` directly.
 */
export function getProgramSurfaces(
  program: LifeProgram,
): readonly ProgramSurface[] {
  if (program.surfaces) return program.surfaces;
  if (program.todayWidget) {
    return [
      { slot: 'ambient', component: program.todayWidget, weight: 0 },
    ];
  }
  return [];
}
