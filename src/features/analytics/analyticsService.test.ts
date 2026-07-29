import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeConsistencySummary,
  computeKnowledgeStats,
  computeMissionSummary,
  computeSelfTrustSummary,
  createAnalyticsService,
  DEFAULT_ANALYTICS_WINDOW_DAYS,
  TOP_TAGS_COUNT,
  type AnalyticsDeps,
} from './analyticsService';
import type { TimeProvider } from '@shared/lib/time';
import type { Mission } from '@data/types/Mission';
import type { Note } from '@data/types/Note';
import type { PromiseEvent } from '@data/types/PromiseEvent';
import type { SelfTrustSnapshot } from '@data/types/SelfTrustSnapshot';

const TODAY = '2026-05-10';
const NOW = '2026-05-10T10:00:00.000Z';
const fakeTime: TimeProvider = {
  nowIso: () => NOW,
  currentLogicalDate: () => TODAY,
};

function stubMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'm1',
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    title: 'A mission',
    statement: '',
    startDate: '2026-05-01',
    endDate: '2026-05-30',
    status: 'active',
    targetMetrics: {},
    notes: '',
    reward: '',
    activatedAt: null,
    ...overrides,
  };
}

function stubSnapshot(date: string, score: number): SelfTrustSnapshot {
  return {
    id: `snapshot-${date}`,
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    date,
    score,
    deltaFromYesterday: 0,
    inputs: {},
    formulaVersion: 1,
  };
}

function stubNote(overrides: Partial<Note> = {}): Note {
  return {
    id: `n-${Math.random()}`,
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    title: 't',
    body: 'b',
    tags: [],
    deletedAt: null,
    ...overrides,
  };
}

function stubEvent(kind: PromiseEvent['kind'], at: string): PromiseEvent {
  return {
    id: `e-${Math.random()}`,
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    dayLogId: 'd',
    kind,
    source: 'manual',
    blockId: null,
    missionId: null,
    at,
    note: '',
  };
}

interface MockState {
  mission?: Mission | undefined;
  notesAll: Note[];
  eventsAll: PromiseEvent[];
  snapshotsAll: SelfTrustSnapshot[];
}

function makeDeps(state: MockState): AnalyticsDeps {
  return {
    missionRepository: {
      getActive: vi.fn(async () => state.mission),
    } as unknown as AnalyticsDeps['missionRepository'],
    noteRepository: {
      getAll: vi.fn(async () => state.notesAll),
    } as unknown as AnalyticsDeps['noteRepository'],
    promiseEventRepository: {
      getAll: vi.fn(async () => state.eventsAll),
    } as unknown as AnalyticsDeps['promiseEventRepository'],
    snapshotRepository: {
      getRange: vi.fn(async (start: string, end: string) =>
        state.snapshotsAll.filter((s) => s.date >= start && s.date <= end),
      ),
      getLatest: vi.fn(async () => {
        if (state.snapshotsAll.length === 0) return undefined;
        return [...state.snapshotsAll].sort((a, b) => b.date.localeCompare(a.date))[0];
      }),
    } as unknown as AnalyticsDeps['snapshotRepository'],
    time: fakeTime,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('computeSelfTrustSummary', () => {
  it('returns zeros when there is no data', () => {
    expect(computeSelfTrustSummary(undefined, undefined, [], 30)).toEqual({
      currentScore: 0,
      deltaOverWindow: 0,
      windowDays: 30,
      snapshotsInWindow: 0,
    });
  });

  it('delta uses the baseline score when both endpoints exist', () => {
    const baseline = stubSnapshot('2026-04-10', 4);
    const latest = stubSnapshot('2026-05-10', 12);
    const inWindow = [stubSnapshot('2026-04-15', 5), latest];
    expect(computeSelfTrustSummary(latest, baseline, inWindow, 30)).toEqual({
      currentScore: 12,
      deltaOverWindow: 8,
      windowDays: 30,
      snapshotsInWindow: 2,
    });
  });

  it('delta uses zero baseline when the window starts before any snapshot', () => {
    const latest = stubSnapshot('2026-05-10', 5);
    expect(computeSelfTrustSummary(latest, undefined, [latest], 30)).toEqual({
      currentScore: 5,
      deltaOverWindow: 5,
      windowDays: 30,
      snapshotsInWindow: 1,
    });
  });
});

describe('computeConsistencySummary', () => {
  const start = '2026-05-01T00:00:00.000Z';
  const end = '2026-05-30T23:59:59.999Z';

  it('buckets events by kind within the window', () => {
    const events = [
      stubEvent('kept', '2026-05-05T10:00:00.000Z'),
      stubEvent('kept', '2026-05-06T10:00:00.000Z'),
      stubEvent('broken', '2026-05-07T10:00:00.000Z'),
      stubEvent('deferred', '2026-05-08T10:00:00.000Z'),
    ];
    expect(computeConsistencySummary(events, start, end, 30)).toEqual({
      windowDays: 30,
      keptCount: 2,
      brokenCount: 1,
      deferredCount: 1,
      totalEvents: 4,
    });
  });

  it('excludes events outside the window on both sides', () => {
    const events = [
      stubEvent('kept', '2026-04-30T10:00:00.000Z'), // before
      stubEvent('kept', '2026-05-10T10:00:00.000Z'), // inside
      stubEvent('broken', '2026-06-01T00:00:00.000Z'), // after
    ];
    expect(computeConsistencySummary(events, start, end, 30).totalEvents).toBe(1);
  });

  it('returns zeros for an empty event list', () => {
    expect(computeConsistencySummary([], start, end, 30).totalEvents).toBe(0);
  });
});

describe('computeMissionSummary', () => {
  it('returns { present: false } when no mission is active', () => {
    const summary = computeMissionSummary(undefined, TODAY);
    expect(summary.present).toBe(false);
    expect(summary.title).toBe('');
  });

  it('derives progress from the mission', () => {
    const summary = computeMissionSummary(stubMission(), TODAY);
    expect(summary.present).toBe(true);
    expect(summary.title).toBe('A mission');
    expect(summary.currentDay).toBeGreaterThan(0);
    expect(summary.totalDays).toBeGreaterThan(0);
    expect(summary.ratio).toBeGreaterThan(0);
  });
});

describe('computeKnowledgeStats', () => {
  it('splits active vs deleted and returns top tags', () => {
    const notes = [
      stubNote({ deletedAt: null, tags: ['focus', 'reading'] }),
      stubNote({ deletedAt: null, tags: ['focus'] }),
      stubNote({ deletedAt: '2026-05-01T00:00:00.000Z', tags: ['focus'] }),
      stubNote({ deletedAt: null, tags: ['reading', 'calm'] }),
    ];
    const stats = computeKnowledgeStats(notes);
    expect(stats.totalActive).toBe(3);
    expect(stats.totalTrashed).toBe(1);
    // 'focus' appears in 2 active notes (deleted note tag ignored),
    // 'reading' in 2, 'calm' in 1.
    expect(stats.topTags.length).toBeLessThanOrEqual(TOP_TAGS_COUNT);
    expect(stats.topTags[0]?.count).toBe(2);
  });

  it('sorts ties alphabetically', () => {
    const notes = [
      stubNote({ tags: ['zeta', 'alpha'] }),
      stubNote({ tags: ['zeta', 'alpha'] }),
    ];
    const stats = computeKnowledgeStats(notes);
    expect(stats.topTags.map((t) => t.tag)).toEqual(['alpha', 'zeta']);
  });

  it('handles empty note list', () => {
    expect(computeKnowledgeStats([])).toEqual({
      totalActive: 0,
      totalTrashed: 0,
      topTags: [],
    });
  });
});

describe('createAnalyticsService.getAnalyticsView', () => {
  it('assembles an AnalyticsView using the default window', async () => {
    const state: MockState = {
      mission: stubMission(),
      notesAll: [stubNote({ tags: ['x'] })],
      eventsAll: [stubEvent('kept', '2026-05-08T09:00:00.000Z')],
      snapshotsAll: [stubSnapshot('2026-05-08', 3), stubSnapshot('2026-05-10', 5)],
    };
    const svc = createAnalyticsService(makeDeps(state));
    const view = await svc.getAnalyticsView();
    expect(view.windowDays).toBe(DEFAULT_ANALYTICS_WINDOW_DAYS);
    expect(view.windowEnd).toBe(TODAY);
    expect(view.selfTrust.currentScore).toBe(5);
    expect(view.consistency.keptCount).toBe(1);
    expect(view.mission.present).toBe(true);
    expect(view.knowledge.totalActive).toBe(1);
  });

  it('respects a caller-supplied windowDays', async () => {
    const state: MockState = {
      notesAll: [],
      eventsAll: [],
      snapshotsAll: [],
    };
    const svc = createAnalyticsService(makeDeps(state));
    const view = await svc.getAnalyticsView(7);
    expect(view.windowDays).toBe(7);
    expect(view.windowStart).toBe('2026-05-04');
  });

  it('handles the empty-app state without throwing', async () => {
    const svc = createAnalyticsService(
      makeDeps({ notesAll: [], eventsAll: [], snapshotsAll: [] }),
    );
    const view = await svc.getAnalyticsView();
    expect(view.selfTrust.currentScore).toBe(0);
    expect(view.consistency.totalEvents).toBe(0);
    expect(view.mission.present).toBe(false);
    expect(view.knowledge.totalActive).toBe(0);
  });
});
