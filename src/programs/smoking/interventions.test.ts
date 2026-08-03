import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { Intervention, InterventionContext } from '@features/programs';
import type * as IntervStateModule from './interventionState';
import type { SmokingContext } from './interventionState';
import { DEFAULT_MANTRA, DEFAULT_PLEDGE_BODY } from './editableSlots';

// Mock the sync-cache module: replace preload / snapshot with a
// test-controlled shim while keeping the pure helpers (computeDayNumber,
// computeCleanHours). No IDB is touched.
vi.mock('./interventionState', async () => {
  let mockCache: SmokingContext | null = null;
  const helpers =
    await vi.importActual<typeof IntervStateModule>('./interventionState');
  return {
    ...helpers,
    getSmokingContextSync: () => mockCache,
    preloadSmokingContext: async () => mockCache,
    invalidateSmokingContext: () => {
      mockCache = null;
    },
    __setContext: (ctx: SmokingContext | null) => {
      mockCache = ctx;
    },
  };
});

// Imports below run AFTER the mock is installed by Vitest.
import { SMOKING_INTERVENTIONS, IDENTITY_FORMATION_DAYS } from './interventions';
import * as intervState from './interventionState';
import { invalidateSmokingContext } from './interventionState';

const setContext = (
  intervState as unknown as {
    __setContext: (ctx: SmokingContext | null) => void;
  }
).__setContext;

function ctx(
  phase: InterventionContext['phase'],
  ackRate: number = 1,
): InterventionContext {
  return { promiseId: 'p-1', nowIso: '2026-08-03T09:00:00', phase, ackRate };
}

function makeContext(overrides: Partial<SmokingContext> = {}): SmokingContext {
  return {
    quitAt: Date.UTC(2026, 7, 3, 6, 0, 0),
    promiseStartDate: '2026-08-03',
    currentPromiseId: 'p-1',
    todayReflectionDeclared: false,
    todayKey: '2026-08-03',
    ...overrides,
  };
}

function must(id: string): Intervention {
  const iv = SMOKING_INTERVENTIONS.find((i) => i.id === id);
  if (!iv) throw new Error(`intervention not found: ${id}`);
  return iv;
}

describe('Smoking interventions — Day 1', () => {
  beforeEach(() => setContext(makeContext({ todayKey: '2026-08-03' })));
  afterEach(() => setContext(null));

  it('exposes eleven records (four phase interventions with a three-tier morning + evening split)', () => {
    expect(SMOKING_INTERVENTIONS).toHaveLength(11);
  });

  it('morning full-pledge intervention fires', () => {
    const iv = must('smoking-morning-pledge-full');
    expect(iv.shouldFire(ctx('morning'))).toBe(true);
    expect(iv.body).toBe(DEFAULT_PLEDGE_BODY);
    expect(iv.priority).toBe('p1');
  });

  it('morning short-reminder intervention does NOT fire on Day 1', () => {
    const iv = must('smoking-morning-pledge-short');
    expect(iv.shouldFire(ctx('morning'))).toBe(false);
  });

  it('midday intervention fires', () => {
    const iv = must('smoking-midday-checkin');
    expect(iv.shouldFire(ctx('midday'))).toBe(true);
    expect(iv.priority).toBe('p2');
  });

  it('evening intervention fires with the mantra as body', () => {
    const iv = must('smoking-evening-commitment');
    expect(iv.shouldFire(ctx('evening'))).toBe(true);
    expect(iv.body).toBe(DEFAULT_MANTRA);
    expect(iv.priority).toBe('p1');
  });

  it('night intervention fires when reflection is not yet declared', () => {
    const iv = must('smoking-night-reflection-cue');
    expect(iv.shouldFire(ctx('night'))).toBe(true);
  });
});

describe('Smoking interventions — Day 7 boundary (still identity-formation)', () => {
  beforeEach(() =>
    setContext(
      makeContext({
        promiseStartDate: '2026-08-03',
        todayKey: '2026-08-09',
      }),
    ),
  );
  afterEach(() => setContext(null));

  it('morning full-pledge fires on Day 7 (inclusive upper bound)', () => {
    const iv = must('smoking-morning-pledge-full');
    expect(iv.shouldFire(ctx('morning'))).toBe(true);
  });

  it('morning short-reminder does NOT fire on Day 7', () => {
    const iv = must('smoking-morning-pledge-short');
    expect(iv.shouldFire(ctx('morning'))).toBe(false);
  });
});

describe('Smoking interventions — Day 8+ (post-formation)', () => {
  beforeEach(() =>
    setContext(
      makeContext({
        promiseStartDate: '2026-08-03',
        todayKey: '2026-08-10',
      }),
    ),
  );
  afterEach(() => setContext(null));

  it('morning full-pledge does NOT fire on Day 8', () => {
    const iv = must('smoking-morning-pledge-full');
    expect(iv.shouldFire(ctx('morning'))).toBe(false);
  });

  it('morning short-reminder fires on Day 8', () => {
    const iv = must('smoking-morning-pledge-short');
    expect(iv.shouldFire(ctx('morning'))).toBe(true);
    expect(iv.body).not.toBe(DEFAULT_PLEDGE_BODY);
  });

  it('morning short-reminder still fires on Day 30', () => {
    setContext(
      makeContext({
        promiseStartDate: '2026-08-03',
        todayKey: '2026-09-01',
      }),
    );
    const iv = must('smoking-morning-pledge-short');
    expect(iv.shouldFire(ctx('morning'))).toBe(true);
  });
});

describe('Smoking interventions — night suppression when reflection declared', () => {
  afterEach(() => setContext(null));

  it('night intervention is silenced when the user has already declared today', () => {
    setContext(makeContext({ todayReflectionDeclared: true }));
    const iv = must('smoking-night-reflection-cue');
    expect(iv.shouldFire(ctx('night'))).toBe(false);
  });

  it('night intervention fires when reflection is not yet declared', () => {
    setContext(makeContext({ todayReflectionDeclared: false }));
    const iv = must('smoking-night-reflection-cue');
    expect(iv.shouldFire(ctx('night'))).toBe(true);
  });
});

describe('Smoking interventions — safe defaults', () => {
  afterEach(() => setContext(null));

  it('every intervention returns false when the context cache is empty', () => {
    setContext(null);
    for (const iv of SMOKING_INTERVENTIONS) {
      expect(iv.shouldFire(ctx(iv.phase as InterventionContext['phase']))).toBe(
        false,
      );
    }
  });

  it('every intervention returns false when no quit-at is stored', () => {
    setContext(makeContext({ quitAt: null }));
    for (const iv of SMOKING_INTERVENTIONS) {
      expect(iv.shouldFire(ctx(iv.phase as InterventionContext['phase']))).toBe(
        false,
      );
    }
  });

  it('morning interventions return false when no active promise (no start date)', () => {
    setContext(makeContext({ promiseStartDate: null }));
    const full = must('smoking-morning-pledge-full');
    const short = must('smoking-morning-pledge-short');
    expect(full.shouldFire(ctx('morning'))).toBe(false);
    expect(short.shouldFire(ctx('morning'))).toBe(false);
  });
});

describe('IDENTITY_FORMATION_DAYS constant', () => {
  it('is 7 per the Phase 8 behavioural spec', () => {
    expect(IDENTITY_FORMATION_DAYS).toBe(7);
    // Guard against silent invalidation — clear the cache after tests.
    invalidateSmokingContext();
  });
});

describe('Smoking engagement tiers — Phase 12', () => {
  beforeEach(() => setContext(makeContext({ todayKey: '2026-08-03' })));
  afterEach(() => setContext(null));

  it('fires the high-tier morning-full when ackRate >= 0.8', () => {
    const high = must('smoking-morning-pledge-full');
    const medium = must('smoking-morning-pledge-full-medium');
    const low = must('smoking-morning-pledge-full-direct');
    expect(high.shouldFire(ctx('morning', 0.9))).toBe(true);
    expect(medium.shouldFire(ctx('morning', 0.9))).toBe(false);
    expect(low.shouldFire(ctx('morning', 0.9))).toBe(false);
  });

  it('fires the medium-tier morning-full when 0.4 <= ackRate < 0.8', () => {
    const high = must('smoking-morning-pledge-full');
    const medium = must('smoking-morning-pledge-full-medium');
    const low = must('smoking-morning-pledge-full-direct');
    expect(high.shouldFire(ctx('morning', 0.6))).toBe(false);
    expect(medium.shouldFire(ctx('morning', 0.6))).toBe(true);
    expect(low.shouldFire(ctx('morning', 0.6))).toBe(false);
  });

  it('fires the low-tier morning-full when ackRate < 0.4', () => {
    const high = must('smoking-morning-pledge-full');
    const medium = must('smoking-morning-pledge-full-medium');
    const low = must('smoking-morning-pledge-full-direct');
    expect(high.shouldFire(ctx('morning', 0.2))).toBe(false);
    expect(medium.shouldFire(ctx('morning', 0.2))).toBe(false);
    expect(low.shouldFire(ctx('morning', 0.2))).toBe(true);
  });

  it('fires exactly one evening variant for each tier', () => {
    const high = must('smoking-evening-commitment');
    const medium = must('smoking-evening-commitment-medium');
    const low = must('smoking-evening-commitment-direct');
    for (const rate of [0.9, 0.6, 0.2] as const) {
      const results = [high, medium, low].map((iv) =>
        iv.shouldFire(ctx('evening', rate)),
      );
      const fired = results.filter(Boolean).length;
      expect(fired).toBe(1);
    }
  });

  it('defaults to the high tier when ackRate is missing (never punish missing data)', () => {
    const highMorning = must('smoking-morning-pledge-full');
    const highEvening = must('smoking-evening-commitment');
    const legacyCtx: InterventionContext = {
      promiseId: 'p-1',
      nowIso: '2026-08-03T09:00:00',
      phase: 'morning',
    };
    expect(highMorning.shouldFire(legacyCtx)).toBe(true);
    expect(
      highEvening.shouldFire({ ...legacyCtx, phase: 'evening' }),
    ).toBe(true);
  });

  it('boundary rates land in the correct tier', () => {
    const high = must('smoking-morning-pledge-full');
    const medium = must('smoking-morning-pledge-full-medium');
    const low = must('smoking-morning-pledge-full-direct');
    // Exactly 0.8 → high (inclusive per HIGH_ENGAGEMENT_MIN).
    expect(high.shouldFire(ctx('morning', 0.8))).toBe(true);
    // Exactly 0.4 → medium (inclusive per MEDIUM_ENGAGEMENT_MIN).
    expect(medium.shouldFire(ctx('morning', 0.4))).toBe(true);
    // Just under 0.4 → low.
    expect(low.shouldFire(ctx('morning', 0.399))).toBe(true);
  });
});

describe('Queue-cap invariant — Phase 12', () => {
  afterEach(() => setContext(null));

  it('across all tiers, at most one intervention fires per phase per context', () => {
    setContext(makeContext());
    for (const phase of ['morning', 'midday', 'evening', 'night'] as const) {
      for (const rate of [0.1, 0.4, 0.6, 0.8, 1.0]) {
        const fired = SMOKING_INTERVENTIONS.filter(
          (iv) => iv.phase === phase && iv.shouldFire(ctx(phase, rate)),
        );
        expect(fired.length).toBeLessThanOrEqual(1);
      }
    }
  });
});
