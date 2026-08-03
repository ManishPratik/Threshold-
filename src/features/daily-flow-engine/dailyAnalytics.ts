import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import {
  ACK_RECORD_ID_PREFIX,
  ACK_RETENTION_DAYS,
} from './constants';
import type { DailyAckRecord } from './ackLog';
import { daysBetweenKeys, toDateKey } from './dateKey';

/** One row in the daily timeline. */
export interface DailyAnalyticsRow {
  date: string;
  acked: number;
  dismissed: number;
  seen: number;
  ackRate: number;
  dismissRate: number;
}

/** Full analytics payload consumed by the Settings screen. */
export interface DailyAnalytics {
  totalSeen: number;
  totalAcked: number;
  totalDismissed: number;
  overallAckRate: number;
  overallDismissRate: number;
  rows: readonly DailyAnalyticsRow[];
}

const EMPTY: DailyAnalytics = {
  totalSeen: 0,
  totalAcked: 0,
  totalDismissed: 0,
  overallAckRate: 0,
  overallDismissRate: 0,
  rows: [],
};

/**
 * Read every ack record inside the ACK_RETENTION_DAYS window relative
 * to `todayKey`, then aggregate. One repository read via
 * `getAllKeys` at
 * personal-os/src/features/daily-flow-engine/ackLog.ts:147 pattern +
 * one bounded key-by-key fetch. Rows are returned newest-first.
 *
 * Records outside the retention window are ignored — they will be
 * removed on the next `purgeOlderThan30Days` sweep at
 * personal-os/src/features/daily-flow-engine/ackLog.ts:145. This
 * function never mutates.
 */
export async function readDailyAnalytics(
  nowMs: number = Date.now(),
): Promise<DailyAnalytics> {
  const todayKey = toDateKey(nowMs);
  const db = await getDb();
  const allKeys = (await db.getAllKeys(STORES.settings)) as unknown[];

  const rows: DailyAnalyticsRow[] = [];
  let totalAcked = 0;
  let totalDismissed = 0;

  for (const raw of allKeys) {
    if (typeof raw !== 'string') continue;
    if (!raw.startsWith(ACK_RECORD_ID_PREFIX)) continue;
    const dateKey = raw.slice(ACK_RECORD_ID_PREFIX.length);
    if (dateKey.length !== 10) continue;
    const gap = daysBetweenKeys(dateKey, todayKey);
    if (gap > ACK_RETENTION_DAYS) continue;
    const record = (await db.get(STORES.settings, raw)) as
      | DailyAckRecord
      | undefined;
    if (!record) continue;
    const ackedCount = record.acked.length;
    const dismissedCount = record.dismissed.length;
    const seen = ackedCount + dismissedCount;
    if (seen === 0) continue;
    totalAcked += ackedCount;
    totalDismissed += dismissedCount;
    rows.push({
      date: record.date,
      acked: ackedCount,
      dismissed: dismissedCount,
      seen,
      ackRate: seen === 0 ? 0 : ackedCount / seen,
      dismissRate: seen === 0 ? 0 : dismissedCount / seen,
    });
  }

  if (rows.length === 0) return EMPTY;

  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const totalSeen = totalAcked + totalDismissed;
  const overallAckRate = totalSeen === 0 ? 0 : totalAcked / totalSeen;
  const overallDismissRate =
    totalSeen === 0 ? 0 : totalDismissed / totalSeen;

  return {
    totalSeen,
    totalAcked,
    totalDismissed,
    overallAckRate,
    overallDismissRate,
    rows,
  };
}
