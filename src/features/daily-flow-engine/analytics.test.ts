import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { deleteDb } from '@data/db/client';
import { markAcked } from './ackLog';
import { getInterventionAckRate, readAggregateAckRate } from './analytics';
import { shiftDateKey } from './dateKey';

// Anchor date used by every test. Feeding an explicit `nowMs` makes
// the window fully deterministic regardless of when the suite runs.
const TODAY_KEY = '2026-08-03';
const NOW_MS = new Date('2026-08-03T09:00:00').getTime();

describe('getInterventionAckRate', () => {
  beforeEach(async () => {
    await deleteDb();
  });
  afterEach(async () => {
    await deleteDb();
  });

  it('returns 0 when the intervention has never appeared in the window', async () => {
    expect(await getInterventionAckRate('unseen', 7, NOW_MS)).toBe(0);
  });

  it('returns 1 when every appearance was an ack', async () => {
    for (let back = 0; back < 3; back += 1) {
      await markAcked('a', shiftDateKey(TODAY_KEY, back), 'ack');
    }
    expect(await getInterventionAckRate('a', 7, NOW_MS)).toBe(1);
  });

  it('returns 0 when every appearance was a dismiss', async () => {
    for (let back = 0; back < 3; back += 1) {
      await markAcked('a', shiftDateKey(TODAY_KEY, back), 'dismiss');
    }
    expect(await getInterventionAckRate('a', 7, NOW_MS)).toBe(0);
  });

  it('returns numer/denom for a mixed window', async () => {
    await markAcked('a', shiftDateKey(TODAY_KEY, 0), 'ack');
    await markAcked('a', shiftDateKey(TODAY_KEY, 1), 'ack');
    await markAcked('a', shiftDateKey(TODAY_KEY, 2), 'dismiss');
    await markAcked('a', shiftDateKey(TODAY_KEY, 3), 'dismiss');
    // 2 acks / 4 appearances = 0.5
    expect(await getInterventionAckRate('a', 7, NOW_MS)).toBe(0.5);
  });

  it('ignores days on which the intervention did not appear (no data ≠ dismiss)', async () => {
    await markAcked('a', shiftDateKey(TODAY_KEY, 0), 'ack');
    await markAcked('a', shiftDateKey(TODAY_KEY, 6), 'ack');
    // Other days have no record → they do not count in the denominator.
    expect(await getInterventionAckRate('a', 7, NOW_MS)).toBe(1);
  });

  it('honours a custom window and excludes days outside it', async () => {
    // Ack today, dismiss 10 days ago. With windowDays=7 the older row
    // is out of window, so the rate stays at 1.
    await markAcked('a', shiftDateKey(TODAY_KEY, 0), 'ack');
    await markAcked('a', shiftDateKey(TODAY_KEY, 10), 'dismiss');
    expect(await getInterventionAckRate('a', 7, NOW_MS)).toBe(1);
    // Widen the window to 14 days and the older row now counts.
    expect(await getInterventionAckRate('a', 14, NOW_MS)).toBe(0.5);
  });

  it('defaults windowDays to 7 when unspecified', async () => {
    await markAcked('a', shiftDateKey(TODAY_KEY, 0), 'ack');
    await markAcked('a', shiftDateKey(TODAY_KEY, 10), 'dismiss');
    // Default window = 7 → the day-10 dismiss is excluded → rate 1.
    expect(await getInterventionAckRate('a', undefined, NOW_MS)).toBe(1);
  });

  it('returns 0 when windowDays is zero or negative', async () => {
    await markAcked('a', TODAY_KEY, 'ack');
    expect(await getInterventionAckRate('a', 0, NOW_MS)).toBe(0);
    expect(await getInterventionAckRate('a', -1, NOW_MS)).toBe(0);
  });

  it('does not confuse two intervention ids on the same day', async () => {
    await markAcked('a', TODAY_KEY, 'ack');
    await markAcked('b', TODAY_KEY, 'dismiss');
    expect(await getInterventionAckRate('a', 7, NOW_MS)).toBe(1);
    expect(await getInterventionAckRate('b', 7, NOW_MS)).toBe(0);
  });
});

describe('readAggregateAckRate (Phase 12)', () => {
  beforeEach(async () => {
    await deleteDb();
  });
  afterEach(async () => {
    await deleteDb();
  });

  it('returns 1 when no ack records exist (never punish missing data)', async () => {
    expect(await readAggregateAckRate(7, NOW_MS)).toBe(1);
  });

  it('returns 1 when windowDays is 0 or negative', async () => {
    await markAcked('a', TODAY_KEY, 'ack');
    expect(await readAggregateAckRate(0, NOW_MS)).toBe(1);
    expect(await readAggregateAckRate(-3, NOW_MS)).toBe(1);
  });

  it('returns 1 when every appearance in the window was an ack', async () => {
    await markAcked('a', TODAY_KEY, 'ack');
    await markAcked('b', TODAY_KEY, 'ack');
    await markAcked('c', shiftDateKey(TODAY_KEY, 1), 'ack');
    expect(await readAggregateAckRate(7, NOW_MS)).toBe(1);
  });

  it('returns 0 when every appearance in the window was a dismiss', async () => {
    await markAcked('a', TODAY_KEY, 'dismiss');
    await markAcked('b', shiftDateKey(TODAY_KEY, 1), 'dismiss');
    expect(await readAggregateAckRate(7, NOW_MS)).toBe(0);
  });

  it('aggregates acks and dismisses across days in the window', async () => {
    await markAcked('a', TODAY_KEY, 'ack');
    await markAcked('b', TODAY_KEY, 'ack');
    await markAcked('c', TODAY_KEY, 'dismiss');
    await markAcked('d', shiftDateKey(TODAY_KEY, 3), 'ack');
    await markAcked('e', shiftDateKey(TODAY_KEY, 3), 'dismiss');
    // 3 acks / 5 seen = 0.6
    expect(await readAggregateAckRate(7, NOW_MS)).toBeCloseTo(0.6, 3);
  });

  it('excludes rows outside the window', async () => {
    await markAcked('a', TODAY_KEY, 'ack');
    await markAcked('b', shiftDateKey(TODAY_KEY, 10), 'dismiss');
    // Window=7 → the day-10 dismiss is excluded → rate 1
    expect(await readAggregateAckRate(7, NOW_MS)).toBe(1);
    // Window=14 → both rows count → 1/(1+1) = 0.5
    expect(await readAggregateAckRate(14, NOW_MS)).toBeCloseTo(0.5, 3);
  });
});
