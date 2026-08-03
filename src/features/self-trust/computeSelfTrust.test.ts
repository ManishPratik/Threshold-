import { describe, it, expect } from 'vitest';
import type { Declaration } from '@data/types/frozen/Declaration';
import type { BlockCompletion } from '@data/types/frozen/BlockCompletion';
import type { Routine } from '@data/types/frozen/Routine';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import { computeSelfTrust, V1_CONSTANTS } from './index';

function makePromise(overrides: Partial<PromiseRecord> = {}): PromiseRecord {
  return {
    id: 'p1',
    title: 'Test Promise',
    why: 'why',
    stake: 'stake',
    principles: [],
    startDate: '2026-01-01',
    endDate: '2026-01-30',
    attemptNumber: 1,
    promisedAt: '2026-01-01T00:00:00.000Z',
    activatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    ...overrides,
  };
}

function makeDecl(
  date: string,
  verdict: 'kept' | 'broken',
  promiseId = 'p1',
): Declaration {
  return {
    promiseId,
    date,
    verdict,
    declaredAt: `${date}T20:00:00.000Z`,
    schemaVersion: 1,
  };
}

function makeCompletion(
  date: string,
  blockId: string,
  promiseId = 'p1',
): BlockCompletion {
  return {
    promiseId,
    date,
    blockId,
    completedAt: `${date}T09:00:00.000Z`,
    schemaVersion: 1,
  };
}

function makeRoutine(blockIds: string[]): Routine {
  return {
    id: 'r1',
    promiseId: 'p1',
    blocks: blockIds.map((id) => ({
      id,
      name: id,
      durationMinutes: 15,
      type: 'Ritual',
    })),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
  };
}

describe('computeSelfTrust — empty and boundary inputs', () => {
  it('returns zero when no declarations exist', () => {
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: null,
      declarations: [],
      blockCompletions: [],
      today: '2026-01-01',
    });
    expect(r).toEqual({
      score: 0,
      daysScored: 0,
      keptCount: 0,
      brokenCount: 0,
      fullDaysCount: 0,
    });
  });

  it('returns zero when today equals startDate with no declaration', () => {
    const r = computeSelfTrust({
      promise: makePromise({ startDate: '2026-01-15' }),
      routine: null,
      declarations: [],
      blockCompletions: [],
      today: '2026-01-15',
    });
    expect(r.score).toBe(0);
    expect(r.daysScored).toBe(0);
  });

  it('empty routine (zero blocks) never grants a full-day bonus', () => {
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: makeRoutine([]),
      declarations: [makeDecl('2026-01-01', 'kept')],
      blockCompletions: [],
      today: '2026-01-01',
    });
    expect(r.score).toBe(V1_CONSTANTS.pointsPerKept);
    expect(r.fullDaysCount).toBe(0);
  });
});

describe('computeSelfTrust — kept and broken accumulation', () => {
  it('adds pointsPerKept for one kept day', () => {
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: null,
      declarations: [makeDecl('2026-01-01', 'kept')],
      blockCompletions: [],
      today: '2026-01-01',
    });
    expect(r.score).toBe(V1_CONSTANTS.pointsPerKept);
    expect(r.keptCount).toBe(1);
    expect(r.brokenCount).toBe(0);
    expect(r.daysScored).toBe(1);
  });

  it('all-kept streak scales linearly with day count', () => {
    const dates = [
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
    ];
    const decls = dates.map((d) => makeDecl(d, 'kept'));
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: null,
      declarations: decls,
      blockCompletions: [],
      today: '2026-01-05',
    });
    expect(r.score).toBe(5 * V1_CONSTANTS.pointsPerKept);
    expect(r.keptCount).toBe(5);
    expect(r.daysScored).toBe(5);
  });

  it('all-broken clamps cumulative score to the floor', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-03'];
    const decls = dates.map((d) => makeDecl(d, 'broken'));
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: null,
      declarations: decls,
      blockCompletions: [],
      today: '2026-01-03',
    });
    expect(r.score).toBe(V1_CONSTANTS.scoreFloor);
    expect(r.brokenCount).toBe(3);
    expect(r.keptCount).toBe(0);
  });

  it('mixed history clamps mid-arc dip at the floor then recovers', () => {
    const decls = [
      makeDecl('2026-01-01', 'kept'),
      makeDecl('2026-01-02', 'broken'),
      makeDecl('2026-01-03', 'kept'),
      makeDecl('2026-01-04', 'kept'),
    ];
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: null,
      declarations: decls,
      blockCompletions: [],
      today: '2026-01-04',
    });
    // day1: 0 + 1 = 1
    // day2: 1 + (-2) = -1 → clamped to 0
    // day3: 0 + 1 = 1
    // day4: 1 + 1 = 2
    expect(r.score).toBe(2);
    expect(r.keptCount).toBe(3);
    expect(r.brokenCount).toBe(1);
    expect(r.daysScored).toBe(4);
  });
});

describe('computeSelfTrust — missed days and daysScored counter', () => {
  it('undeclared days do not increment daysScored and contribute zero', () => {
    const decls = [
      makeDecl('2026-01-01', 'kept'),
      makeDecl('2026-01-03', 'kept'),
    ];
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: null,
      declarations: decls,
      blockCompletions: [],
      today: '2026-01-03',
    });
    expect(r.score).toBe(2 * V1_CONSTANTS.pointsPerKept);
    expect(r.daysScored).toBe(2);
    expect(r.keptCount).toBe(2);
  });

  it('a completely undeclared long window returns zero', () => {
    const r = computeSelfTrust({
      promise: makePromise({ startDate: '2026-01-01' }),
      routine: null,
      declarations: [],
      blockCompletions: [],
      today: '2026-01-10',
    });
    expect(r.score).toBe(0);
    expect(r.daysScored).toBe(0);
  });
});

describe('computeSelfTrust — full-day bonus', () => {
  it('applies fullDayBonus when block completions match routine size', () => {
    const routine = makeRoutine(['b1', 'b2', 'b3']);
    const r = computeSelfTrust({
      promise: makePromise(),
      routine,
      declarations: [makeDecl('2026-01-01', 'kept')],
      blockCompletions: [
        makeCompletion('2026-01-01', 'b1'),
        makeCompletion('2026-01-01', 'b2'),
        makeCompletion('2026-01-01', 'b3'),
      ],
      today: '2026-01-01',
    });
    expect(r.score).toBe(
      V1_CONSTANTS.pointsPerKept + V1_CONSTANTS.fullDayBonus,
    );
    expect(r.fullDaysCount).toBe(1);
  });

  it('grants no bonus when block completions are partial', () => {
    const routine = makeRoutine(['b1', 'b2', 'b3']);
    const r = computeSelfTrust({
      promise: makePromise(),
      routine,
      declarations: [makeDecl('2026-01-01', 'kept')],
      blockCompletions: [
        makeCompletion('2026-01-01', 'b1'),
        makeCompletion('2026-01-01', 'b2'),
      ],
      today: '2026-01-01',
    });
    expect(r.score).toBe(V1_CONSTANTS.pointsPerKept);
    expect(r.fullDaysCount).toBe(0);
  });

  it('grants no bonus when routine is null even if completions exist', () => {
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: null,
      declarations: [makeDecl('2026-01-01', 'kept')],
      blockCompletions: [makeCompletion('2026-01-01', 'b1')],
      today: '2026-01-01',
    });
    expect(r.score).toBe(V1_CONSTANTS.pointsPerKept);
    expect(r.fullDaysCount).toBe(0);
  });

  it('grants bonus on a day with no declaration but full completions', () => {
    const routine = makeRoutine(['b1']);
    const r = computeSelfTrust({
      promise: makePromise(),
      routine,
      declarations: [],
      blockCompletions: [makeCompletion('2026-01-01', 'b1')],
      today: '2026-01-01',
    });
    expect(r.score).toBe(V1_CONSTANTS.fullDayBonus);
    expect(r.fullDaysCount).toBe(1);
    expect(r.daysScored).toBe(0);
  });

  it('bonus is per-day — accumulates across multiple full days', () => {
    const routine = makeRoutine(['b1']);
    const r = computeSelfTrust({
      promise: makePromise(),
      routine,
      declarations: [
        makeDecl('2026-01-01', 'kept'),
        makeDecl('2026-01-02', 'kept'),
        makeDecl('2026-01-03', 'kept'),
      ],
      blockCompletions: [
        makeCompletion('2026-01-01', 'b1'),
        makeCompletion('2026-01-02', 'b1'),
        makeCompletion('2026-01-03', 'b1'),
      ],
      today: '2026-01-03',
    });
    expect(r.score).toBe(
      3 * V1_CONSTANTS.pointsPerKept + 3 * V1_CONSTANTS.fullDayBonus,
    );
    expect(r.fullDaysCount).toBe(3);
  });

  it('over-completion (more completions than blocks) still counts as one full day', () => {
    const routine = makeRoutine(['b1']);
    const r = computeSelfTrust({
      promise: makePromise(),
      routine,
      declarations: [makeDecl('2026-01-01', 'kept')],
      blockCompletions: [
        makeCompletion('2026-01-01', 'b1'),
        // duplicate block record shouldn't happen at storage layer but the
        // pure function must remain robust to it
        makeCompletion('2026-01-01', 'b1'),
      ],
      today: '2026-01-01',
    });
    expect(r.fullDaysCount).toBe(1);
    expect(r.score).toBe(
      V1_CONSTANTS.pointsPerKept + V1_CONSTANTS.fullDayBonus,
    );
  });
});

describe('computeSelfTrust — cross-promise filtering', () => {
  it('ignores declarations belonging to a different promiseId', () => {
    const r = computeSelfTrust({
      promise: makePromise({ id: 'p1' }),
      routine: null,
      declarations: [
        makeDecl('2026-01-01', 'kept', 'p1'),
        makeDecl('2026-01-01', 'broken', 'other-promise'),
      ],
      blockCompletions: [],
      today: '2026-01-01',
    });
    expect(r.score).toBe(V1_CONSTANTS.pointsPerKept);
    expect(r.brokenCount).toBe(0);
  });

  it('ignores block completions belonging to a different promiseId', () => {
    const routine = makeRoutine(['b1']);
    const r = computeSelfTrust({
      promise: makePromise(),
      routine,
      declarations: [makeDecl('2026-01-01', 'kept')],
      blockCompletions: [makeCompletion('2026-01-01', 'b1', 'other-promise')],
      today: '2026-01-01',
    });
    expect(r.score).toBe(V1_CONSTANTS.pointsPerKept);
    expect(r.fullDaysCount).toBe(0);
  });
});

describe('computeSelfTrust — cursor boundary handling', () => {
  it('today equal to startDate scores exactly one day', () => {
    const decls = [
      makeDecl('2026-01-01', 'kept'),
      makeDecl('2026-01-02', 'kept'),
      makeDecl('2026-01-03', 'kept'),
    ];
    const r = computeSelfTrust({
      promise: makePromise({ startDate: '2026-01-01' }),
      routine: null,
      declarations: decls,
      blockCompletions: [],
      today: '2026-01-01',
    });
    expect(r.score).toBe(V1_CONSTANTS.pointsPerKept);
    expect(r.daysScored).toBe(1);
  });

  it('accepts unsorted declaration arrays (order-independent)', () => {
    const decls = [
      makeDecl('2026-01-03', 'kept'),
      makeDecl('2026-01-01', 'kept'),
      makeDecl('2026-01-02', 'broken'),
    ];
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: null,
      declarations: decls,
      blockCompletions: [],
      today: '2026-01-03',
    });
    // day1: kept +1 → 1; day2: broken -2 → floor 0; day3: kept +1 → 1
    expect(r.score).toBe(1);
    expect(r.keptCount).toBe(2);
    expect(r.brokenCount).toBe(1);
  });

  it('declarations dated after today are ignored (loop stops at today)', () => {
    const decls = [
      makeDecl('2026-01-01', 'kept'),
      makeDecl('2026-01-02', 'kept'),
      // dated after today — must not contribute
      makeDecl('2026-01-05', 'kept'),
    ];
    const r = computeSelfTrust({
      promise: makePromise(),
      routine: null,
      declarations: decls,
      blockCompletions: [],
      today: '2026-01-02',
    });
    expect(r.score).toBe(2 * V1_CONSTANTS.pointsPerKept);
    expect(r.keptCount).toBe(2);
    expect(r.daysScored).toBe(2);
  });
});
