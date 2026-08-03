import { describe, it, expect } from 'vitest';
import {
  BREATH_CYCLE,
  CARR_LINES,
  CRAVING_PAUSE_SECONDS,
  CRAVING_TRIGGERS,
  buildSurfedEntry,
  countSurfed,
  formatCountdown,
  isKnownTrigger,
  pickCarrLine,
  type CravingEntry,
} from './craving';

describe('craving constants — Threshold parity', () => {
  it('pause window is exactly 180 seconds', () => {
    expect(CRAVING_PAUSE_SECONDS).toBe(180);
  });

  it('breath cycle sums to 8 seconds (2 + 1 + 5)', () => {
    const total = BREATH_CYCLE.reduce((acc, s) => acc + s.ms, 0);
    expect(total).toBe(8000);
  });

  it('breath cycle order is inhale then hold then exhale', () => {
    expect(BREATH_CYCLE.map((s) => s.cls)).toEqual([
      'inhale',
      'hold',
      'exhale',
    ]);
  });

  it('has exactly 8 trigger options in verbatim Threshold order', () => {
    expect(CRAVING_TRIGGERS.map((t) => t.slug)).toEqual([
      'coffee',
      'stress',
      'social',
      'driving',
      'boredom',
      'alcohol',
      'after-meal',
      'other',
    ]);
  });

  it('has 5 Carr lines', () => {
    expect(CARR_LINES).toHaveLength(5);
  });

  it('every Carr line is non-empty', () => {
    for (const line of CARR_LINES) {
      expect(line.length).toBeGreaterThan(0);
    }
  });
});

describe('isKnownTrigger', () => {
  it('returns true for every canonical slug', () => {
    for (const t of CRAVING_TRIGGERS) {
      expect(isKnownTrigger(t.slug)).toBe(true);
    }
  });

  it('returns false for an unknown slug', () => {
    expect(isKnownTrigger('bogus')).toBe(false);
    expect(isKnownTrigger('')).toBe(false);
  });
});

describe('pickCarrLine', () => {
  it('returns a Carr line from the canonical set', () => {
    const line = pickCarrLine();
    expect(CARR_LINES).toContain(line);
  });

  it('uses the injected random generator deterministically', () => {
    // rand=0 → floor(0*5) = 0 → first line
    expect(pickCarrLine(() => 0)).toBe(CARR_LINES[0]);
    // rand=0.99 → floor(0.99*5) = 4 → last line
    expect(pickCarrLine(() => 0.99)).toBe(CARR_LINES[4]);
  });
});

describe('countSurfed', () => {
  it('returns zero for an empty log', () => {
    expect(countSurfed([])).toBe(0);
  });

  it('counts only entries with type surfed', () => {
    const log: CravingEntry[] = [
      { ts: 1, resisted: true, type: 'surfed', trigger: 'stress', note: '' },
      { ts: 2, resisted: false, type: 'lapse', trigger: 'coffee', note: '' },
      { ts: 3, resisted: true, type: 'surfed', trigger: 'social', note: '' },
    ];
    expect(countSurfed(log)).toBe(2);
  });

  it('ignores lapse-only logs', () => {
    const log: CravingEntry[] = [
      { ts: 1, resisted: false, type: 'lapse', trigger: 'x', note: '' },
      { ts: 2, resisted: false, type: 'lapse', trigger: 'y', note: '' },
    ];
    expect(countSurfed(log)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('formats 180 seconds as 3:00', () => {
    expect(formatCountdown(180)).toBe('3:00');
  });

  it('formats 0 seconds as 0:00', () => {
    expect(formatCountdown(0)).toBe('0:00');
  });

  it('formats 65 seconds as 1:05', () => {
    expect(formatCountdown(65)).toBe('1:05');
  });

  it('clamps negative values to 0:00', () => {
    expect(formatCountdown(-5)).toBe('0:00');
  });

  it('floors sub-second values', () => {
    expect(formatCountdown(59.9)).toBe('0:59');
    expect(formatCountdown(60.5)).toBe('1:00');
  });
});

describe('buildSurfedEntry', () => {
  it('matches the Threshold shape verbatim', () => {
    const entry = buildSurfedEntry('coffee', 1_700_000_000_000);
    expect(entry).toEqual({
      ts: 1_700_000_000_000,
      resisted: true,
      type: 'surfed',
      trigger: 'coffee',
      note: 'Surfed — trigger: coffee',
    });
  });

  it('defaults ts to Date.now when omitted', () => {
    const before = Date.now();
    const entry = buildSurfedEntry('stress');
    const after = Date.now();
    expect(entry.ts).toBeGreaterThanOrEqual(before);
    expect(entry.ts).toBeLessThanOrEqual(after);
  });

  it('always flags resisted true and type surfed', () => {
    const entry = buildSurfedEntry('other');
    expect(entry.resisted).toBe(true);
    expect(entry.type).toBe('surfed');
  });
});
