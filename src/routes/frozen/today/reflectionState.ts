import type { Declaration } from '@data/types/frozen/Declaration';

/** 18:00 local device time per Engineering Foundations §8. */
export const EVENING_REFLECTION_HOUR = 18;

/** 04:00 local device time per Engineering Foundations §8. */
export const LOGICAL_DAY_BOUNDARY_HOUR = 4;

export type ReflectionInvitationState = 'pre-cutoff' | 'awaiting' | 'declared';

/**
 * Pure selector for the Today Reflection invitation state. Three states
 * per the frozen Today spec.
 *
 * - `declared`: today's declaration already exists.
 * - `awaiting`: no declaration yet AND wall-clock is inside the ritual
 *   window [EVENING_REFLECTION_HOUR, 24) ∪ [0, LOGICAL_DAY_BOUNDARY_HOUR).
 * - `pre-cutoff`: no declaration yet AND wall-clock is before the ritual
 *   window (LOGICAL_DAY_BOUNDARY_HOUR <= hour < EVENING_REFLECTION_HOUR).
 */
export function selectReflectionState(input: {
  currentHour: number;
  todayDeclaration: Declaration | null | undefined;
}): ReflectionInvitationState {
  if (input.todayDeclaration) return 'declared';
  const inRitualWindow =
    input.currentHour >= EVENING_REFLECTION_HOUR ||
    input.currentHour < LOGICAL_DAY_BOUNDARY_HOUR;
  return inRitualWindow ? 'awaiting' : 'pre-cutoff';
}
