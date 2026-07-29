import { isBootstrapMission } from '@data/db/seed';
import {
  dayLogRepository,
  missionRepository,
  promiseEventRepository,
  routineRepository,
} from '@data/repositories';
import type { DayLog } from '@data/types/DayLog';
import type { Mission } from '@data/types/Mission';
import type { Routine } from '@data/types/Routine';
import { addDays, type ISODate } from '@shared/lib/date';
import { generateId } from '@shared/lib/id';
import { defaultTimeProvider, type TimeProvider } from '@shared/lib/time';

/**
 * Recovery domain service. Owns the decision "is today a recovery day?" and
 * emits the PromiseEvents that record the missed-block reality so the future
 * V2 Self-Trust strategy can consume them. Repositories remain persistence
 * only. All time-sensitive logic (the 04:00 logical-day boundary) is centralised
 * behind a TimeProvider (src/shared/lib/time.ts) so tests can inject fakes
 * without module-level mocking.
 *
 * A day is "missed" when required routine blocks remain incomplete after the
 * logical day closes. Entering Recovery is automatic; exiting Recovery is
 * automatic (today just is not a recovery day when yesterday was complete).
 * There is no manual toggle.
 */

const SCHEMA_VERSION = 1;
const ONE_MS = 1;

export interface RecoveryDeps {
  missionRepository: typeof missionRepository;
  routineRepository: typeof routineRepository;
  dayLogRepository: typeof dayLogRepository;
  promiseEventRepository: typeof promiseEventRepository;
  time: TimeProvider;
}

const defaultDeps: RecoveryDeps = {
  missionRepository,
  routineRepository,
  dayLogRepository,
  promiseEventRepository,
  time: defaultTimeProvider,
};

export interface RecoveryDetection {
  /** True when today should be marked as a recovery day. */
  missed: boolean;
  /** Yesterday's DayLog if it exists — used to emit deferred events for missed blocks. */
  previousLog: DayLog | undefined;
  /** Reason the detection came out the way it did (for tests + observability). */
  reason:
    | 'no-mission'
    | 'bootstrap-mission'
    | 'no-active-routine'
    | 'zero-block-routine'
    | 'before-mission-start'
    | 'previous-day-complete'
    | 'previous-day-incomplete'
    | 'previous-day-absent';
}

export interface RecoveryService {
  /**
   * Idempotent. Called on every Today mount. If yesterday was missed, marks
   * today's DayLog `state = 'recovery'` (if not already) and emits deferred
   * PromiseEvents for each block yesterday did not touch. Returns the updated
   * DayLog when a state change happened, otherwise null.
   */
  ensureTodayRecoveryState(): Promise<DayLog | null>;

  /** Pure detection — no writes. Exposed for tests and diagnostics. */
  detectPreviousDayMissed(today?: ISODate): Promise<RecoveryDetection>;
}

export function createRecoveryService(deps: RecoveryDeps = defaultDeps): RecoveryService {
  const {
    missionRepository: missions,
    routineRepository: routines,
    dayLogRepository: dayLogs,
    promiseEventRepository: events,
    time,
  } = deps;

  async function loadActiveRoutine(mission: Mission): Promise<Routine | null> {
    const list = await routines.getByMission(mission.id);
    return list.find((r) => r.active) ?? null;
  }

  async function detect(today: ISODate): Promise<RecoveryDetection> {
    const mission = await missions.getActive();
    if (!mission) return { missed: false, previousLog: undefined, reason: 'no-mission' };
    // Bootstrap example missions are scaffolding, not real promises — recovery
    // exists to restore integrity to a real commitment, so it must not fire
    // against a first-launch example the user never agreed to.
    if (isBootstrapMission(mission)) {
      return { missed: false, previousLog: undefined, reason: 'bootstrap-mission' };
    }

    const yesterday = addDays(today, -1);
    if (yesterday < mission.startDate) {
      const prev = await dayLogs.getByDate(yesterday);
      return { missed: false, previousLog: prev, reason: 'before-mission-start' };
    }

    const activeRoutine = await loadActiveRoutine(mission);
    if (!activeRoutine) {
      const prev = await dayLogs.getByDate(yesterday);
      return { missed: false, previousLog: prev, reason: 'no-active-routine' };
    }
    if (activeRoutine.blocks.length === 0) {
      const prev = await dayLogs.getByDate(yesterday);
      return { missed: false, previousLog: prev, reason: 'zero-block-routine' };
    }

    const yesterdayLog = await dayLogs.getByDate(yesterday);
    if (!yesterdayLog) {
      // No log for a mission-active day = user did not engage.
      return { missed: true, previousLog: undefined, reason: 'previous-day-absent' };
    }

    const complete = yesterdayLog.completedBlockIds.length >= activeRoutine.blocks.length;
    return complete
      ? { missed: false, previousLog: yesterdayLog, reason: 'previous-day-complete' }
      : { missed: true, previousLog: yesterdayLog, reason: 'previous-day-incomplete' };
  }

  return {
    async detectPreviousDayMissed(today?: ISODate): Promise<RecoveryDetection> {
      return detect(today ?? time.currentLogicalDate());
    },

    async ensureTodayRecoveryState(): Promise<DayLog | null> {
      const today = time.currentLogicalDate();
      const todayLog = await dayLogs.getByDate(today);
      // Idempotent: nothing to do if today is already recovery.
      if (todayLog && todayLog.state === 'recovery') return null;

      const detection = await detect(today);
      if (!detection.missed) return null;

      const now = time.nowIso();

      // Update today's DayLog to recovery. Requires today log to exist —
      // callers upstream call getOrCreateForToday before ensuring recovery.
      let updated: DayLog | null = null;
      if (todayLog) {
        updated = { ...todayLog, state: 'recovery', updatedAt: now };
        await dayLogs.put(updated);
      }

      // Emit `deferred` PromiseEvents for each block in yesterday's routine
      // that yesterday did not complete or skip. `deferred` is used (not
      // `broken`) so V1 scoring (which treats deferred as 0) is unaffected —
      // richer events for V2 to consume without changing V1 behaviour.
      //
      // Event chronology: `at` is set to the end of yesterday (one ms before
      // today's dayStartAt), not `now`. This preserves the semantic time the
      // missed block "belongs to" so window-based analytics group correctly.
      const prev = detection.previousLog;
      if (prev && todayLog) {
        const endOfYesterdayIso = new Date(
          new Date(todayLog.dayStartAt).getTime() - ONE_MS,
        ).toISOString();
        const mission = await missions.getActive();
        const activeRoutine = mission ? await loadActiveRoutine(mission) : null;
        if (activeRoutine) {
          for (const block of activeRoutine.blocks) {
            if (prev.completedBlockIds.includes(block.id)) continue;
            if (prev.skippedBlockIds.includes(block.id)) continue;
            await events.append({
              id: generateId(),
              createdAt: now,
              updatedAt: now,
              schemaVersion: SCHEMA_VERSION,
              dayLogId: prev.id,
              kind: 'deferred',
              source: 'sweep',
              blockId: block.id,
              missionId: mission?.id ?? null,
              at: endOfYesterdayIso,
              note: 'auto-generated by recovery sweep',
            });
          }
        }
      }

      return updated;
    },
  };
}

/** Default app-wide instance. */
export const recoveryService: RecoveryService = createRecoveryService();
