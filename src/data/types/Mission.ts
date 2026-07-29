import type { ISODate } from '@shared/lib/date';
import type { BaseEntity } from './common';

export type MissionStatus = 'draft' | 'active' | 'completed' | 'archived';

/**
 * A Mission Contract.
 * Locked rule: once status transitions to 'active', only `notes` and `reward` may be edited.
 * Any other change requires archiving this contract and creating a new one.
 * The repository layer enforces this invariant.
 */
export interface Mission extends BaseEntity {
  title: string;
  statement: string;
  startDate: ISODate;
  endDate: ISODate | null;
  status: MissionStatus;
  targetMetrics: Record<string, number>;
  notes: string;
  reward: string;
  activatedAt: string | null;
}
