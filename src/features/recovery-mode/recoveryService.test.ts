import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRecoveryService, type RecoveryDeps } from './recoveryService';
import type { TimeProvider } from '@shared/lib/time';
import type { Mission } from '@data/types/Mission';
import type { Routine } from '@data/types/Routine';
import type { DayLog } from '@data/types/DayLog';
import type { PromiseEvent } from '@data/types/PromiseEvent';

// Fixed test clock. Injected via TimeProvider — no module mocking.
const TODAY = '2026-05-10';
const NOW_ISO = '2026-05-10T10:00:00.000Z';
const fakeTime: TimeProvider = {
  nowIso: () => NOW_ISO,
  currentLogicalDate: () => TODAY,
};

function stubMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'real-mission',
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    title: '',
    statement: '',
    startDate: '2026-05-01',
    endDate: '2026-06-01',
    status: 'active',
    targetMetrics: {},
    notes: '',
    reward: '',
    activatedAt: null,
    ...overrides,
  };
}

function stubRoutine(blockCount: number): Routine {
  return {
    id: 'r1',
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    name: 'test',
    missionId: 'real-mission',
    active: true,
    blocks: Array.from({ length: blockCount }, (_, i) => ({
      id: `b${i}`,
      label: `Block ${i}`,
      durationMinutes: 30,
      type: 'focus' as const,
      expectedStart: null,
    })),
  };
}

function stubDayLog(date: string, overrides: Partial<DayLog> = {}): DayLog {
  return {
    id: `dl-${date}`,
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    date,
    // Real ISO string so the recovery service can compute "end of yesterday"
    // as (todayDayStart - 1ms) without needing conditional handling in tests.
    dayStartAt: `${date}T04:00:00.000Z`,
    state: 'normal',
    completedBlockIds: [],
    skippedBlockIds: [],
    notes: '',
    ...overrides,
  };
}

interface MockState {
  mission?: Mission | undefined;
  routine?: Routine | undefined;
  logs: Map<string, DayLog>;
  events: PromiseEvent[];
}

function makeMockDeps(state: MockState): {
  deps: RecoveryDeps;
  put: ReturnType<typeof vi.fn>;
  append: ReturnType<typeof vi.fn>;
} {
  const put = vi.fn(async (dl: DayLog) => {
    state.logs.set(dl.date, dl);
  });
  const append = vi.fn(async (e: PromiseEvent) => {
    state.events.push(e);
  });
  const deps: RecoveryDeps = {
    missionRepository: {
      getActive: vi.fn(async () => state.mission),
    } as unknown as RecoveryDeps['missionRepository'],
    routineRepository: {
      getByMission: vi.fn(async () => (state.routine ? [state.routine] : [])),
    } as unknown as RecoveryDeps['routineRepository'],
    dayLogRepository: {
      getByDate: vi.fn(async (d: string) => state.logs.get(d)),
      put,
    } as unknown as RecoveryDeps['dayLogRepository'],
    promiseEventRepository: {
      append,
    } as unknown as RecoveryDeps['promiseEventRepository'],
    time: fakeTime,
  };
  return { deps, put, append };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('recoveryService.detectPreviousDayMissed', () => {
  it('no-mission → not missed', async () => {
    const { deps } = makeMockDeps({ logs: new Map(), events: [] });
    const svc = createRecoveryService(deps);
    const d = await svc.detectPreviousDayMissed();
    expect(d.missed).toBe(false);
    expect(d.reason).toBe('no-mission');
  });

  it('no-active-routine → not missed', async () => {
    const { deps } = makeMockDeps({
      mission: stubMission(),
      logs: new Map([['2026-05-09', stubDayLog('2026-05-09')]]),
      events: [],
    });
    const svc = createRecoveryService(deps);
    const d = await svc.detectPreviousDayMissed();
    expect(d.missed).toBe(false);
    expect(d.reason).toBe('no-active-routine');
  });

  it('zero-block routine → not missed', async () => {
    const { deps } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(0),
      logs: new Map(),
      events: [],
    });
    const svc = createRecoveryService(deps);
    const d = await svc.detectPreviousDayMissed();
    expect(d.missed).toBe(false);
    expect(d.reason).toBe('zero-block-routine');
  });

  it('yesterday before mission start → not missed', async () => {
    const { deps } = makeMockDeps({
      mission: stubMission({ startDate: '2026-05-10' }),
      routine: stubRoutine(3),
      logs: new Map(),
      events: [],
    });
    const svc = createRecoveryService(deps);
    const d = await svc.detectPreviousDayMissed();
    expect(d.missed).toBe(false);
    expect(d.reason).toBe('before-mission-start');
  });

  it('yesterday complete → not missed', async () => {
    const { deps } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      logs: new Map([
        ['2026-05-09', stubDayLog('2026-05-09', { completedBlockIds: ['b0', 'b1', 'b2'] })],
      ]),
      events: [],
    });
    const svc = createRecoveryService(deps);
    const d = await svc.detectPreviousDayMissed();
    expect(d.missed).toBe(false);
    expect(d.reason).toBe('previous-day-complete');
  });

  it('yesterday incomplete → missed with previousLog', async () => {
    const { deps } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      logs: new Map([
        ['2026-05-09', stubDayLog('2026-05-09', { completedBlockIds: ['b0'] })],
      ]),
      events: [],
    });
    const svc = createRecoveryService(deps);
    const d = await svc.detectPreviousDayMissed();
    expect(d.missed).toBe(true);
    expect(d.reason).toBe('previous-day-incomplete');
    expect(d.previousLog?.id).toBe('dl-2026-05-09');
  });

  it('yesterday absent (mission active) → missed', async () => {
    const { deps } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      logs: new Map(),
      events: [],
    });
    const svc = createRecoveryService(deps);
    const d = await svc.detectPreviousDayMissed();
    expect(d.missed).toBe(true);
    expect(d.reason).toBe('previous-day-absent');
    expect(d.previousLog).toBeUndefined();
  });
});

describe('recoveryService.ensureTodayRecoveryState', () => {
  it('does nothing when detection says not missed', async () => {
    const state: MockState = {
      mission: stubMission(),
      routine: stubRoutine(3),
      logs: new Map([
        ['2026-05-09', stubDayLog('2026-05-09', { completedBlockIds: ['b0', 'b1', 'b2'] })],
        ['2026-05-10', stubDayLog('2026-05-10')],
      ]),
      events: [],
    };
    const { deps, put, append } = makeMockDeps(state);
    const svc = createRecoveryService(deps);
    const result = await svc.ensureTodayRecoveryState();
    expect(result).toBeNull();
    expect(put).not.toHaveBeenCalled();
    expect(append).not.toHaveBeenCalled();
  });

  it('marks today as recovery and emits deferred events for missed blocks', async () => {
    const yesterdayLog = stubDayLog('2026-05-09', { completedBlockIds: ['b0'] });
    const todayLog = stubDayLog('2026-05-10');
    const state: MockState = {
      mission: stubMission(),
      routine: stubRoutine(3),
      logs: new Map([
        ['2026-05-09', yesterdayLog],
        ['2026-05-10', todayLog],
      ]),
      events: [],
    };
    const { deps, put, append } = makeMockDeps(state);
    const svc = createRecoveryService(deps);
    const result = await svc.ensureTodayRecoveryState();

    expect(result?.state).toBe('recovery');
    expect(put).toHaveBeenCalledTimes(1);
    expect(state.logs.get('2026-05-10')?.state).toBe('recovery');
    expect(append).toHaveBeenCalledTimes(2);
    for (const call of append.mock.calls) {
      const evt = call[0] as PromiseEvent;
      expect(evt.kind).toBe('deferred');
      expect(evt.source).toBe('sweep');
      expect(evt.dayLogId).toBe('dl-2026-05-09');
    }
  });

  it('sweep events carry yesterday-end-of-day as their `at`, not the sweep time', async () => {
    // Today's dayStartAt is 2026-05-10T04:00:00.000Z, so end-of-yesterday = 03:59:59.999.
    // Explicitly NOT today's NOW_ISO (2026-05-10T10:00:00.000Z).
    const yesterdayLog = stubDayLog('2026-05-09', { completedBlockIds: [] });
    const todayLog = stubDayLog('2026-05-10');
    const state: MockState = {
      mission: stubMission(),
      routine: stubRoutine(1),
      logs: new Map([
        ['2026-05-09', yesterdayLog],
        ['2026-05-10', todayLog],
      ]),
      events: [],
    };
    const { deps, append } = makeMockDeps(state);
    const svc = createRecoveryService(deps);
    await svc.ensureTodayRecoveryState();
    const evt = append.mock.calls[0]?.[0] as PromiseEvent;
    expect(evt.at).toBe('2026-05-10T03:59:59.999Z');
    expect(evt.createdAt).toBe(NOW_ISO);
    // createdAt (audit) and at (semantic) diverge — that is the intended fix.
    expect(evt.at).not.toBe(evt.createdAt);
  });

  it('is idempotent — running twice does not double-emit', async () => {
    const yesterdayLog = stubDayLog('2026-05-09', { completedBlockIds: ['b0'] });
    const todayLog = stubDayLog('2026-05-10');
    const state: MockState = {
      mission: stubMission(),
      routine: stubRoutine(3),
      logs: new Map([
        ['2026-05-09', yesterdayLog],
        ['2026-05-10', todayLog],
      ]),
      events: [],
    };
    const { deps, append } = makeMockDeps(state);
    const svc = createRecoveryService(deps);
    await svc.ensureTodayRecoveryState();
    const firstCallCount = append.mock.calls.length;
    await svc.ensureTodayRecoveryState();
    expect(append.mock.calls.length).toBe(firstCallCount);
  });

  it('emits no events when previous day is absent (nothing to defer against)', async () => {
    const todayLog = stubDayLog('2026-05-10');
    const state: MockState = {
      mission: stubMission(),
      routine: stubRoutine(3),
      logs: new Map([['2026-05-10', todayLog]]),
      events: [],
    };
    const { deps, put, append } = makeMockDeps(state);
    const svc = createRecoveryService(deps);
    const result = await svc.ensureTodayRecoveryState();
    expect(result?.state).toBe('recovery');
    expect(put).toHaveBeenCalledTimes(1);
    expect(append).not.toHaveBeenCalled();
  });

  it('skips events for blocks the user did complete or skip yesterday', async () => {
    const yesterdayLog = stubDayLog('2026-05-09', {
      completedBlockIds: ['b0'],
      skippedBlockIds: ['b1'],
    });
    const todayLog = stubDayLog('2026-05-10');
    const state: MockState = {
      mission: stubMission(),
      routine: stubRoutine(3),
      logs: new Map([
        ['2026-05-09', yesterdayLog],
        ['2026-05-10', todayLog],
      ]),
      events: [],
    };
    const { deps, append } = makeMockDeps(state);
    const svc = createRecoveryService(deps);
    await svc.ensureTodayRecoveryState();
    expect(append).toHaveBeenCalledTimes(1);
    const evt = append.mock.calls[0]?.[0] as PromiseEvent;
    expect(evt.blockId).toBe('b2');
  });

  it('handles two consecutive missed days — each mount handles only its own yesterday', async () => {
    const day1 = stubDayLog('2026-05-08', { completedBlockIds: ['b0', 'b1', 'b2'] });
    const day2 = stubDayLog('2026-05-09');
    const todayLog = stubDayLog('2026-05-10');
    const state: MockState = {
      mission: stubMission(),
      routine: stubRoutine(3),
      logs: new Map([
        ['2026-05-08', day1],
        ['2026-05-09', day2],
        ['2026-05-10', todayLog],
      ]),
      events: [],
    };
    const { deps, append } = makeMockDeps(state);
    const svc = createRecoveryService(deps);
    const result = await svc.ensureTodayRecoveryState();
    expect(result?.state).toBe('recovery');
    expect(append).toHaveBeenCalledTimes(3);
    for (const call of append.mock.calls) {
      const evt = call[0] as PromiseEvent;
      expect(evt.dayLogId).toBe('dl-2026-05-09');
    }
  });

  it('does not mark or emit when there is no mission', async () => {
    const state: MockState = {
      mission: undefined,
      logs: new Map([['2026-05-10', stubDayLog('2026-05-10')]]),
      events: [],
    };
    const { deps, put, append } = makeMockDeps(state);
    const svc = createRecoveryService(deps);
    const result = await svc.ensureTodayRecoveryState();
    expect(result).toBeNull();
    expect(put).not.toHaveBeenCalled();
    expect(append).not.toHaveBeenCalled();
  });
});
