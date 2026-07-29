import type { ReviewKind } from '@data/types/Review';
import { type ISODate } from '@shared/lib/date';

/**
 * Period helpers for the Reviews feature. Pure functions on ISODate strings.
 * ISO 8601 weeks (Monday = first day of week) — this is the calendar
 * convention Personal OS uses throughout, and matches the day-boundary layer
 * elsewhere (weeks are calendar-week, day boundary is unrelated).
 */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toUtc(date: ISODate): Date {
  const parts = date.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) {
    throw new Error(`Invalid ISODate: ${date}`);
  }
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(dt: Date): ISODate {
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Monday of the ISO 8601 week containing `date`. Idempotent on Mondays. */
export function startOfWeek(date: ISODate): ISODate {
  const dt = toUtc(date);
  const dow = dt.getUTCDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const shift = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + shift);
  return fromUtc(dt);
}

/** First day of the calendar month containing `date`. */
export function startOfMonth(date: ISODate): ISODate {
  const parts = date.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  if (y === undefined || m === undefined) throw new Error(`Invalid ISODate: ${date}`);
  return `${y}-${pad(m)}-01`;
}

/** Last day of the calendar month containing `monthStart` (or any date in that month). */
export function endOfMonth(date: ISODate): ISODate {
  const parts = date.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  if (y === undefined || m === undefined) throw new Error(`Invalid ISODate: ${date}`);
  const dt = new Date(Date.UTC(y, m, 0));
  return fromUtc(dt);
}

export function periodStartForKind(kind: ReviewKind, date: ISODate): ISODate {
  switch (kind) {
    case 'daily':
      return date;
    case 'weekly':
      return startOfWeek(date);
    case 'monthly':
      return startOfMonth(date);
  }
}

export function periodEndForKind(kind: ReviewKind, periodStart: ISODate): ISODate {
  switch (kind) {
    case 'daily':
      return periodStart;
    case 'weekly': {
      const dt = toUtc(periodStart);
      dt.setUTCDate(dt.getUTCDate() + 6);
      return fromUtc(dt);
    }
    case 'monthly':
      return endOfMonth(periodStart);
  }
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Human label per kind: daily → 'Today' when it matches today, else ISODate; weekly → 'Week of MMM D'; monthly → 'Month YYYY'. */
export function formatPeriodLabel(
  kind: ReviewKind,
  periodStart: ISODate,
  today: ISODate,
): string {
  const parts = periodStart.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) return periodStart;

  switch (kind) {
    case 'daily':
      return periodStart === today ? 'Today' : `${SHORT_MONTHS[m - 1]} ${d}`;
    case 'weekly':
      return `Week of ${SHORT_MONTHS[m - 1]} ${d}`;
    case 'monthly':
      return `${MONTH_LABELS[m - 1]} ${y}`;
  }
}
