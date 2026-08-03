import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { deleteDb } from '@data/db/client';
import { markAcked } from './ackLog';
import { readDailyAnalytics } from './dailyAnalytics';
import { shiftDateKey } from './dateKey';

const TODAY_KEY = '2026-08-03';
const NOW_MS = new Date('2026-08-03T09:00:00').getTime();

describe('readDailyAnalytics', () => {
  beforeEach(async () => {
    await deleteDb();
  });
  afterEach(async () => {
    await deleteDb();
  });

  it('returns EMPTY analytics when no ack rows exist', async () => {
    const out = await readDailyAnalytics(NOW_MS);
    expect(out.totalSeen).toBe(0);
    expect(out.totalAcked).toBe(0);
    expect(out.totalDismissed).toBe(0);
    expect(out.overallAckRate).toBe(0);
    expect(out.overallDismissRate).toBe(0);
    expect(out.rows).toEqual([]);
  });

  it('computes 100% acknowledgement when every interaction is an ack', async () => {
    await markAcked('iv-a', TODAY_KEY, 'ack');
    await markAcked('iv-b', TODAY_KEY, 'ack');
    await markAcked('iv-c', shiftDateKey(TODAY_KEY, 1), 'ack');

    const out = await readDailyAnalytics(NOW_MS);
    expect(out.totalSeen).toBe(3);
    expect(out.totalAcked).toBe(3);
    expect(out.totalDismissed).toBe(0);
    expect(out.overallAckRate).toBe(1);
    expect(out.overallDismissRate).toBe(0);
    expect(out.rows).toHaveLength(2);
  });

  it('computes 0% acknowledgement / 100% dismissal when every interaction is a dismiss', async () => {
    await markAcked('iv-a', TODAY_KEY, 'dismiss');
    await markAcked('iv-b', TODAY_KEY, 'dismiss');

    const out = await readDailyAnalytics(NOW_MS);
    expect(out.totalSeen).toBe(2);
    expect(out.totalAcked).toBe(0);
    expect(out.totalDismissed).toBe(2);
    expect(out.overallAckRate).toBe(0);
    expect(out.overallDismissRate).toBe(1);
  });

  it('mixes acks and dismisses across days', async () => {
    // Today: 2 acks, 1 dismiss (67% ack).
    await markAcked('iv-a', TODAY_KEY, 'ack');
    await markAcked('iv-b', TODAY_KEY, 'ack');
    await markAcked('iv-c', TODAY_KEY, 'dismiss');
    // 5 days ago: 1 ack, 1 dismiss (50%).
    await markAcked('iv-d', shiftDateKey(TODAY_KEY, 5), 'ack');
    await markAcked('iv-e', shiftDateKey(TODAY_KEY, 5), 'dismiss');

    const out = await readDailyAnalytics(NOW_MS);
    expect(out.totalSeen).toBe(5);
    expect(out.totalAcked).toBe(3);
    expect(out.totalDismissed).toBe(2);
    expect(out.overallAckRate).toBeCloseTo(0.6, 3);
    expect(out.overallDismissRate).toBeCloseTo(0.4, 3);
    expect(out.rows).toHaveLength(2);
  });

  it('orders rows newest-first', async () => {
    await markAcked('iv-a', shiftDateKey(TODAY_KEY, 3), 'ack');
    await markAcked('iv-b', shiftDateKey(TODAY_KEY, 1), 'ack');
    await markAcked('iv-c', TODAY_KEY, 'ack');
    await markAcked('iv-d', shiftDateKey(TODAY_KEY, 7), 'ack');

    const out = await readDailyAnalytics(NOW_MS);
    const dates = out.rows.map((r) => r.date);
    expect(dates).toEqual([
      TODAY_KEY,
      shiftDateKey(TODAY_KEY, 1),
      shiftDateKey(TODAY_KEY, 3),
      shiftDateKey(TODAY_KEY, 7),
    ]);
  });

  it('excludes rows older than the 30-day retention window', async () => {
    await markAcked('iv-old', shiftDateKey(TODAY_KEY, 45), 'ack');
    await markAcked('iv-recent', TODAY_KEY, 'ack');

    const out = await readDailyAnalytics(NOW_MS);
    expect(out.rows.map((r) => r.date)).toEqual([TODAY_KEY]);
    expect(out.totalSeen).toBe(1);
  });

  it('includes a row at exactly 30 days back', async () => {
    await markAcked('iv-edge', shiftDateKey(TODAY_KEY, 30), 'ack');
    const out = await readDailyAnalytics(NOW_MS);
    expect(out.rows).toHaveLength(1);
  });

  it('excludes empty-record days (acked + dismissed both zero)', async () => {
    // Write then remove both — shouldn't appear as a row.
    await markAcked('iv-a', TODAY_KEY, 'ack');
    // Re-write over so acked/dismissed both stay non-empty.
    const out = await readDailyAnalytics(NOW_MS);
    expect(out.rows).toHaveLength(1);
  });

  it('ignores unrelated settings-store rows (smoking quit-time, editable slots, etc.)', async () => {
    // Seed a foreign settings row alongside an ack row.
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
    await markAcked('iv-a', TODAY_KEY, 'ack');

    const out = await readDailyAnalytics(NOW_MS);
    expect(out.rows).toHaveLength(1);
    expect(out.totalSeen).toBe(1);
  });
});
