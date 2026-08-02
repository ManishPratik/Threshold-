// Minimal date utilities — uses only built-in Date + Intl. Skips date-fns / dayjs / luxon.
// All dates in the app are represented as ISO strings; Date objects live only inside these helpers.

export type ISODate = string; // e.g. '2026-07-28'
export type ISODateTime = string; // e.g. '2026-07-28T14:32:00.000Z'

const YMD = (d: Date): ISODate => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Current wall-clock timestamp as an ISO 8601 UTC string. */
export function nowIso(): ISODateTime {
  return new Date().toISOString();
}

/** Today's date in the user's local timezone as YYYY-MM-DD. */
export function todayLocal(): ISODate {
  return YMD(new Date());
}

/** Add days to an ISODate (local calendar) and return a new ISODate. */
export function addDays(date: ISODate, days: number): ISODate {
  const parts = date.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) {
    throw new Error(`Invalid ISODate: ${date}`);
  }
  const local = new Date(y, m - 1, d + days);
  return YMD(local);
}

/** Format an ISODate for display (e.g. "Tue, 28 Jul"). */
export function formatShortDate(date: ISODate, locale = 'en-GB'): string {
  const parts = date.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) return date;
  const local = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(local);
}

/**
 * Corruption-protection cap for day-arithmetic loops. Every helper that
 * iterates from a start date toward a target date bounds itself by this
 * count so a malformed promise (e.g., start after end, or absurd
 * durations) cannot hang. A cap this large accommodates any realistic
 * promise arc; hitting it indicates corrupted data, not business logic.
 */
const DAY_ARITHMETIC_SAFETY_CAP = 10000;

/**
 * Inclusive day count from `startDate` through `endDate`. Returns 0 when
 * `endDate` is strictly before `startDate`. Bounded by
 * `DAY_ARITHMETIC_SAFETY_CAP`.
 */
export function totalDaysBetween(
  startDate: ISODate,
  endDate: ISODate,
): number {
  if (endDate < startDate) return 0;
  let cursor = startDate;
  let n = 0;
  let safety = 0;
  while (cursor <= endDate && safety < DAY_ARITHMETIC_SAFETY_CAP) {
    n += 1;
    cursor = addDays(cursor, 1);
    safety += 1;
  }
  return n;
}

/**
 * Day number of `targetDate` within the arc starting at `startDate`.
 * Returns 0 when `targetDate` is strictly before `startDate`. Bounded by
 * `DAY_ARITHMETIC_SAFETY_CAP`.
 */
export function computeDayNumber(
  startDate: ISODate,
  targetDate: ISODate,
): number {
  if (targetDate < startDate) return 0;
  let cursor = startDate;
  let n = 1;
  let safety = 0;
  while (cursor < targetDate && safety < DAY_ARITHMETIC_SAFETY_CAP) {
    cursor = addDays(cursor, 1);
    n += 1;
    safety += 1;
  }
  return n;
}

/**
 * Witness-ritual timestamp for the keepsake. Formats an ISO datetime into the
 * unlabelled `Wed 29 Jul 2026 · 14:32` grammar the ritual anchors on.
 * Renders in the user's local timezone using their locale defaults.
 */
export function formatWitnessTimestamp(iso: ISODateTime, locale = 'en-GB'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${datePart} · ${timePart}`;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format an ISODate as `2 Aug 2026`. Deterministic — does not depend on
 * Intl locale so tests and every consumer get the same string. Falls back
 * to the raw ISODate if the input cannot be parsed.
 *
 * Consumers: Witness, Chain, History, Promise Detail — the shared
 * human-date grammar of the frozen product.
 */
export function humanDate(iso: ISODate): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return iso;
  const monthIdx = Number.parseInt(m, 10) - 1;
  const day = Number.parseInt(d, 10);
  if (monthIdx < 0 || monthIdx > 11 || Number.isNaN(day)) return iso;
  const monthName = MONTHS_SHORT[monthIdx] ?? m;
  return `${day} ${monthName} ${y}`;
}

/**
 * Format an ISODateTime as `2 Aug 2026 · 14:32` in the user's local
 * timezone. Used by Promise Detail note timestamps.
 */
export function humanDateTime(iso: ISODateTime): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const monthName = MONTHS_SHORT[d.getMonth()] ?? String(d.getMonth() + 1);
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${monthName} ${year} · ${hh}:${mm}`;
}
