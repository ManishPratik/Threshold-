// Pure calendar-date helpers used by the ack log. Kept separate from
// the IDB layer so the parsing logic is unit-testable in isolation.
//
// A "date key" is the ISO 8601 date-only string `YYYY-MM-DD` derived
// from a Unix millis timestamp interpreted in the runtime's local
// timezone. Local time is used because ack retention is user-facing
// ("30 days") and users experience days locally, not in UTC.

/** Convert a Unix millis timestamp into a local-time `YYYY-MM-DD`
 *  string. Pure — no locale, no formatter side-effects. */
export function toDateKey(nowMs: number): string {
  const d = new Date(nowMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Convert an ISO 8601 datetime string to a `YYYY-MM-DD` date key,
 *  interpreted in local time. Throws only when the input is a value
 *  `new Date` cannot parse. */
export function isoToDateKey(nowIso: string): string {
  const ms = new Date(nowIso).getTime();
  if (Number.isNaN(ms)) {
    throw new RangeError(`isoToDateKey: unparseable ISO string ${nowIso}`);
  }
  return toDateKey(ms);
}

/** Whole calendar days between two `YYYY-MM-DD` date keys. Returns a
 *  non-negative integer. Order-independent. Uses UTC math on the parsed
 *  date-only values to avoid DST off-by-one errors. */
export function daysBetweenKeys(a: string, b: string): number {
  const ta = Date.UTC(
    Number(a.slice(0, 4)),
    Number(a.slice(5, 7)) - 1,
    Number(a.slice(8, 10)),
  );
  const tb = Date.UTC(
    Number(b.slice(0, 4)),
    Number(b.slice(5, 7)) - 1,
    Number(b.slice(8, 10)),
  );
  return Math.round(Math.abs(ta - tb) / 86_400_000);
}

/** Return the date key `n` days before `fromKey`. Non-negative `n`. */
export function shiftDateKey(fromKey: string, daysBack: number): string {
  const base = Date.UTC(
    Number(fromKey.slice(0, 4)),
    Number(fromKey.slice(5, 7)) - 1,
    Number(fromKey.slice(8, 10)),
  );
  const shifted = base - daysBack * 86_400_000;
  const d = new Date(shifted);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
