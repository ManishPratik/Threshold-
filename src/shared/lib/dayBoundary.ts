import { todayLocal, type ISODate } from './date';

// Locked decision: day rollover defaults to 04:00 local time.
// Configurable per-user later via Settings — this module is the single choke point.
export const DEFAULT_DAY_START_HOUR = 4;

/**
 * Given a wall-clock timestamp, returns the ISODate of the "logical day" it belongs to,
 * using the configured day-start hour. E.g. at 03:30 local on 2026-07-28 with dayStart=4,
 * the logical day is still 2026-07-27.
 */
export function getLogicalDate(at: Date = new Date(), dayStartHour: number = DEFAULT_DAY_START_HOUR): ISODate {
  const shifted = new Date(at.getTime() - dayStartHour * 60 * 60 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convenience: the logical date "now". */
export function currentLogicalDate(dayStartHour: number = DEFAULT_DAY_START_HOUR): ISODate {
  return dayStartHour === 0 ? todayLocal() : getLogicalDate(new Date(), dayStartHour);
}
