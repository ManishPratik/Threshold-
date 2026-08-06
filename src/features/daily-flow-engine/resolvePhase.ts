import type { Phase } from '@contract/program';

/**
 * Coarse clock-derived phase heuristic. ADR 0009 §2 fixes the four V1
 * anchor values (`morning`, `midday`, `evening`, `night`) as contexts
 * rather than clock windows — this helper only picks the default
 * anchor when no routine block is active and the caller has nothing
 * better to hint from user history.
 *
 * Bands are chosen to match typical circadian anchors:
 *
 *   05:00 – 10:59 → morning
 *   11:00 – 15:59 → midday
 *   16:00 – 20:59 → evening
 *   otherwise    → night
 *
 * Pure. Reads only the local-time hour of the supplied ISO datetime.
 * A bare `YYYY-MM-DDTHH:mm:ss` string (no timezone offset) is parsed
 * as local time by the standard `Date` constructor and produces a
 * deterministic result in tests.
 */
export function resolvePhase(nowIso: string): Phase {
  const d = new Date(nowIso);
  const t = d.getTime();
  if (Number.isNaN(t)) {
    throw new RangeError(`resolvePhase: unparseable ISO string ${nowIso}`);
  }
  const hour = d.getHours();
  if (hour >= 5 && hour <= 10) return 'morning';
  if (hour >= 11 && hour <= 15) return 'midday';
  if (hour >= 16 && hour <= 20) return 'evening';
  return 'night';
}
