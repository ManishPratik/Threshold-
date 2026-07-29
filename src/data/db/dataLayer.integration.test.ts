import { describe, it, expect, beforeEach } from 'vitest';
import { closeDb, deleteDb, getDb } from './client';
import { BOOTSTRAP_ID_PREFIX, purgeBootstrap } from './seed';
import { STORES } from './schema';
import {
  dayLogRepository,
  missionRepository,
  promiseEventRepository,
  routineRepository,
  selfTrustSnapshotRepository,
} from '@data/repositories';
import type { Mission } from '@data/types/Mission';
import type { Routine } from '@data/types/Routine';
import type { DayLog } from '@data/types/DayLog';
import type { PromiseEvent } from '@data/types/PromiseEvent';
import type { SelfTrustSnapshot } from '@data/types/SelfTrustSnapshot';

/**
 * Real-IndexedDB integration tests using fake-indexeddb (polyfilled in
 * src/test/setup.ts). Each test starts with the DB deleted so behaviour is
 * deterministic. The bootstrap seed still runs the first time getDb() is
 * called per test — tests that need a clean store call the appropriate
 * repository.clear() or purgeBootstrap() as their first step.
 */

const now = '2026-05-10T10:00:00.000Z';

function stubMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-x',
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    title: 'Test',
    statement: 'Why',
    startDate: '2026-05-01',
    endDate: '2026-06-01',
    status: 'active',
    targetMetrics: {},
    notes: '',
    reward: '',
    activatedAt: now,
    ...overrides,
  };
}

function stubRoutine(id: string, missionId: string, blockCount = 2): Routine {
  return {
    id,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    name: 'Routine',
    missionId,
    active: true,
    blocks: Array.from({ length: blockCount }, (_, i) => ({
      id: `${id}-b${i}`,
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
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    date,
    dayStartAt: `${date}T04:00:00.000Z`,
    state: 'normal',
    completedBlockIds: [],
    skippedBlockIds: [],
    notes: '',
    ...overrides,
  };
}

function stubEvent(id: string, dayLogId: string, kind: PromiseEvent['kind'] = 'kept'): PromiseEvent {
  return {
    id,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    dayLogId,
    kind,
    source: 'manual',
    blockId: null,
    missionId: null,
    at: now,
    note: '',
  };
}

function stubSnapshot(date: string, score: number): SelfTrustSnapshot {
  return {
    id: `snapshot-${date}`,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    date,
    score,
    deltaFromYesterday: 0,
    inputs: {},
    formulaVersion: 1,
  };
}

beforeEach(async () => {
  await deleteDb();
});

describe('data layer — DB open + schema', () => {
  it('opens the DB and creates every declared store', async () => {
    const db = await getDb();
    for (const store of Object.values(STORES)) {
      expect(db.objectStoreNames.contains(store)).toBe(true);
    }
  });

  it('runs the bootstrap seed exactly once per DB open', async () => {
    await getDb(); // triggers seedIfEmpty
    const missions1 = await missionRepository.getAll();
    // Re-invoking getDb reuses the memoised promise — no re-seed.
    await getDb();
    const missions2 = await missionRepository.getAll();
    expect(missions1.length).toBe(1);
    expect(missions2.length).toBe(1);
    expect(missions1[0]?.id).toBe(missions2[0]?.id);
  });

  it('does not re-seed after a real Mission replaces bootstrap', async () => {
    await getDb();
    await purgeBootstrap({ missionRepository, routineRepository, dayLogRepository });
    const real = stubMission({ id: 'real-1', status: 'active' });
    await missionRepository.put(real);
    // Close + reopen — seedIfEmpty runs again but is gated by an active Mission.
    await closeDb();
    await getDb();
    const all = await missionRepository.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe('real-1');
  });
});

describe('data layer — Repository base', () => {
  it('deleteByIdPrefix removes matching rows and returns the count', async () => {
    await getDb();
    await missionRepository.clear();
    await missionRepository.put(stubMission({ id: 'bootstrap-mission-01' }));
    await missionRepository.put(stubMission({ id: 'bootstrap-mission-02', status: 'archived' }));
    await missionRepository.put(stubMission({ id: 'real-mission-01', status: 'archived' }));
    const removed = await missionRepository.deleteByIdPrefix(BOOTSTRAP_ID_PREFIX);
    expect(removed).toBe(2);
    const remaining = await missionRepository.getAll();
    expect(remaining.map((m) => m.id)).toEqual(['real-mission-01']);
  });

  it('putMany writes every entity atomically', async () => {
    await getDb();
    await missionRepository.clear();
    const missions = [
      stubMission({ id: 'a', status: 'archived' }),
      stubMission({ id: 'b', status: 'archived' }),
      stubMission({ id: 'c', status: 'archived' }),
    ];
    await missionRepository.putMany(missions);
    const all = await missionRepository.getAll();
    expect(all).toHaveLength(3);
    expect(new Set(all.map((m) => m.id))).toEqual(new Set(['a', 'b', 'c']));
  });

  it('count reflects the live store size', async () => {
    await getDb();
    await missionRepository.clear();
    expect(await missionRepository.count()).toBe(0);
    await missionRepository.put(stubMission({ id: 'x', status: 'archived' }));
    expect(await missionRepository.count()).toBe(1);
  });
});

describe('data layer — MissionRepository', () => {
  it('getActive returns the record indexed by status=active', async () => {
    await getDb();
    await missionRepository.clear();
    await missionRepository.put(stubMission({ id: 'archived-1', status: 'archived' }));
    await missionRepository.put(stubMission({ id: 'active-1', status: 'active' }));
    const active = await missionRepository.getActive();
    expect(active?.id).toBe('active-1');
  });

  it('getActive returns undefined when no mission is active', async () => {
    await getDb();
    await missionRepository.clear();
    await missionRepository.put(stubMission({ id: 'a', status: 'archived' }));
    expect(await missionRepository.getActive()).toBeUndefined();
  });
});

describe('data layer — RoutineRepository', () => {
  it('getByMission uses the by-missionId index', async () => {
    await getDb();
    await routineRepository.clear();
    await routineRepository.put(stubRoutine('r1', 'mission-A'));
    await routineRepository.put(stubRoutine('r2', 'mission-B'));
    await routineRepository.put(stubRoutine('r3', 'mission-A'));
    const forA = await routineRepository.getByMission('mission-A');
    expect(forA.map((r) => r.id).sort()).toEqual(['r1', 'r3']);
  });

  it('replaceAllForMission removes old routines and inserts the new set atomically', async () => {
    await getDb();
    await routineRepository.clear();
    await routineRepository.put(stubRoutine('old-1', 'mission-X'));
    await routineRepository.put(stubRoutine('old-2', 'mission-X'));
    await routineRepository.put(stubRoutine('untouched', 'mission-Y'));

    await routineRepository.replaceAllForMission('mission-X', [stubRoutine('new-1', 'mission-X')]);

    const xs = await routineRepository.getByMission('mission-X');
    expect(xs.map((r) => r.id)).toEqual(['new-1']);
    const ys = await routineRepository.getByMission('mission-Y');
    expect(ys.map((r) => r.id)).toEqual(['untouched']);
  });

  it('replaceAllForMission preserves an id already in the new set', async () => {
    await getDb();
    await routineRepository.clear();
    await routineRepository.put(stubRoutine('reused', 'mission-X'));
    await routineRepository.put(stubRoutine('dropped', 'mission-X'));

    const updated = stubRoutine('reused', 'mission-X', 4);
    await routineRepository.replaceAllForMission('mission-X', [updated]);

    const xs = await routineRepository.getByMission('mission-X');
    expect(xs).toHaveLength(1);
    expect(xs[0]?.id).toBe('reused');
    expect(xs[0]?.blocks).toHaveLength(4);
  });
});

describe('data layer — DayLogRepository', () => {
  it('getByDate uses the unique by-date index', async () => {
    await getDb();
    await dayLogRepository.clear();
    await dayLogRepository.put(stubDayLog('2026-05-09'));
    await dayLogRepository.put(stubDayLog('2026-05-10'));
    const d = await dayLogRepository.getByDate('2026-05-10');
    expect(d?.id).toBe('dl-2026-05-10');
  });

  it('by-date is unique — putting a second row for the same date rejects', async () => {
    await getDb();
    await dayLogRepository.clear();
    await dayLogRepository.put(stubDayLog('2026-05-10', { id: 'first' }));
    await expect(
      dayLogRepository.put(stubDayLog('2026-05-10', { id: 'second' })),
    ).rejects.toThrow();
  });

  it('getRange returns rows inside the bounded date interval', async () => {
    await getDb();
    await dayLogRepository.clear();
    await dayLogRepository.put(stubDayLog('2026-05-01'));
    await dayLogRepository.put(stubDayLog('2026-05-05'));
    await dayLogRepository.put(stubDayLog('2026-05-10'));
    const range = await dayLogRepository.getRange('2026-05-03', '2026-05-08');
    expect(range.map((d) => d.date)).toEqual(['2026-05-05']);
  });

  it('markBlockCompleted appends the block id and is idempotent', async () => {
    await getDb();
    await dayLogRepository.clear();
    const seeded = stubDayLog('2026-05-10', { id: 'dl-x', completedBlockIds: [] });
    await dayLogRepository.put(seeded);

    const after1 = await dayLogRepository.markBlockCompleted('dl-x', 'block-1');
    expect(after1.completedBlockIds).toEqual(['block-1']);

    const after2 = await dayLogRepository.markBlockCompleted('dl-x', 'block-1');
    expect(after2.completedBlockIds).toEqual(['block-1']);

    const after3 = await dayLogRepository.markBlockCompleted('dl-x', 'block-2');
    expect(after3.completedBlockIds).toEqual(['block-1', 'block-2']);
  });
});

describe('data layer — PromiseEventRepository', () => {
  it('append persists an event', async () => {
    await getDb();
    await promiseEventRepository.clear();
    await promiseEventRepository.append(stubEvent('e1', 'd1'));
    const all = await promiseEventRepository.getAll();
    expect(all.map((e) => e.id)).toEqual(['e1']);
  });

  it('append rejects a duplicate id — append-only invariant', async () => {
    await getDb();
    await promiseEventRepository.clear();
    await promiseEventRepository.append(stubEvent('e1', 'd1'));
    await expect(promiseEventRepository.append(stubEvent('e1', 'd1'))).rejects.toThrow();
  });

  it('getByDayLog uses the by-dayLogId index', async () => {
    await getDb();
    await promiseEventRepository.clear();
    await promiseEventRepository.append(stubEvent('e1', 'day-A'));
    await promiseEventRepository.append(stubEvent('e2', 'day-B'));
    await promiseEventRepository.append(stubEvent('e3', 'day-A'));
    const dayA = await promiseEventRepository.getByDayLog('day-A');
    expect(dayA.map((e) => e.id).sort()).toEqual(['e1', 'e3']);
  });
});

describe('data layer — SelfTrustSnapshotRepository', () => {
  it('getLatest returns the snapshot with the largest date via reverse cursor', async () => {
    await getDb();
    await selfTrustSnapshotRepository.clear();
    await selfTrustSnapshotRepository.put(stubSnapshot('2026-05-01', 5));
    await selfTrustSnapshotRepository.put(stubSnapshot('2026-05-10', 12));
    await selfTrustSnapshotRepository.put(stubSnapshot('2026-05-05', 8));
    const latest = await selfTrustSnapshotRepository.getLatest();
    expect(latest?.date).toBe('2026-05-10');
    expect(latest?.score).toBe(12);
  });

  it('getLatest returns undefined on an empty store', async () => {
    await getDb();
    await selfTrustSnapshotRepository.clear();
    expect(await selfTrustSnapshotRepository.getLatest()).toBeUndefined();
  });

  it('getByDate returns exactly one snapshot per unique date', async () => {
    await getDb();
    await selfTrustSnapshotRepository.clear();
    await selfTrustSnapshotRepository.put(stubSnapshot('2026-05-05', 7));
    const s = await selfTrustSnapshotRepository.getByDate('2026-05-05');
    expect(s?.score).toBe(7);
  });
});

describe('data layer — purgeBootstrap', () => {
  it('removes bootstrap-prefixed rows across missions, routines, and dayLogs', async () => {
    await getDb(); // seed writes 1 mission + 1 routine + 1 dayLog with bootstrap ids
    await missionRepository.put(stubMission({ id: 'real-mission-1', status: 'archived' }));
    await routineRepository.put(stubRoutine('real-routine-1', 'real-mission-1'));
    await dayLogRepository.put(stubDayLog('2020-01-01', { id: 'real-daylog-1' }));

    const removed = await purgeBootstrap({
      missionRepository,
      routineRepository,
      dayLogRepository,
    });

    expect(removed.missionsRemoved).toBe(1);
    expect(removed.routinesRemoved).toBe(1);
    expect(removed.dayLogsRemoved).toBe(1);

    const missions = await missionRepository.getAll();
    const routines = await routineRepository.getAll();
    const dayLogs = await dayLogRepository.getAll();
    expect(missions.map((m) => m.id)).toEqual(['real-mission-1']);
    expect(routines.map((r) => r.id)).toEqual(['real-routine-1']);
    expect(dayLogs.map((d) => d.id)).toEqual(['real-daylog-1']);
  });
});
