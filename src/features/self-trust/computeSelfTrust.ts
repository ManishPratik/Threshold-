import type { Declaration } from '@data/types/frozen/Declaration';
import type { BlockCompletion } from '@data/types/frozen/BlockCompletion';
import type { Routine } from '@data/types/frozen/Routine';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import type { ISODate } from '@shared/lib/date';
import { addDays } from '@shared/lib/date';
import { V1_CONSTANTS } from './constants';

/**
 * Derived Self-Trust score. Pure function, no I/O.
 *
 * Adapted from the V1SelfTrustStrategy at tag v1.0.0 (self-trust folder).
 * That strategy consumed the PromiseEvent append-only log (kept / broken /
 * deferred kinds) plus a DayLog carrying skipped and completed block-ids.
 * The Frozen data model has none of those stores. This port derives the
 * same-shaped result from:
 *
 *   - Declaration (kept / broken per (promiseId, date))
 *   - BlockCompletion (per (promiseId, date, blockId))
 *   - Routine (block count on the active routine)
 *   - PromiseRecord (startDate anchor)
 *
 * Per ADR 0008 at personal-os/docs/adr/0008-self-trust-integrity-not-productivity.md
 * lines 19-27, the formula obeys:
 *   - Equal promises have equal psychological weight.
 *   - Duration alone does not increase trust.
 *   - Difficulty alone does not increase trust.
 *   - Self-Trust is earned by consistency.
 *
 * Per-day scoring rule:
 *   Declaration verdict 'kept'                      → +pointsPerKept
 *   Declaration verdict 'broken'                    → +pointsPerBroken (negative)
 *   BlockCompletion count >= totalScheduledBlocks   → +fullDayBonus
 *   Cumulative clamped at scoreFloor (never negative overall).
 *
 * The daysScored counter increments only on days where a Declaration
 * exists — days the user never opened Reflection do not participate.
 */
export interface SelfTrustInput {
  promise: PromiseRecord;
  routine: Routine | null;
  declarations: readonly Declaration[];
  blockCompletions: readonly BlockCompletion[];
  today: ISODate;
}

export interface SelfTrustResult {
  score: number;
  daysScored: number;
  keptCount: number;
  brokenCount: number;
  fullDaysCount: number;
}

export function computeSelfTrust(input: SelfTrustInput): SelfTrustResult {
  const { promise, routine, declarations, blockCompletions, today } = input;
  const totalScheduledBlocks = routine?.blocks.length ?? 0;

  const declByDate = new Map<ISODate, Declaration>();
  for (const d of declarations) {
    if (d.promiseId === promise.id) declByDate.set(d.date, d);
  }

  const completionsByDate = new Map<ISODate, number>();
  for (const bc of blockCompletions) {
    if (bc.promiseId !== promise.id) continue;
    completionsByDate.set(bc.date, (completionsByDate.get(bc.date) ?? 0) + 1);
  }

  let cumulative = 0;
  let daysScored = 0;
  let keptCount = 0;
  let brokenCount = 0;
  let fullDaysCount = 0;

  let cursor = promise.startDate;
  // Walk logical days from startDate through today inclusive. Callers pass
  // `today` in the same YYYY-MM-DD ISODate shape produced by
  // currentLogicalDate() in personal-os/src/shared/lib/dayBoundary.ts.
  while (cursor <= today) {
    const decl = declByDate.get(cursor);
    let dailyDelta = 0;

    if (decl?.verdict === 'kept') {
      dailyDelta += V1_CONSTANTS.pointsPerKept;
      keptCount += 1;
    } else if (decl?.verdict === 'broken') {
      dailyDelta += V1_CONSTANTS.pointsPerBroken;
      brokenCount += 1;
    }

    const completed = completionsByDate.get(cursor) ?? 0;
    if (totalScheduledBlocks > 0 && completed >= totalScheduledBlocks) {
      dailyDelta += V1_CONSTANTS.fullDayBonus;
      fullDaysCount += 1;
    }

    if (decl) daysScored += 1;
    cumulative = Math.max(V1_CONSTANTS.scoreFloor, cumulative + dailyDelta);

    if (cursor === today) break;
    cursor = addDays(cursor, 1);
  }

  return {
    score: cumulative,
    daysScored,
    keptCount,
    brokenCount,
    fullDaysCount,
  };
}
