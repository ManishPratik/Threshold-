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
