import type { ISODate, ISODateTime } from '@shared/lib/date';

/**
 * A single completion of a routine block on a specific logical day.
 * One record per (promiseId, date, blockId). Idempotent write: re-tapping
 * a completed block on the same day is a no-op update, not a duplicate.
 *
 * Completion is execution logging only. It writes here and touches nothing
 * on the Promise verdict — the Broken Promise rule is unaffected by any
 * value in this store.
 */
export interface BlockCompletion {
  promiseId: string;
  date: ISODate;
  blockId: string;
  completedAt: ISODateTime;
  schemaVersion: number;
}
