import { getProgramSurfaces } from '@features/programs';
import type {
  LifeProgram,
  ProgramSurface,
  SurfaceSlot,
} from '@contract/program';

/**
 * Collect every registered program's surfaces for one slot.
 *
 * Legacy programs that expose only `todayWidget` are surfaced as one
 * ambient entry via `getProgramSurfaces` — see ADR 0009 §3 legacy
 * alias. That means calling `listSurfaces(programs, 'ambient')`
 * returns both explicit ambient surfaces and legacy Today widgets in
 * insertion order.
 *
 * Sort order: programs in the input order, and within a program the
 * surfaces are returned in the order the program declared them. Slot
 * cardinality (ADR 0009 §5) is not enforced here — the Today render
 * (later phase) picks the highest-weight hero surface and queues
 * overlays. This function is a pure filter.
 */
export function listSurfaces(
  programs: readonly LifeProgram[],
  slot: SurfaceSlot,
): readonly ProgramSurface[] {
  const out: ProgramSurface[] = [];
  for (const program of programs) {
    const surfaces = getProgramSurfaces(program);
    for (const s of surfaces) {
      if (s.slot === slot) out.push(s);
    }
  }
  return out;
}
