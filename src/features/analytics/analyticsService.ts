import {
  missionRepository,
  noteRepository,
  promiseEventRepository,
  selfTrustSnapshotRepository,
} from '@data/repositories';
import type { Mission } from '@data/types/Mission';
import type { Note } from '@data/types/Note';
import type { PromiseEvent } from '@data/types/PromiseEvent';
import type { SelfTrustSnapshot } from '@data/types/SelfTrustSnapshot';
import { addDays, type ISODate } from '@shared/lib/date';
import { defaultTimeProvider, type TimeProvider } from '@shared/lib/time';
import { getMissionProgress } from '@features/mission-contract';

/**
 * Analytics domain service. Computes read-only aggregates from the repositories
 * for the Analytics screen. No writes. No caching (see Assumptions §5 of the
 * milestone report — the volumes are personal-scale). Every result is reproducible
 * from the underlying stores.
 */

export const DEFAULT_ANALYTICS_WINDOW_DAYS = 30;
export const TOP_TAGS_COUNT = 5;

export interface AnalyticsDeps {
  missionRepository: typeof missionRepository;
  noteRepository: typeof noteRepository;
  promiseEventRepository: typeof promiseEventRepository;
  snapshotRepository: typeof selfTrustSnapshotRepository;
  time: TimeProvider;
}

const defaultDeps: AnalyticsDeps = {
  missionRepository,
  noteRepository,
  promiseEventRepository,
  snapshotRepository: selfTrustSnapshotRepository,
  time: defaultTimeProvider,
};

export interface SelfTrustSummary {
  currentScore: number;
  deltaOverWindow: number;
  windowDays: number;
  snapshotsInWindow: number;
}

export interface ConsistencySummary {
  windowDays: number;
  keptCount: number;
  brokenCount: number;
  deferredCount: number;
  totalEvents: number;
}

export interface MissionSummary {
  present: boolean;
  title: string;
  currentDay: number;
  totalDays: number | null;
  ratio: number | null;
  /** Mirrors MissionProgress.hasStarted — false when today is before the
   *  mission's effective startDate (late-start fair-shift). Consumers must
   *  suppress the day counter and show a "Begins {startDate}" affordance. */
  hasStarted: boolean;
  /** ISO date of the mission's effective startDate, exposed so consumers can
   *  render the "Begins …" affordance without also fetching the mission. */
  startDate: ISODate | null;
}

export interface KnowledgeStats {
  totalActive: number;
  totalTrashed: number;
  topTags: Array<{ tag: string; count: number }>;
}

export interface AnalyticsView {
  windowDays: number;
  windowStart: ISODate;
  windowEnd: ISODate;
  selfTrust: SelfTrustSummary;
  consistency: ConsistencySummary;
  mission: MissionSummary;
  knowledge: KnowledgeStats;
}

// ────────────────────────────────────────────────────────────
// Pure sub-computations (exported for direct unit testing)
// ────────────────────────────────────────────────────────────

export function computeSelfTrustSummary(
  latest: SelfTrustSnapshot | undefined,
  baseline: SelfTrustSnapshot | undefined,
  snapshotsInWindow: SelfTrustSnapshot[],
  windowDays: number,
): SelfTrustSummary {
  const currentScore = latest?.score ?? 0;
  const baselineScore = baseline?.score ?? 0;
  return {
    currentScore,
    deltaOverWindow: currentScore - baselineScore,
    windowDays,
    snapshotsInWindow: snapshotsInWindow.length,
  };
}

export function computeConsistencySummary(
  events: PromiseEvent[],
  windowStartIso: string,
  windowEndIso: string,
  windowDays: number,
): ConsistencySummary {
  let kept = 0;
  let broken = 0;
  let deferred = 0;
  for (const e of events) {
    if (e.at < windowStartIso || e.at > windowEndIso) continue;
    if (e.kind === 'kept') kept += 1;
    else if (e.kind === 'broken') broken += 1;
    else if (e.kind === 'deferred') deferred += 1;
  }
  return {
    windowDays,
    keptCount: kept,
    brokenCount: broken,
    deferredCount: deferred,
    totalEvents: kept + broken + deferred,
  };
}

export function computeMissionSummary(
  mission: Mission | undefined,
  today: ISODate,
): MissionSummary {
  if (!mission) {
    return {
      present: false,
      title: '',
      currentDay: 0,
      totalDays: null,
      ratio: null,
      hasStarted: false,
      startDate: null,
    };
  }
  const p = getMissionProgress(mission, today);
  return {
    present: true,
    title: mission.title,
    currentDay: p.currentDay,
    totalDays: p.totalDays,
    ratio: p.ratio,
    hasStarted: p.hasStarted,
    startDate: mission.startDate,
  };
}

export function computeKnowledgeStats(notes: Note[]): KnowledgeStats {
  let active = 0;
  let trashed = 0;
  const tagCounts = new Map<string, number>();
  for (const n of notes) {
    if (n.deletedAt !== null) {
      trashed += 1;
      continue;
    }
    active += 1;
    for (const t of n.tags) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_TAGS_COUNT)
    .map(([tag, count]) => ({ tag, count }));
  return { totalActive: active, totalTrashed: trashed, topTags };
}

// ────────────────────────────────────────────────────────────
// Assembly
// ────────────────────────────────────────────────────────────

export function createAnalyticsService(deps: AnalyticsDeps = defaultDeps) {
  const {
    missionRepository: missions,
    noteRepository: notes,
    promiseEventRepository: events,
    snapshotRepository: snapshots,
    time,
  } = deps;

  return {
    async getAnalyticsView(
      windowDays: number = DEFAULT_ANALYTICS_WINDOW_DAYS,
    ): Promise<AnalyticsView> {
      const today = time.currentLogicalDate();
      const windowStart = addDays(today, -(windowDays - 1));
      const windowStartIso = `${windowStart}T00:00:00.000Z`;
      const windowEndIso = `${today}T23:59:59.999Z`;

      const [mission, allNotes, allEvents, snapshotsInWindow, baselineCandidates] =
        await Promise.all([
          missions.getActive(),
          notes.getAll(),
          events.getAll(),
          snapshots.getRange(windowStart, today),
          snapshots.getRange('0000-00-00', addDays(windowStart, -1)),
        ]);

      const latest =
        snapshotsInWindow.length > 0
          ? [...snapshotsInWindow].sort((a, b) => b.date.localeCompare(a.date))[0]
          : (await snapshots.getLatest());
      const baseline =
        baselineCandidates.length > 0
          ? [...baselineCandidates].sort((a, b) => b.date.localeCompare(a.date))[0]
          : undefined;

      return {
        windowDays,
        windowStart,
        windowEnd: today,
        selfTrust: computeSelfTrustSummary(latest, baseline, snapshotsInWindow, windowDays),
        consistency: computeConsistencySummary(
          allEvents,
          windowStartIso,
          windowEndIso,
          windowDays,
        ),
        mission: computeMissionSummary(mission, today),
        knowledge: computeKnowledgeStats(allNotes),
      };
    },
  };
}

export const analyticsService = createAnalyticsService();
