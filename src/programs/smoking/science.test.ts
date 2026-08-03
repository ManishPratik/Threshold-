import { describe, it, expect } from 'vitest';
import {
  PEAK_END_HOURS,
  HURDLES,
  nicotinePctRemaining,
  getWormStage,
  getWormScale,
  crossedHurdles,
  nextHurdle,
} from './index';

describe('nicotinePctRemaining — pharmacology', () => {
  it('at hour 0 returns 100 percent', () => {
    expect(nicotinePctRemaining(0)).toBe(100);
  });

  it('negative hours clamp to 100 percent', () => {
    expect(nicotinePctRemaining(-5)).toBe(100);
    expect(nicotinePctRemaining(-0.0001)).toBe(100);
  });

  it('at hour 2 returns 50 percent (one half-life)', () => {
    expect(nicotinePctRemaining(2)).toBeCloseTo(50, 6);
  });

  it('at hour 4 returns 25 percent (two half-lives)', () => {
    expect(nicotinePctRemaining(4)).toBeCloseTo(25, 6);
  });

  it('at hour 12 is well under 2 percent (100 * 0.5^6)', () => {
    // Six half-lives from hour 0 → 100 * (1/64) ≈ 1.5625 %
    const v = nicotinePctRemaining(12);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(2);
    expect(v).toBeCloseTo(1.5625, 4);
  });

  it('at hour 24 is well under 0.1 percent (100 * 0.5^12)', () => {
    // Twelve half-lives from hour 0 → 100 * (1/4096) ≈ 0.0244 %
    const v = nicotinePctRemaining(24);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(0.1);
    expect(v).toBeCloseTo(0.0244140625, 6);
  });

  it('at hour 72 is effectively cleared but non-negative', () => {
    const v = nicotinePctRemaining(72);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1e-8);
  });

  it('monotonically decreases as time advances', () => {
    for (let h = 0; h <= 96; h += 2) {
      expect(nicotinePctRemaining(h)).toBeGreaterThanOrEqual(
        nicotinePctRemaining(h + 2),
      );
    }
  });
});

describe('getWormStage — narrative alignment', () => {
  it('stage 1 covers 0 to just under 2 hours', () => {
    expect(getWormStage(0)).toBe(1);
    expect(getWormStage(0.5)).toBe(1);
    expect(getWormStage(1.999)).toBe(1);
  });

  it('stage 2 covers hour 2 to just under hour 12', () => {
    expect(getWormStage(2)).toBe(2);
    expect(getWormStage(6)).toBe(2);
    expect(getWormStage(11.999)).toBe(2);
  });

  it('stage 3 covers hour 12 to just under hour 24', () => {
    expect(getWormStage(12)).toBe(3);
    expect(getWormStage(18)).toBe(3);
    expect(getWormStage(23.999)).toBe(3);
  });

  it('stage 4 covers hour 24 to just under PEAK_END_HOURS', () => {
    expect(getWormStage(24)).toBe(4);
    expect(getWormStage(50)).toBe(4);
    expect(getWormStage(PEAK_END_HOURS - 0.001)).toBe(4);
  });

  it('stage 5 covers PEAK_END_HOURS and beyond', () => {
    expect(getWormStage(PEAK_END_HOURS)).toBe(5);
    expect(getWormStage(1000)).toBe(5);
  });
});

describe('getWormScale — interpolation and anchors', () => {
  it('returns 1.0 at hour 0', () => {
    expect(getWormScale(0)).toBe(1.0);
  });

  it('hits the exact anchor values within tolerance', () => {
    expect(getWormScale(1)).toBeCloseTo(0.7, 6);
    expect(getWormScale(2)).toBeCloseTo(0.5, 6);
    expect(getWormScale(4)).toBeCloseTo(0.25, 6);
    expect(getWormScale(6)).toBeCloseTo(0.15, 6);
    expect(getWormScale(8)).toBeCloseTo(0.1, 6);
    expect(getWormScale(12)).toBeCloseTo(0.05, 6);
    expect(getWormScale(24)).toBeCloseTo(0.02, 6);
    expect(getWormScale(PEAK_END_HOURS)).toBeCloseTo(0.01, 6);
  });

  it('interpolates linearly between two anchors', () => {
    // Between hour 2 (0.50) and hour 4 (0.25): midpoint hour 3 → 0.375
    expect(getWormScale(3)).toBeCloseTo(0.375, 6);
  });

  it('clamps to the final anchor beyond PEAK_END_HOURS', () => {
    expect(getWormScale(1000)).toBeCloseTo(0.01, 6);
    expect(getWormScale(PEAK_END_HOURS + 24)).toBeCloseTo(0.01, 6);
  });

  it('monotonically decreases through the anchor range', () => {
    for (let h = 0; h <= 72; h += 1) {
      expect(getWormScale(h)).toBeGreaterThanOrEqual(getWormScale(h + 1));
    }
  });
});

describe('HURDLES — data integrity', () => {
  it('contains six milestones', () => {
    expect(HURDLES).toHaveLength(6);
  });

  it('every hurdle is beyond PEAK_END_HOURS', () => {
    for (const h of HURDLES) {
      expect(h.hrs).toBeGreaterThan(PEAK_END_HOURS);
    }
  });

  it('milestones are strictly chronological', () => {
    for (let i = 0; i < HURDLES.length - 1; i += 1) {
      const a = HURDLES[i];
      const b = HURDLES[i + 1];
      expect(a).toBeDefined();
      expect(b).toBeDefined();
      if (a && b) expect(a.hrs).toBeLessThan(b.hrs);
    }
  });

  it('ids match the Threshold README chain (week1, week2, month1, month3, month6, year1)', () => {
    expect(HURDLES.map((h) => h.id)).toEqual([
      'week1',
      'week2',
      'month1',
      'month3',
      'month6',
      'year1',
    ]);
  });

  it('every hurdle has non-empty label / headline / body / ratchet', () => {
    for (const h of HURDLES) {
      expect(h.label.length).toBeGreaterThan(0);
      expect(h.headline.length).toBeGreaterThan(0);
      expect(h.body.length).toBeGreaterThan(0);
      expect(h.ratchet.length).toBeGreaterThan(0);
    }
  });
});

describe('crossedHurdles', () => {
  it('returns an empty list inside peak withdrawal', () => {
    expect(crossedHurdles(PEAK_END_HOURS - 1)).toEqual([]);
    expect(crossedHurdles(0)).toEqual([]);
  });

  it('returns week1 exactly at hour 168', () => {
    const r = crossedHurdles(168);
    expect(r.map((h) => h.id)).toEqual(['week1']);
  });

  it('returns all six hurdles at year 1', () => {
    const r = crossedHurdles(8760);
    expect(r.map((h) => h.id)).toEqual([
      'week1',
      'week2',
      'month1',
      'month3',
      'month6',
      'year1',
    ]);
  });

  it('adds each hurdle in order as time passes', () => {
    expect(crossedHurdles(200).map((h) => h.id)).toEqual(['week1']);
    expect(crossedHurdles(500).map((h) => h.id)).toEqual(['week1', 'week2']);
    expect(crossedHurdles(1000).map((h) => h.id)).toEqual([
      'week1',
      'week2',
      'month1',
    ]);
  });
});

describe('nextHurdle', () => {
  it('inside peak withdrawal points at week1', () => {
    expect(nextHurdle(24)?.id).toBe('week1');
    expect(nextHurdle(0)?.id).toBe('week1');
  });

  it('advances to the next chronological hurdle after each crossing', () => {
    expect(nextHurdle(200)?.id).toBe('week2');
    expect(nextHurdle(500)?.id).toBe('month1');
    expect(nextHurdle(1000)?.id).toBe('month3');
    expect(nextHurdle(3000)?.id).toBe('month6');
    expect(nextHurdle(5000)?.id).toBe('year1');
  });

  it('returns null once every hurdle has been crossed', () => {
    expect(nextHurdle(8760)).toBeNull();
    expect(nextHurdle(100000)).toBeNull();
  });

  it('is exclusive at each hurdle boundary (>= means crossed)', () => {
    expect(nextHurdle(168)?.id).toBe('week2');
    expect(nextHurdle(167.999)?.id).toBe('week1');
  });
});

describe('constants — PEAK_END_HOURS', () => {
  it('is exactly 72 to match the Threshold README', () => {
    expect(PEAK_END_HOURS).toBe(72);
  });
});
