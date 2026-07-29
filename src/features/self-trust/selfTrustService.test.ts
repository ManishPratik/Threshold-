import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSelfTrustService, type SelfTrustServiceDeps } from './selfTrustService';
import { v1SelfTrustStrategy } from './strategies/V1SelfTrustStrategy';
import type { SelfTrustStrategy, DailyScoreInput } from './strategies/SelfTrustStrategy';
import type { Mission } from '@data/types/Mission';
import type { Routine } from '@data/types/Routine';
import type { DayLog } from '@data/types/DayLog';
import type { PromiseEvent } from '@data/types/PromiseEvent';
import type { SelfTrustSnapshot } from '@data/types/SelfTrustSnapshot';

function stubMission(): Mission {
  return {
    id: 'm1',
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    title: '',
    statement: '',
    startDate: '2026-01-01',
    endDate: '2026-01-30',
    status: 'active',
    targetMetrics: {},
    notes: '',
    reward: '',
    activatedAt: null,
  };
}

function stubRoutine(blockCount: number): Routine {
  return {
    id: 'r1',
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    name: 'test',
    missionId: 'm1',
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

function stubDayLog(date: string, completed: string[] = [], skipped: string[] = []): DayLog {
  return {
    id: `dl-${date}`,
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    date,
    dayStartAt: '',
    state: 'normal',
    completedBlockIds: completed,
    skippedBlockIds: skipped,
    notes: '',
  };
}

function keptEvent(blockId: string, dayLogId: string): PromiseEvent {
  return {
    id: `pe-${blockId}`,
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    dayLogId,
    kind: 'kept',
    source: 'manual',
    blockId,
    missionId: 'm1',
    at: '',
    note: '',
  };
}

function makeMockDeps(overrides: {
  mission?: Mission | undefined;
  routine?: Routine | undefined;
  dayLogs?: DayLog[];
  eventsByDayLog?: Record<string, PromiseEvent[]>;
  existingSnapshots?: SelfTrustSnapshot[];
}): { deps: SelfTrustServiceDeps; put: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; getLatest: ReturnType<typeof vi.fn> } {
  const snapshots: SelfTrustSnapshot[] = [...(overrides.existingSnapshots ?? [])];
  const put = vi.fn(async (snap: SelfTrustSnapshot) => {
    const existingIdx = snapshots.findIndex((s) => s.id === snap.id);
    if (existingIdx >= 0) snapshots[existingIdx] = snap;
    else snapshots.push(snap);
  });
  const clear = vi.fn(async () => {
    snapshots.length = 0;
  });
  const getLatest = vi.fn(async () => {
    if (snapshots.length === 0) return undefined;
    return [...snapshots].sort((a, b) => b.date.localeCompare(a.date))[0];
  });
  const deps: SelfTrustServiceDeps = {
    missionRepository: {
      getActive: vi.fn(async () => overrides.mission),
    } as unknown as SelfTrustServiceDeps['missionRepository'],
    routineRepository: {
      getByMission: vi.fn(async () => (overrides.routine ? [overrides.routine] : [])),
    } as unknown as SelfTrustServiceDeps['routineRepository'],
    dayLogRepository: {
      getAll: vi.fn(async () => overrides.dayLogs ?? []),
      getByDate: vi.fn(async (date: string) =>
        (overrides.dayLogs ?? []).find((d) => d.date === date),
      ),
    } as unknown as SelfTrustServiceDeps['dayLogRepository'],
    promiseEventRepository: {
      getByDayLog: vi.fn(async (id: string) => overrides.eventsByDayLog?.[id] ?? []),
    } as unknown as SelfTrustServiceDeps['promiseEventRepository'],
    snapshotRepository: {
      getLatest,
      getRange: vi.fn(async (start: string, end: string) =>
        snapshots.filter((s) => s.date >= start && s.date <= end),
      ),
      put,
      clear,
    } as unknown as SelfTrustServiceDeps['snapshotRepository'],
  };
  return { deps, put, clear, getLatest };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('createSelfTrustService — getCurrentScore', () => {
  it('returns 0 when no snapshots exist', async () => {
    const { deps } = makeMockDeps({});
    const service = createSelfTrustService(v1SelfTrustStrategy, deps);
    expect(await service.getCurrentScore()).toBe(0);
  });

  it('returns the latest snapshot score when snapshots exist', async () => {
    const snap: SelfTrustSnapshot = {
      id: 'snapshot-2026-05-10',
      createdAt: '',
      updatedAt: '',
      schemaVersion: 1,
      date: '2026-05-10',
      score: 42,
      deltaFromYesterday: 2,
      inputs: {},
      formulaVersion: 1,
    };
    const { deps } = makeMockDeps({ existingSnapshots: [snap] });
    const service = createSelfTrustService(v1SelfTrustStrategy, deps);
    expect(await service.getCurrentScore()).toBe(42);
  });
});

describe('createSelfTrustService — recomputeSnapshotForDate', () => {
  it('produces a snapshot from a day log + events + routine', async () => {
    const dl = stubDayLog('2026-05-10', ['b0', 'b1']);
    const { deps, put } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      dayLogs: [dl],
      eventsByDayLog: { [dl.id]: [keptEvent('b0', dl.id), keptEvent('b1', dl.id)] },
    });
    const service = createSelfTrustService(v1SelfTrustStrategy, deps);

    const snap = await service.recomputeSnapshotForDate('2026-05-10');
    expect(snap).not.toBeNull();
    expect(snap?.score).toBe(2); // 2 kept, no bonus (2 of 3 done)
    expect(snap?.deltaFromYesterday).toBe(2);
    expect(snap?.formulaVersion).toBe(v1SelfTrustStrategy.version);
    expect(put).toHaveBeenCalledTimes(1);
  });

  it('applies the score floor at zero', async () => {
    // Prior snapshot: score 1. Today: broken event = -2. Cumulative = max(0, 1 - 2) = 0.
    const dl = stubDayLog('2026-05-11');
    const prior: SelfTrustSnapshot = {
      id: 'snapshot-2026-05-10',
      createdAt: '',
      updatedAt: '',
      schemaVersion: 1,
      date: '2026-05-10',
      score: 1,
      deltaFromYesterday: 1,
      inputs: {},
      formulaVersion: 1,
    };
    const brokenEvt: PromiseEvent = {
      id: 'x',
      createdAt: '',
      updatedAt: '',
      schemaVersion: 1,
      dayLogId: dl.id,
      kind: 'broken',
      source: 'manual',
      blockId: 'b',
      missionId: 'm1',
      at: '',
      note: '',
    };
    const { deps } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      dayLogs: [dl],
      eventsByDayLog: { [dl.id]: [brokenEvt] },
      existingSnapshots: [prior],
    });
    const service = createSelfTrustService(v1SelfTrustStrategy, deps);
    const snap = await service.recomputeSnapshotForDate('2026-05-11');
    expect(snap?.score).toBe(0);
    expect(snap?.deltaFromYesterday).toBe(-1); // 0 - 1
  });

  it('awards the full-day bonus when every scheduled block completes', async () => {
    const dl = stubDayLog('2026-05-10', ['b0', 'b1', 'b2']);
    const { deps } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      dayLogs: [dl],
      eventsByDayLog: {
        [dl.id]: [keptEvent('b0', dl.id), keptEvent('b1', dl.id), keptEvent('b2', dl.id)],
      },
    });
    const service = createSelfTrustService(v1SelfTrustStrategy, deps);
    const snap = await service.recomputeSnapshotForDate('2026-05-10');
    expect(snap?.score).toBe(6); // 3 kept + 3 bonus
  });

  it('returns null when no day log exists for the date', async () => {
    const { deps, put } = makeMockDeps({ mission: stubMission(), routine: stubRoutine(3) });
    const service = createSelfTrustService(v1SelfTrustStrategy, deps);
    const snap = await service.recomputeSnapshotForDate('2026-05-10');
    expect(snap).toBeNull();
    expect(put).not.toHaveBeenCalled();
  });
});

describe('createSelfTrustService — rebuildAllSnapshots', () => {
  it('processes day logs chronologically and returns a running cumulative', async () => {
    const dl1 = stubDayLog('2026-05-10', ['b0']);
    const dl2 = stubDayLog('2026-05-11', ['b0', 'b1', 'b2']);
    const { deps, clear, put } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      // Intentionally out of order to prove chronological sort happens inside.
      dayLogs: [dl2, dl1],
      eventsByDayLog: {
        [dl1.id]: [keptEvent('b0', dl1.id)],
        [dl2.id]: [
          keptEvent('b0', dl2.id),
          keptEvent('b1', dl2.id),
          keptEvent('b2', dl2.id),
        ],
      },
    });
    const service = createSelfTrustService(v1SelfTrustStrategy, deps);
    const { snapshotsWritten } = await service.rebuildAllSnapshots();
    expect(clear).toHaveBeenCalledTimes(1);
    expect(snapshotsWritten).toBe(2);
    expect(put).toHaveBeenCalledTimes(2);

    // Day 1: +1 kept, no bonus → 1
    // Day 2: +3 kept, +3 bonus → 6, cumulative 7
    const calls = put.mock.calls;
    const day1Snap = calls.find((c) => (c[0] as SelfTrustSnapshot).date === '2026-05-10')?.[0] as SelfTrustSnapshot;
    const day2Snap = calls.find((c) => (c[0] as SelfTrustSnapshot).date === '2026-05-11')?.[0] as SelfTrustSnapshot;
    expect(day1Snap.score).toBe(1);
    expect(day2Snap.score).toBe(7);
  });
});

describe('createSelfTrustService — strategy version and switching', () => {
  it('stamps the strategy version onto every snapshot', async () => {
    const dl = stubDayLog('2026-05-10', ['b0']);
    const { deps, put } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      dayLogs: [dl],
      eventsByDayLog: { [dl.id]: [keptEvent('b0', dl.id)] },
    });
    const service = createSelfTrustService(v1SelfTrustStrategy, deps);
    await service.recomputeSnapshotForDate('2026-05-10');
    const written = put.mock.calls[0]?.[0] as SelfTrustSnapshot;
    expect(written.formulaVersion).toBe(1);
  });

  it('is swappable — a synthetic V2 strategy produces different output for the same input', async () => {
    // Synthetic V2: every kept promise is worth +10, no bonus, no floor.
    const v2: SelfTrustStrategy = {
      version: 2,
      name: 'TestV2Strategy',
      scoreDay(input: DailyScoreInput) {
        const kept = input.events.filter((e) => e.kind === 'kept').length;
        return { dailyDelta: kept * 10, breakdown: { kept, keptPoints: kept * 10 } };
      },
    };
    const dl = stubDayLog('2026-05-10', ['b0']);
    const { deps: v1Deps } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      dayLogs: [dl],
      eventsByDayLog: { [dl.id]: [keptEvent('b0', dl.id)] },
    });
    const { deps: v2Deps } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      dayLogs: [dl],
      eventsByDayLog: { [dl.id]: [keptEvent('b0', dl.id)] },
    });
    const s1 = createSelfTrustService(v1SelfTrustStrategy, v1Deps);
    const s2 = createSelfTrustService(v2, v2Deps);
    const snap1 = await s1.recomputeSnapshotForDate('2026-05-10');
    const snap2 = await s2.recomputeSnapshotForDate('2026-05-10');
    expect(snap1?.score).toBe(1);
    expect(snap2?.score).toBe(10);
    expect(snap1?.formulaVersion).toBe(1);
    expect(snap2?.formulaVersion).toBe(2);
  });
});

describe('createSelfTrustService — historical replay respects previous cumulative', () => {
  it('recomputeSnapshotForDate uses the snapshot immediately before the target date', async () => {
    const dl = stubDayLog('2026-05-11', ['b0']);
    const priorSnap: SelfTrustSnapshot = {
      id: 'snapshot-2026-05-10',
      createdAt: '',
      updatedAt: '',
      schemaVersion: 1,
      date: '2026-05-10',
      score: 5,
      deltaFromYesterday: 5,
      inputs: {},
      formulaVersion: 1,
    };
    const { deps } = makeMockDeps({
      mission: stubMission(),
      routine: stubRoutine(3),
      dayLogs: [dl],
      eventsByDayLog: { [dl.id]: [keptEvent('b0', dl.id)] },
      existingSnapshots: [priorSnap],
    });
    const service = createSelfTrustService(v1SelfTrustStrategy, deps);
    const snap = await service.recomputeSnapshotForDate('2026-05-11');
    expect(snap?.score).toBe(6);
    expect(snap?.deltaFromYesterday).toBe(1);
  });
});
