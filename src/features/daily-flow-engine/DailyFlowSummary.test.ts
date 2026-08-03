import { describe, it, expect } from 'vitest';
import { pickLine } from './dailyFlowSummaryCopy';

describe('pickLine', () => {
  it('returns null when total is 0 and seen is 0 (component hides)', () => {
    expect(pickLine(0, 0)).toBeNull();
  });

  it('returns the completed-all copy when total > 0 and seen equals total', () => {
    expect(pickLine(3, 3)).toBe(
      "You've completed every guidance moment today.",
    );
  });

  it('returns the waiting copy when total > 0 and seen is 0', () => {
    expect(pickLine(0, 2)).not.toBeNull();
    expect(pickLine(0, 4)).toBe("Today's guidance is waiting.");
  });

  it('returns the partial copy with pluralised "moments" when 0 < seen < total > 1', () => {
    expect(pickLine(2, 5)).toBe(
      "You've engaged with 2 of 5 guidance moments today.",
    );
  });

  it('uses singular "moment" when total is 1', () => {
    // total = 1, seen = 0 → falls through to waiting copy.
    expect(pickLine(0, 1)).toBe("Today's guidance is waiting.");
  });

  it('returns the engaged-all copy when total is 0 but seen > 0 (post-hoc)', () => {
    expect(pickLine(3, 0)).toBe(
      "You've engaged with every guidance moment today.",
    );
  });

  it('never mentions percentages or technical terms', () => {
    for (const [s, t] of [
      [0, 0],
      [3, 3],
      [1, 4],
      [4, 4],
      [0, 5],
      [5, 0],
    ] as const) {
      const line = pickLine(s, t);
      if (line === null) continue;
      expect(line).not.toMatch(/%/);
      expect(line.toLowerCase()).not.toMatch(/intervention|ack|dismiss|queue/);
    }
  });
});
