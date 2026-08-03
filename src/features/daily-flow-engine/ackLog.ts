import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import {
  ACK_RECORD_ID_PREFIX,
  ACK_RECORD_KEY,
  ACK_RECORD_SCHEMA_VERSION,
  ACK_RETENTION_DAYS,
} from './constants';
import { daysBetweenKeys, toDateKey } from './dateKey';

/**
 * Daily-flow ack log — one record per calendar day inside the reused
 * legacy `settings` v1 IDB store per ADR 0009 §6. Record shape:
 *
 *   id:            `dailyFlow-ack-YYYY-MM-DD`
 *   key:           `dailyFlow.ack`
 *   date:          `YYYY-MM-DD`
 *   acked:         string[]      — intervention ids the user acknowledged
 *   dismissed:     string[]      — intervention ids the user dismissed
 *   updatedAt:     ISO datetime
 *   schemaVersion: number
 *
 * No new IDB object store, no DB_VERSION bump. The `settings` store is
 * the same one the Smoking program already writes to at
 * personal-os/src/programs/smoking/state.ts lines 40-66; adding
 * daily-flow rows alongside is byte-safe because keyPath `id` is unique.
 */

export type AckRecordKind = 'ack' | 'dismiss';

export interface DailyAckRecord {
  id: string;
  key: string;
  date: string;
  acked: string[];
  dismissed: string[];
  updatedAt: string;
  schemaVersion: number;
}

function recordIdForDate(dateKey: string): string {
  return `${ACK_RECORD_ID_PREFIX}${dateKey}`;
}

// The `settings` v1 store has a unique `by-key` index at
// personal-os/src/data/db/migrations.ts:42, so `record.key` must be
// globally unique. Encoding the date into the key keeps the index
// happy while still allowing one row per day.
function recordKeyForDate(dateKey: string): string {
  return `${ACK_RECORD_KEY}.${dateKey}`;
}

function emptyRecord(dateKey: string): DailyAckRecord {
  return {
    id: recordIdForDate(dateKey),
    key: recordKeyForDate(dateKey),
    date: dateKey,
    acked: [],
    dismissed: [],
    updatedAt: new Date().toISOString(),
    schemaVersion: ACK_RECORD_SCHEMA_VERSION,
  };
}

/** Read the ack record for one calendar day. Returns `null` when no
 *  interventions have been acked or dismissed on that day. */
export async function readAckRecord(
  dateKey: string,
): Promise<DailyAckRecord | null> {
  const db = await getDb();
  const record = (await db.get(STORES.settings, recordIdForDate(dateKey))) as
    | DailyAckRecord
    | undefined;
  return record ?? null;
}

/**
 * Mark an intervention as acked or dismissed on the given date.
 * Idempotent: appending the same intervention id twice in the same
 * day is a no-op. Moving from `dismiss` to `ack` (or vice versa) on
 * the same day migrates the id between arrays so the record is a
 * clean union-of-events per day.
 */
export async function markAcked(
  interventionId: string,
  dateKey: string,
  kind: AckRecordKind = 'ack',
): Promise<void> {
  const db = await getDb();
  const existing = (await db.get(STORES.settings, recordIdForDate(dateKey))) as
    | DailyAckRecord
    | undefined;
  const base: DailyAckRecord = existing
    ? { ...existing, acked: [...existing.acked], dismissed: [...existing.dismissed] }
    : emptyRecord(dateKey);

  base.acked = base.acked.filter((id) => id !== interventionId);
  base.dismissed = base.dismissed.filter((id) => id !== interventionId);
  if (kind === 'ack') base.acked.push(interventionId);
  else base.dismissed.push(interventionId);
  base.updatedAt = new Date().toISOString();
  base.schemaVersion = ACK_RECORD_SCHEMA_VERSION;
  base.key = recordKeyForDate(dateKey);

  await db.put(STORES.settings, base);
}

/** True when the intervention was acked (not dismissed) on the given
 *  date. Programs never call this directly — engine consumers only. */
export async function isAckedToday(
  interventionId: string,
  dateKey: string,
): Promise<boolean> {
  const record = await readAckRecord(dateKey);
  if (!record) return false;
  return record.acked.includes(interventionId);
}

/**
 * Read every intervention id the user has already interacted with
 * on `dateKey`, regardless of whether the interaction was an ack or
 * a dismiss. Engine consumers use this to filter the queue so the
 * user never sees the same intervention twice in one day per the
 * Phase 9 "never nag" rule. Distinguishing ack vs dismiss lives in
 * the record itself for analytics — the visibility rule collapses
 * them into one seen-set.
 */
export async function readSeenTodayIds(
  dateKey: string,
): Promise<ReadonlySet<string>> {
  const record = await readAckRecord(dateKey);
  if (!record) return new Set();
  return new Set([...record.acked, ...record.dismissed]);
}

/**
 * Delete every ack record older than `ACK_RETENTION_DAYS` days
 * relative to `todayKey`. Boot-time sweep per ADR 0009 §6.
 *
 * The `settings` store also holds unrelated records (smoking quit
 * time, editable slots, etc). This function only touches ids
 * starting with `ACK_RECORD_ID_PREFIX` — no other consumer is
 * affected. Iterates via a keys() scan to avoid loading full payloads.
 */
export async function purgeOlderThan30Days(todayKey: string): Promise<number> {
  const db = await getDb();
  const allKeys = (await db.getAllKeys(STORES.settings)) as string[];
  let deleted = 0;
  for (const id of allKeys) {
    if (typeof id !== 'string' || !id.startsWith(ACK_RECORD_ID_PREFIX)) continue;
    const recordDate = id.slice(ACK_RECORD_ID_PREFIX.length);
    if (recordDate.length !== 10) continue;
    const gap = daysBetweenKeys(recordDate, todayKey);
    if (gap > ACK_RETENTION_DAYS) {
      await db.delete(STORES.settings, id);
      deleted += 1;
    }
  }
  return deleted;
}

/** Helper for callers that only have a Unix millis handle. */
export async function markAckedNow(
  interventionId: string,
  nowMs: number,
  kind: AckRecordKind = 'ack',
): Promise<void> {
  await markAcked(interventionId, toDateKey(nowMs), kind);
}
