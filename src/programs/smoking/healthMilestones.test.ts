import { describe, it, expect } from 'vitest';
import {
  HEALTH_MILESTONES,
  nextHealthMilestone,
  reachedHealthMilestones,
} from './healthMilestones';
import {
  MONEY_ANCHORS,
  bodyAwarenessCopy,
  moneySavedRupees,
  naturalHighPercent,
  selectMoneyAnchor,
} from './moneyAnchor';
import { DAILY_MSGS, HOURLY_MSGS, selectCurrentBodyMessage } from './hourlyMessages';

describe('HEALTH_MILESTONES — data integrity', () => {
  it('has 10 entries', () => {
    expect(HEALTH_MILESTONES).toHaveLength(10);
  });
  it('entries are strictly chronological', () => {
    for (let i = 0; i < HEALTH_MILESTONES.length - 1; i += 1) {
      expect(HEALTH_MILESTONES[i]!.mins).toBeLessThan(
        HEALTH_MILESTONES[i + 1]!.mins,
      );
    }
  });
});

describe('reachedHealthMilestones + nextHealthMilestone', () => {
  it('at cleanHrs 0 reaches nothing, next is the first entry', () => {
    expect(reachedHealthMilestones(0)).toEqual([]);
    expect(nextHealthMilestone(0)?.title).toBe('Heart Rate Drops');
  });
  it('at cleanHrs 1 (60 min) reaches only the 20-minute Heart Rate Drops', () => {
    const reached = reachedHealthMilestones(1);
    expect(reached.map((m) => m.title)).toEqual(['Heart Rate Drops']);
    expect(nextHealthMilestone(1)?.title).toBe('50% Nicotine Gone');
  });

  it('at cleanHrs 2 reaches through 50% Nicotine Gone, next is 8-hour CO', () => {
    const reached = reachedHealthMilestones(2);
    expect(reached.map((m) => m.title)).toEqual([
      'Heart Rate Drops',
      '50% Nicotine Gone',
    ]);
    expect(nextHealthMilestone(2)?.title).toBe('Carbon Monoxide Clears');
  });
  it('at cleanHrs 72 reaches through Peak Withdrawal Passed', () => {
    const reached = reachedHealthMilestones(72);
    expect(reached.map((m) => m.title)).toContain('Peak Withdrawal Passed');
    expect(nextHealthMilestone(72)?.title).toBe('1 Week — Lungs Clearing');
  });
  it('at cleanHrs 100000 reaches everything, next is null', () => {
    expect(reachedHealthMilestones(100000)).toHaveLength(10);
    expect(nextHealthMilestone(100000)).toBeNull();
  });
});

describe('selectMoneyAnchor + moneySavedRupees', () => {
  it('returns the base tier for 0 rupees', () => {
    expect(selectMoneyAnchor(0)).toBe('= one clean day at a time');
  });
  it('advances the tier as savings rise', () => {
    expect(selectMoneyAnchor(499)).toBe('= one clean day at a time');
    expect(selectMoneyAnchor(500)).toBe('= a good meal out');
    expect(selectMoneyAnchor(1499)).toBe('= a good meal out');
    expect(selectMoneyAnchor(1500)).toBe(
      '= a book you have been meaning to read',
    );
    expect(selectMoneyAnchor(100000)).toBe(
      '= a domestic flight + hotel week',
    );
  });
  it('exposes the 9-tier ladder in canonical order', () => {
    expect(MONEY_ANCHORS.map((a) => a.min)).toEqual([
      0, 500, 1500, 3000, 6000, 12000, 25000, 50000, 100000,
    ]);
  });
  it('money saved uses cleanDays * packCost floor', () => {
    // cleanHrs 48 = 2 days, packCost 250 → 500
    expect(moneySavedRupees(48, 250)).toBe(500);
    // fractional day rounds down
    expect(moneySavedRupees(35, 250)).toBe(Math.floor((35 / 24) * 250));
  });
});

describe('naturalHighPercent', () => {
  it('is 0 at cleanHrs 0', () => {
    expect(naturalHighPercent(0)).toBe(0);
  });
  it('is 100 at cleanHrs 24*90 (3 months)', () => {
    expect(naturalHighPercent(24 * 90)).toBe(100);
  });
  it('clamps to 100 beyond 3 months', () => {
    expect(naturalHighPercent(24 * 90 * 2)).toBe(100);
  });
  it('scales linearly mid-range', () => {
    expect(naturalHighPercent(24 * 45)).toBeCloseTo(50, 6);
  });
});

describe('bodyAwarenessCopy — three zones', () => {
  it('cleanHrs 0 returns the Day 1-3 line', () => {
    expect(bodyAwarenessCopy(0)).toMatch(/Day 1-3/);
  });
  it('cleanHrs 71.99 still returns the Day 1-3 line', () => {
    expect(bodyAwarenessCopy(71.99)).toMatch(/Day 1-3/);
  });
  it('cleanHrs 72 crosses into the fog-lifting line', () => {
    expect(bodyAwarenessCopy(72)).toMatch(/fog is lifting/);
  });
  it('cleanHrs 335 still returns the fog-lifting line', () => {
    expect(bodyAwarenessCopy(335)).toMatch(/fog is lifting/);
  });
  it('cleanHrs 336 crosses into the baseline-returning line', () => {
    expect(bodyAwarenessCopy(336)).toMatch(/baseline is returning/);
  });
});

describe('selectCurrentBodyMessage', () => {
  it('at cleanHrs 0 returns the Hour 0 message', () => {
    expect(selectCurrentBodyMessage(0).hour).toBe('Hour 0 — Ignition');
  });
  it('at cleanHrs 2.5 returns the Hour 2 message', () => {
    expect(selectCurrentBodyMessage(2.5).hour).toBe(
      'Hour 2 — First Battle',
    );
  });
  it('at cleanHrs 24 returns the Day 1 Complete milestone', () => {
    expect(selectCurrentBodyMessage(24).hour).toContain('Day 1 Complete');
  });
  it('at cleanHrs 72 returns the Day 3 Complete milestone', () => {
    expect(selectCurrentBodyMessage(72).hour).toContain('Day 3 Complete');
  });
  it('at cleanHrs 200 (past Day 7) falls into DAILY_MSGS Day 8', () => {
    expect(selectCurrentBodyMessage(200).hour).toBe('Day 8');
  });
  it('at cleanHrs 24*15 returns the Day 14 milestone', () => {
    expect(selectCurrentBodyMessage(24 * 15).hour).toBe('Day 14');
  });
  it('at cleanHrs 24*40 returns the Day 30+ open-ended message', () => {
    expect(selectCurrentBodyMessage(24 * 40).hour).toBe('Day 30+');
  });
});

describe('HOURLY_MSGS + DAILY_MSGS — coverage', () => {
  it('DAILY_MSGS has entries for days 8, 14, 21, 30, and post-30 open-ended', () => {
    const days = DAILY_MSGS.map((d) => d.day);
    expect(days).toContain(8);
    expect(days).toContain(14);
    expect(days).toContain(21);
    expect(days).toContain(30);
    expect(days).toContain(31);
  });
  it('HOURLY_MSGS covers hours 0-24 with no gaps in Day-1', () => {
    for (let h = 0; h <= 24; h += 1) {
      expect(HOURLY_MSGS[h]).toBeDefined();
    }
  });
});
