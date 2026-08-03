import { describe, it, expect } from 'vitest';
import { PEAK_END_HOURS } from './science';
import {
  PEAK_PHASES,
  formatPeakRemaining,
  peakCrossedFraction,
  peakHoursRemaining,
  selectPeakPhase,
} from './peakPhase';
import {
  formatChamberPct,
  selectChamberState,
  WORM_STAGE_COPY,
} from './wormData';

describe('selectPeakPhase — boundaries and copy', () => {
  it('cleanHrs 0 returns entering', () => {
    expect(selectPeakPhase(0)?.id).toBe('entering');
  });
  it('cleanHrs 3.999 still returns entering', () => {
    expect(selectPeakPhase(3.999)?.id).toBe('entering');
  });
  it('cleanHrs 4 returns day1', () => {
    expect(selectPeakPhase(4)?.id).toBe('day1');
  });
  it('cleanHrs 23.999 still returns day1', () => {
    expect(selectPeakPhase(23.999)?.id).toBe('day1');
  });
  it('cleanHrs 24 returns deepest', () => {
    expect(selectPeakPhase(24)?.id).toBe('deepest');
  });
  it('cleanHrs 47.999 still returns deepest', () => {
    expect(selectPeakPhase(47.999)?.id).toBe('deepest');
  });
  it('cleanHrs 48 returns final', () => {
    expect(selectPeakPhase(48)?.id).toBe('final');
  });
  it('cleanHrs PEAK_END_HOURS-0.001 still returns final', () => {
    expect(selectPeakPhase(PEAK_END_HOURS - 0.001)?.id).toBe('final');
  });
  it('cleanHrs PEAK_END_HOURS returns null (peak crossed)', () => {
    expect(selectPeakPhase(PEAK_END_HOURS)).toBeNull();
  });
  it('cleanHrs well beyond PEAK_END_HOURS returns null', () => {
    expect(selectPeakPhase(1000)).toBeNull();
  });
  it('exposes four phases in canonical order', () => {
    expect(PEAK_PHASES.map((p) => p.id)).toEqual([
      'entering',
      'day1',
      'deepest',
      'final',
    ]);
  });
});

describe('peakCrossedFraction', () => {
  it('is 0 at cleanHrs 0', () => {
    expect(peakCrossedFraction(0)).toBe(0);
  });
  it('is 0.5 at half of PEAK_END_HOURS', () => {
    expect(peakCrossedFraction(PEAK_END_HOURS / 2)).toBeCloseTo(0.5, 6);
  });
  it('clamps to 1 at PEAK_END_HOURS', () => {
    expect(peakCrossedFraction(PEAK_END_HOURS)).toBe(1);
  });
  it('clamps to 1 well beyond PEAK_END_HOURS', () => {
    expect(peakCrossedFraction(500)).toBe(1);
  });
  it('clamps to 0 for negative input', () => {
    expect(peakCrossedFraction(-5)).toBe(0);
  });
});

describe('peakHoursRemaining and formatPeakRemaining', () => {
  it('is 72 hours at cleanHrs 0', () => {
    expect(peakHoursRemaining(0)).toBe(72);
  });
  it('is 0 at PEAK_END_HOURS', () => {
    expect(peakHoursRemaining(PEAK_END_HOURS)).toBe(0);
  });
  it('formats 72 hours as 72h 0m', () => {
    expect(formatPeakRemaining(0)).toBe('72h 0m');
  });
  it('formats 47.5 hours remaining as 47h 30m at cleanHrs 24.5', () => {
    expect(formatPeakRemaining(24.5)).toBe('47h 30m');
  });
  it('formats 0 remaining as 0h 0m once peak is crossed', () => {
    expect(formatPeakRemaining(PEAK_END_HOURS + 5)).toBe('0h 0m');
  });
});

describe('selectChamberState — color ladder', () => {
  it('100 percent returns critical', () => {
    expect(selectChamberState(100)).toBe('critical');
  });
  it('50 percent returns critical (inclusive lower bound)', () => {
    expect(selectChamberState(50)).toBe('critical');
  });
  it('49.99 percent returns high', () => {
    expect(selectChamberState(49.99)).toBe('high');
  });
  it('20 percent returns high (inclusive lower bound)', () => {
    expect(selectChamberState(20)).toBe('high');
  });
  it('19.99 percent returns fading', () => {
    expect(selectChamberState(19.99)).toBe('fading');
  });
  it('5 percent returns fading (inclusive lower bound)', () => {
    expect(selectChamberState(5)).toBe('fading');
  });
  it('4.99 percent returns trace', () => {
    expect(selectChamberState(4.99)).toBe('trace');
  });
  it('0.02 percent still returns trace', () => {
    expect(selectChamberState(0.02)).toBe('trace');
  });
  it('0.005 percent returns cleared', () => {
    expect(selectChamberState(0.005)).toBe('cleared');
  });
  it('0 returns cleared', () => {
    expect(selectChamberState(0)).toBe('cleared');
  });
});

describe('formatChamberPct — display precision ladder', () => {
  it('rounds to integer above 10', () => {
    expect(formatChamberPct(50)).toBe('50');
    expect(formatChamberPct(10.7)).toBe('11');
  });
  it('one decimal 1..10', () => {
    expect(formatChamberPct(5)).toBe('5.0');
    expect(formatChamberPct(1.567)).toBe('1.6');
  });
  it('two decimals 0.01..1', () => {
    expect(formatChamberPct(0.5)).toBe('0.50');
    expect(formatChamberPct(0.0244)).toBe('0.02');
  });
  it('below 0.01 collapses to "0"', () => {
    expect(formatChamberPct(0.005)).toBe('0');
    expect(formatChamberPct(0)).toBe('0');
  });
});

describe('WORM_STAGE_COPY — data integrity', () => {
  it('covers stages 1 through 5', () => {
    expect(Object.keys(WORM_STAGE_COPY).sort()).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
  });
  it('every stage has non-empty label / title / fact', () => {
    for (const stage of [1, 2, 3, 4, 5] as const) {
      const copy = WORM_STAGE_COPY[stage];
      expect(copy.label.length).toBeGreaterThan(0);
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.fact.length).toBeGreaterThan(0);
    }
  });
});
