import { describe, it, expect } from 'vitest';
import {
  daysBetweenKeys,
  isoToDateKey,
  shiftDateKey,
  toDateKey,
} from './dateKey';

describe('dateKey', () => {
  it('toDateKey formats a Unix millis into local YYYY-MM-DD', () => {
    // Use a bare local ISO string so both new Date() and toDateKey read the
    // same wall-clock day regardless of runtime timezone.
    const ms = new Date('2026-08-03T09:15:00').getTime();
    expect(toDateKey(ms)).toBe('2026-08-03');
  });

  it('toDateKey pads month and day to two digits', () => {
    const ms = new Date('2026-01-05T09:15:00').getTime();
    expect(toDateKey(ms)).toBe('2026-01-05');
  });

  it('isoToDateKey converts an ISO datetime to a date key', () => {
    expect(isoToDateKey('2026-08-03T09:15:00')).toBe('2026-08-03');
  });

  it('isoToDateKey throws RangeError on an unparseable string', () => {
    expect(() => isoToDateKey('nonsense')).toThrow(RangeError);
  });

  it('daysBetweenKeys is 0 for the same day', () => {
    expect(daysBetweenKeys('2026-08-03', '2026-08-03')).toBe(0);
  });

  it('daysBetweenKeys is 1 for consecutive days', () => {
    expect(daysBetweenKeys('2026-08-03', '2026-08-04')).toBe(1);
  });

  it('daysBetweenKeys is 30 across a full retention window', () => {
    expect(daysBetweenKeys('2026-07-04', '2026-08-03')).toBe(30);
  });

  it('daysBetweenKeys is order-independent', () => {
    expect(daysBetweenKeys('2026-08-03', '2026-07-04')).toBe(30);
  });

  it('daysBetweenKeys handles month rollover', () => {
    expect(daysBetweenKeys('2026-07-31', '2026-08-01')).toBe(1);
  });

  it('shiftDateKey returns the same key when daysBack is 0', () => {
    expect(shiftDateKey('2026-08-03', 0)).toBe('2026-08-03');
  });

  it('shiftDateKey subtracts full days', () => {
    expect(shiftDateKey('2026-08-03', 1)).toBe('2026-08-02');
    expect(shiftDateKey('2026-08-03', 7)).toBe('2026-07-27');
  });

  it('shiftDateKey handles month rollover backwards', () => {
    expect(shiftDateKey('2026-08-01', 1)).toBe('2026-07-31');
  });

  it('shiftDateKey handles a full 30-day retention window', () => {
    expect(shiftDateKey('2026-08-03', 30)).toBe('2026-07-04');
  });
});
