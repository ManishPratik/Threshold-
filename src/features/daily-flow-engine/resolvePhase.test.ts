import { describe, it, expect } from 'vitest';
import { resolvePhase } from './resolvePhase';

describe('resolvePhase', () => {
  it('returns morning for 05:00', () => {
    expect(resolvePhase('2026-08-03T05:00:00')).toBe('morning');
  });

  it('returns morning for 10:59', () => {
    expect(resolvePhase('2026-08-03T10:59:00')).toBe('morning');
  });

  it('returns midday for 11:00', () => {
    expect(resolvePhase('2026-08-03T11:00:00')).toBe('midday');
  });

  it('returns midday for 15:59', () => {
    expect(resolvePhase('2026-08-03T15:59:00')).toBe('midday');
  });

  it('returns evening for 16:00', () => {
    expect(resolvePhase('2026-08-03T16:00:00')).toBe('evening');
  });

  it('returns evening for 20:59', () => {
    expect(resolvePhase('2026-08-03T20:59:00')).toBe('evening');
  });

  it('returns night for 21:00', () => {
    expect(resolvePhase('2026-08-03T21:00:00')).toBe('night');
  });

  it('returns night for 03:00 (deep night)', () => {
    expect(resolvePhase('2026-08-03T03:00:00')).toBe('night');
  });

  it('returns night for 04:59 (last minute before morning)', () => {
    expect(resolvePhase('2026-08-03T04:59:00')).toBe('night');
  });

  it('returns night for midnight boundary 00:00', () => {
    expect(resolvePhase('2026-08-03T00:00:00')).toBe('night');
  });

  it('returns night for 23:59', () => {
    expect(resolvePhase('2026-08-03T23:59:00')).toBe('night');
  });

  it('throws RangeError for an unparseable ISO string', () => {
    expect(() => resolvePhase('not-a-real-date')).toThrow(RangeError);
  });

  it('is pure: repeated calls with the same input yield the same output', () => {
    const iso = '2026-08-03T09:30:00';
    expect(resolvePhase(iso)).toBe(resolvePhase(iso));
    expect(resolvePhase(iso)).toBe(resolvePhase(iso));
  });
});
