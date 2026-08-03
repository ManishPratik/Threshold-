import type {
  Intervention,
  InterventionContext,
  LifeProgram,
} from '@features/programs';
import {
  MAX_ABOVE_FOLD,
  P1_PER_PHASE,
  P2_PER_PHASE,
} from './constants';

/**
 * Produce the priority-ordered intervention queue for the current
 * phase. ADR 0009 §3, §4.
 *
 * Behaviour:
 *
 *   1. Walk every program's `interventions`. Programs without an
 *      `interventions` array contribute nothing.
 *   2. Filter to interventions whose `phase` equals `context.phase`.
 *   3. Evaluate each intervention's `shouldFire(context)`. If it
 *      throws, the intervention is silently discarded and the walk
 *      continues — one program's bug never blocks another program.
 *      If it returns a falsy value, the intervention is skipped.
 *   4. Group survivors by priority.
 *   5. Cap p1 at `P1_PER_PHASE`. Overflow demotes to p3 (ADR 0009 §4).
 *   6. Cap p2 at `P2_PER_PHASE`. Overflow demotes to p3.
 *   7. Enforce `MAX_ABOVE_FOLD` on the combined p1+p2 slice. Excess
 *      p2 rows demote to p3 (p1 is preserved first).
 *   8. Concatenate p1 → p2 → p3 in insertion order within each tier.
 *
 * The output is a fresh array; input arrays are not mutated. `p3` is
 * returned in full — the engine's Today render (later phase) is
 * responsible for below-the-fold collapsing.
 */
export function listInterventions(
  programs: readonly LifeProgram[],
  context: InterventionContext,
): readonly Intervention[] {
  const p1: Intervention[] = [];
  const p2: Intervention[] = [];
  const p3: Intervention[] = [];

  for (const program of programs) {
    const list = program.interventions;
    if (!list || list.length === 0) continue;
    for (const iv of list) {
      if (iv.phase !== context.phase) continue;
      let shouldFire = false;
      try {
        shouldFire = iv.shouldFire(context) === true;
      } catch {
        // ADR 0009: engine drops silently on program failure.
        continue;
      }
      if (!shouldFire) continue;
      if (iv.priority === 'p1') p1.push(iv);
      else if (iv.priority === 'p2') p2.push(iv);
      else p3.push(iv);
    }
  }

  const keptP1 = p1.slice(0, P1_PER_PHASE);
  const demotedP1 = p1.slice(P1_PER_PHASE);

  const capForP2 = Math.max(0, Math.min(P2_PER_PHASE, MAX_ABOVE_FOLD - keptP1.length));
  const keptP2 = p2.slice(0, capForP2);
  const demotedP2 = p2.slice(capForP2);

  return [...keptP1, ...keptP2, ...demotedP1, ...demotedP2, ...p3];
}
