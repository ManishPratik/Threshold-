import type { Mission } from '@data/types/Mission';
import type { ISODate } from '@shared/lib/date';

export interface MissionProgress {
  /** 1-based day number, clamped to [1, totalDays]. */
  currentDay: number;
  /** Total mission length in days (inclusive of start and end). Null if endDate not set. */
  totalDays: number | null;
  /** Progress as 0..1. Null if totalDays is null. */
  ratio: number | null;
  /**
   * False when today's date is still before `mission.startDate` — i.e. the
   * mission was fair-started on a future calendar day by the late-start
   * cutoff rule. UI surfaces should render a "Begins {startDate}" affordance
   * instead of "Day 1 of N" when this is false, so the day counter does not
   * tick before the promise actually begins.
   */
  hasStarted: boolean;
}

function daysBetween(a: ISODate, b: ISODate): number {
  const [ay = 0, am = 0, ad = 0] = a.split('-').map(Number);
  const [by = 0, bm = 0, bd = 0] = b.split('-').map(Number);
  const utcA = Date.UTC(ay, am - 1, ad);
  const utcB = Date.UTC(by, bm - 1, bd);
  return Math.round((utcB - utcA) / 86_400_000);
}

export function getMissionProgress(mission: Mission, today: ISODate): MissionProgress {
  const rawElapsed = daysBetween(mission.startDate, today);
  const hasStarted = rawElapsed >= 0;
  const elapsed = Math.max(0, rawElapsed);
  const currentDay = elapsed + 1;

  if (!mission.endDate) {
    return { currentDay, totalDays: null, ratio: null, hasStarted };
  }

  const totalDays = daysBetween(mission.startDate, mission.endDate) + 1;
  const clampedDay = Math.min(Math.max(currentDay, 1), totalDays);
  return {
    currentDay: clampedDay,
    totalDays,
    ratio: clampedDay / totalDays,
    hasStarted,
  };
}
