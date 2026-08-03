import type { LifeProgram } from './types';

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
