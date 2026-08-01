import type { ISODate } from '@shared/lib/date';
import type { BaseEntity } from './common';

export type MissionStatus = 'draft' | 'active' | 'completed' | 'archived';

/**
 * A Mission Contract.
 * Locked rule: once status transitions to 'active', only `notes`, `reward`,
 * and `refuseToLose` may be edited. Any other change requires archiving this
 * contract and creating a new one. The mission-contract service enforces this.
 *
 * `refuseToLose` is optional in the type so missions created before the
 * V2 contract redesign continue to load without migration. Consumers must
 * treat an absent value as "hide this section" (per Phase 3 spec).
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
  refuseToLose?: string | undefined;
  /**
   * Technical activation timestamp — when the mission row was written to
   * IndexedDB. Not the emotional moment; use `promisedAt` for the keepsake.
   */
  activatedAt: string | null;
  /**
   * ISO timestamp of the user's exact "I promise." press moment during the
   * onboarding witness ritual. Anchors the emotional keepsake independent
   * of DB-write latency. Optional so missions created before this field
   * shipped continue to load without migration; consumers must fall back
   * to `activatedAt` when this is absent.
   */
  promisedAt?: string | undefined;
}
