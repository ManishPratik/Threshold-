import {
  dayLogRepository,
  missionRepository,
  promiseEventRepository,
  routineRepository,
  selfTrustSnapshotRepository,
} from '@data/repositories';
import type { SelfTrustSnapshot } from '@data/types/SelfTrustSnapshot';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import { nowIso, type ISODate } from '@shared/lib/date';
import { V1_CONSTANTS } from './constants';
import { v1SelfTrustStrategy } from './strategies/V1SelfTrustStrategy';
import type { SelfTrustStrategy } from './strategies/SelfTrustStrategy';

/**
 * Self-Trust domain service.
 *
 * - Depends on a SelfTrustStrategy (interface), never on a concrete formula.
 * - Reads/writes go through repositories only.
 * - UI consumes the projection (SelfTrustSnapshot) via getCurrentScore /
 *   getLatestSnapshot — never replays PromiseEvents at render time.
 *
 * The service is exposed as a factory (createSelfTrustService) so tests can
 * inject alternate strategies + mock repositories. A default singleton wired
 * to v1SelfTrustStrategy is exported for app code.
 */

const SCHEMA_VERSION = 1;

export interface SelfTrustServiceDeps {
  missionRepository: typeof missionRepository;
  routineRepository: typeof routineRepository;
  dayLogRepository: typeof dayLogRepository;
  promiseEventRepository: typeof promiseEventRepository;
  snapshotRepository: typeof selfTrustSnapshotRepository;
}

const defaultDeps: SelfTrustServiceDeps = {
  missionRepository,
  routineRepository,
  dayLogRepository,
  promiseEventRepository,
  snapshotRepository: selfTrustSnapshotRepository,
};

export interface SelfTrustService {
  readonly strategyVersion: number;
  getCurrentScore(): Promise<number>;
  getLatestSnapshot(): Promise<SelfTrustSnapshot | undefined>;
  recomputeSnapshotForDate(date: ISODate): Promise<SelfTrustSnapshot | null>;
  recomputeTodaySnapshot(): Promise<SelfTrustSnapshot | null>;
  rebuildAllSnapshots(): Promise<{ snapshotsWritten: number }>;
}

export function createSelfTrustService(
  strategy: SelfTrustStrategy = v1SelfTrustStrategy,
  deps: SelfTrustServiceDeps = defaultDeps,
): SelfTrustService {
  const {
    missionRepository: missions,
    routineRepository: routines,
    dayLogRepository: dayLogs,
    promiseEventRepository: events,
    snapshotRepository: snapshots,
  } = deps;

  async function getTotalScheduledBlocks(missionId: string | null): Promise<number> {
    if (!missionId) return 0;
    const list = await routines.getByMission(missionId);
    const active = list.find((r) => r.active);
    return active?.blocks.length ?? 0;
  }

  async function scoreOneDay(
    date: ISODate,
    previousCumulative: number,
    missionId: string | null,
  ): Promise<SelfTrustSnapshot | null> {
    const dayLog = await dayLogs.getByDate(date);
    if (!dayLog) return null;

    const eventList = await events.getByDayLog(dayLog.id);
    const totalScheduledBlocks = await getTotalScheduledBlocks(missionId);

    const { dailyDelta, breakdown } = strategy.scoreDay({
      events: eventList,
      totalScheduledBlocks,
      completedBlockIds: dayLog.completedBlockIds,
      skippedBlockIds: dayLog.skippedBlockIds,
    });

    const nextCumulative = Math.max(V1_CONSTANTS.scoreFloor, previousCumulative + dailyDelta);
    const now = nowIso();

    const snapshot: SelfTrustSnapshot = {
      id: `snapshot-${date}`,
      createdAt: now,
      updatedAt: now,
      schemaVersion: SCHEMA_VERSION,
      date,
      score: nextCumulative,
      deltaFromYesterday: nextCumulative - previousCumulative,
      inputs: breakdown,
      formulaVersion: strategy.version,
    };
    await snapshots.put(snapshot);
    return snapshot;
  }

  return {
    strategyVersion: strategy.version,

    async getCurrentScore(): Promise<number> {
      const latest = await snapshots.getLatest();
      return latest?.score ?? V1_CONSTANTS.scoreFloor;
    },

    async getLatestSnapshot(): Promise<SelfTrustSnapshot | undefined> {
      return snapshots.getLatest();
    },

    async recomputeSnapshotForDate(date: ISODate): Promise<SelfTrustSnapshot | null> {
      const mission = await missions.getActive();
      // Find the most recent snapshot strictly before `date` to seed the cumulative.
      const priors = await snapshots.getRange('0000-00-00', date);
      const previous = priors
        .filter((s) => s.date < date)
        .sort((a, b) => a.date.localeCompare(b.date))
        .at(-1);
      const previousCumulative = previous?.score ?? V1_CONSTANTS.scoreFloor;
      return scoreOneDay(date, previousCumulative, mission?.id ?? null);
    },

    async recomputeTodaySnapshot(): Promise<SelfTrustSnapshot | null> {
      return this.recomputeSnapshotForDate(currentLogicalDate());
    },

    async rebuildAllSnapshots(): Promise<{ snapshotsWritten: number }> {
      const [mission, allDayLogs] = await Promise.all([missions.getActive(), dayLogs.getAll()]);
      allDayLogs.sort((a, b) => a.date.localeCompare(b.date));
      await snapshots.clear();

      let cumulative: number = V1_CONSTANTS.scoreFloor;
      let written = 0;
      for (const dayLog of allDayLogs) {
        const snap = await scoreOneDay(dayLog.date, cumulative, mission?.id ?? null);
        if (snap) {
          cumulative = snap.score;
          written += 1;
        }
      }
      return { snapshotsWritten: written };
    },
  };
}

/** Default app-wide instance, wired to the V1 strategy. */
export const selfTrustService: SelfTrustService = createSelfTrustService();
