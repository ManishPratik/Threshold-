import { DEFAULT_ACK_WINDOW } from './constants';
import { readAckRecord } from './ackLog';
import { shiftDateKey, toDateKey } from './dateKey';
import { readDailyAnalytics } from './dailyAnalytics';

/**
 * Rolling ack-rate over a window of recent days. ADR 0009 §7 — a
 * read-only feedback signal programs use inside their own
 * `shouldFire` to self-taper. The engine never mutates program
 * priority or frequency on the program's behalf.
 *
 * Definition:
 *
 *   denom = number of days in the window on which the intervention
 *           was either acked OR dismissed.
 *   numer = number of days on which it was acked.
 *   rate  = numer / denom, clamped to [0, 1]. When denom is 0
 *           (intervention has never appeared in the window), the
 *           rate is 0 — no data means no signal.
 *
 * The window includes today. `windowDays = 7` means today + 6 prior
 * days.
 */
export async function getInterventionAckRate(
  interventionId: string,
  windowDays: number = DEFAULT_ACK_WINDOW,
  nowMs: number = Date.now(),
): Promise<number> {
  if (windowDays <= 0) return 0;
  const todayKey = toDateKey(nowMs);
  let denom = 0;
  let numer = 0;
  for (let back = 0; back < windowDays; back += 1) {
    const key = back === 0 ? todayKey : shiftDateKey(todayKey, back);
    const record = await readAckRecord(key);
    if (!record) continue;
    const acked = record.acked.includes(interventionId);
    const dismissed = record.dismissed.includes(interventionId);
    if (!acked && !dismissed) continue;
    denom += 1;
    if (acked) numer += 1;
  }
  if (denom === 0) return 0;
  const rate = numer / denom;
  if (rate < 0) return 0;
  if (rate > 1) return 1;
  return rate;
}

/**
 * Program-agnostic aggregate engagement rate. Reuses `readDailyAnalytics`
 * at personal-os/src/features/daily-flow-engine/dailyAnalytics.ts:52
 * and filters its rows to the requested rolling window. Returns 1 —
 * the "never punish missing data" default per Phase 12 spec — when the
 * window is empty or the read fails. Value is clamped to [0, 1].
 *
 * This is the value the engine writes onto `InterventionContext.ackRate`
 * before every `shouldFire` walk so programs can adapt wording without
 * duplicating aggregation logic.
 */
export async function readAggregateAckRate(
  windowDays: number = DEFAULT_ACK_WINDOW,
  nowMs: number = Date.now(),
): Promise<number> {
  if (windowDays <= 0) return 1;
  try {
    const analytics = await readDailyAnalytics(nowMs);
    if (analytics.rows.length === 0) return 1;
    const todayKey = toDateKey(nowMs);
    let numer = 0;
    let denom = 0;
    for (const row of analytics.rows) {
      let gap = 0;
      for (; gap < windowDays; gap += 1) {
        const target = gap === 0 ? todayKey : shiftDateKey(todayKey, gap);
        if (target === row.date) break;
      }
      if (gap >= windowDays) continue;
      numer += row.acked;
      denom += row.seen;
    }
    if (denom === 0) return 1;
    const rate = numer / denom;
    if (rate < 0) return 0;
    if (rate > 1) return 1;
    return rate;
  } catch {
    return 1;
  }
}
