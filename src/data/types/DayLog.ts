import type { ISODate, ISODateTime } from '@shared/lib/date';
import type { BaseEntity } from './common';

export type DayState = 'normal' | 'recovery';

/**
 * One DayLog per logical day. `date` is the local ISODate assigned via the day-boundary rule
 * (04:00 default), NOT necessarily today's calendar date.
 */
export interface DayLog extends BaseEntity {
  date: ISODate;
  dayStartAt: ISODateTime;
  state: DayState;
  completedBlockIds: string[];
  skippedBlockIds: string[];
  notes: string;
}
