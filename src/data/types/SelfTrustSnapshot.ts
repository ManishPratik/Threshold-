import type { ISODate } from '@shared/lib/date';
import type { BaseEntity } from './common';

/**
 * A per-day projection of the Self-Trust score. Reproducible from PromiseEvent history —
 * never treated as source of truth. Kept in its own store so Analytics reads are fast.
 */
export interface SelfTrustSnapshot extends BaseEntity {
  date: ISODate;
  score: number;
  deltaFromYesterday: number;
  inputs: Record<string, number>;
  formulaVersion: number;
}
