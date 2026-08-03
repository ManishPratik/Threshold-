import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { deleteDb } from '@data/db/client';
import {
  isAckedToday,
  markAcked,
  markAckedNow,
  purgeOlderThan30Days,
  readAckRecord,
  readSeenTodayIds,
} from './ackLog';
import { toDateKey, shiftDateKey } from './dateKey';

describe('ackLog', () => {
  beforeEach(async () => {
    await deleteDb();
  });
  afterEach(async () => {
    await deleteDb();
  });

  it('readAckRecord returns null when no ack has been written', async () => {
    expect(await readAckRecord('2026-08-03')).toBeNull();
  });

  it('markAcked writes an ack that isAckedToday can observe', async () => {
    await markAcked('smoking-morning-pledge', '2026-08-03', 'ack');
    expect(await isAckedToday('smoking-morning-pledge', '2026-08-03')).toBe(
      true,
    );
  });

  it('isAckedToday returns false for a dismissed intervention', async () => {
    await markAcked('smoking-morning-pledge', '2026-08-03', 'dismiss');
    expect(await isAckedToday('smoking-morning-pledge', '2026-08-03')).toBe(
      false,
    );
    const record = await readAckRecord('2026-08-03');
    expect(record?.dismissed).toEqual(['smoking-morning-pledge']);
  });

  it('markAcked twice with the same id in the same day is idempotent (deduplicated)', async () => {
    await markAcked('a', '2026-08-03', 'ack');
    await markAcked('a', '2026-08-03', 'ack');
    const record = await readAckRecord('2026-08-03');
    expect(record?.acked).toEqual(['a']);
    expect(record?.dismissed).toEqual([]);
  });

  it('re-marking an id migrates it between acked and dismissed arrays', async () => {
    await markAcked('a', '2026-08-03', 'ack');
    await markAcked('a', '2026-08-03', 'dismiss');
    const record = await readAckRecord('2026-08-03');
    expect(record?.acked).toEqual([]);
    expect(record?.dismissed).toEqual(['a']);
  });

  it('multiple ids on the same day accumulate into the same record', async () => {
    await markAcked('a', '2026-08-03', 'ack');
    await markAcked('b', '2026-08-03', 'ack');
    await markAcked('c', '2026-08-03', 'dismiss');
    const record = await readAckRecord('2026-08-03');
    expect(record?.acked).toEqual(['a', 'b']);
    expect(record?.dismissed).toEqual(['c']);
  });

  it('acks on different days write different records', async () => {
    await markAcked('a', '2026-08-03', 'ack');
    await markAcked('a', '2026-08-04', 'ack');
    expect(await readAckRecord('2026-08-03')).not.toBeNull();
    expect(await readAckRecord('2026-08-04')).not.toBeNull();
    expect(await isAckedToday('a', '2026-08-03')).toBe(true);
    expect(await isAckedToday('a', '2026-08-04')).toBe(true);
  });

  it('purgeOlderThan30Days deletes only rows older than the retention window', async () => {
    const today = '2026-08-03';
    await markAcked('a', shiftDateKey(today, 45), 'ack'); // 45 days old — purge
    await markAcked('b', shiftDateKey(today, 31), 'ack'); // 31 days old — purge
    await markAcked('c', shiftDateKey(today, 30), 'ack'); // 30 days old — keep
    await markAcked('d', shiftDateKey(today, 7), 'ack'); // recent — keep
    await markAcked('e', today, 'ack'); // today — keep

    const deleted = await purgeOlderThan30Days(today);
    expect(deleted).toBe(2);
    expect(await readAckRecord(shiftDateKey(today, 45))).toBeNull();
    expect(await readAckRecord(shiftDateKey(today, 31))).toBeNull();
    expect(await readAckRecord(shiftDateKey(today, 30))).not.toBeNull();
    expect(await readAckRecord(shiftDateKey(today, 7))).not.toBeNull();
    expect(await readAckRecord(today)).not.toBeNull();
  });

  it('purgeOlderThan30Days returns 0 when nothing is stale', async () => {
    const today = '2026-08-03';
    await markAcked('a', today, 'ack');
    expect(await purgeOlderThan30Days(today)).toBe(0);
  });

  it('purgeOlderThan30Days does not touch non-daily-flow rows in the settings store', async () => {
    // Write a foreign row into settings (simulates smoking quit-time etc).
    const { getDb } = await import('@data/db/client');
    const { STORES } = await import('@data/db/schema');
    const db = await getDb();
    await db.put(STORES.settings, {
      id: 'smoking-quit-time',
      key: 'smoking.quitTime',
      quitAt: 1_700_000_000_000,
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    });
    // Also write an ancient ack row that should be purged.
    await markAcked('a', shiftDateKey('2026-08-03', 60), 'ack');

    await purgeOlderThan30Days('2026-08-03');

    const foreign = await db.get(STORES.settings, 'smoking-quit-time');
    expect(foreign).toBeDefined();
    expect(await readAckRecord(shiftDateKey('2026-08-03', 60))).toBeNull();
  });

  it('markAckedNow writes to the local-day record', async () => {
    const ms = new Date('2026-08-03T09:00:00').getTime();
    await markAckedNow('a', ms, 'ack');
    const record = await readAckRecord(toDateKey(ms));
    expect(record?.acked).toEqual(['a']);
  });

  it('readSeenTodayIds returns an empty set when nothing has happened', async () => {
    expect((await readSeenTodayIds('2026-08-03')).size).toBe(0);
  });

  it('readSeenTodayIds unions acked and dismissed ids for the day', async () => {
    await markAcked('a', '2026-08-03', 'ack');
    await markAcked('b', '2026-08-03', 'dismiss');
    const seen = await readSeenTodayIds('2026-08-03');
    expect(seen.has('a')).toBe(true);
    expect(seen.has('b')).toBe(true);
    expect(seen.has('c')).toBe(false);
  });

  it('readSeenTodayIds is scoped to the requested day', async () => {
    await markAcked('a', '2026-08-03', 'ack');
    const seen = await readSeenTodayIds('2026-08-04');
    expect(seen.size).toBe(0);
  });
});
