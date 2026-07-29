import type { IDBPDatabase } from 'idb';
import { STORES } from './schema';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import { addDays, nowIso } from '@shared/lib/date';
import type { Mission } from '@data/types/Mission';
import type { Routine } from '@data/types/Routine';
import type { DayLog } from '@data/types/DayLog';

/**
 * Bootstrap seed for first-launch (ADR 0006). Purge runs on Mission
 * activation (ADR 0007). Both live here so bootstrap concerns stay
 * localised in one file.
 *
 * seedIfEmpty runs once from getDb() after openDB() resolves. Guards on an
 * existing active Mission — never overwrites user data. All records use the
 * BOOTSTRAP_ID_PREFIX so they can be identified and purged without UI changes.
 */

export const BOOTSTRAP_ID_PREFIX = 'bootstrap-';

/**
 * Bootstrap detection lives at the data layer because "what counts as
 * bootstrap" is an infrastructure concern, not a feature-domain concern.
 * Feature services import from here rather than duplicating the prefix check.
 */
export function isBootstrapMission(mission: { id: string }): boolean {
  return mission.id.startsWith(BOOTSTRAP_ID_PREFIX);
}

const SCHEMA_VERSION = 1;

const MISSION_ID = 'bootstrap-mission-01';
const ROUTINE_ID = 'bootstrap-routine-01';
const BLOCK_IDS = {
  morning: 'bootstrap-block-morning',
  focus1: 'bootstrap-block-focus-1',
  breakBlock: 'bootstrap-block-break',
  focus2: 'bootstrap-block-focus-2',
} as const;

/**
 * Idempotent: no-op if ANY mission exists (active, archived, or otherwise).
 * The "any mission" guard covers three scenarios: first-run (empty store,
 * seed inserts bootstrap), post-activation (user's real active mission
 * present, seed skips per ADR 0006), and post-import / archived-mission
 * (records already exist, seed must not re-add bootstrap alongside them).
 */
export async function seedIfEmpty(db: IDBPDatabase): Promise<void> {
  const missionCount = await db.count(STORES.missions);
  if (missionCount > 0) return;

  const today = currentLogicalDate();
  // Position the scaffolding at Day 12 of a 40-day mission: 11 days elapsed, 28 days remaining.
  const startDate = addDays(today, -11);
  const endDate = addDays(today, 28);
  const now = nowIso();

  const mission: Mission = {
    id: MISSION_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    title: 'Example mission',
    statement:
      'This is example content so you can see how Today feels. Tap "Create your own contract" below when you are ready to start yours.',
    startDate,
    endDate,
    status: 'active',
    targetMetrics: { targetDays: 40 },
    notes: '',
    reward: '',
    activatedAt: now,
  };

  const routine: Routine = {
    id: ROUTINE_ID,
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    name: 'Example routine',
    missionId: MISSION_ID,
    active: true,
    blocks: [
      {
        id: BLOCK_IDS.morning,
        label: 'Example — morning ritual',
        durationMinutes: 15,
        type: 'ritual',
        expectedStart: '07:00',
      },
      {
        id: BLOCK_IDS.focus1,
        label: 'Example — deep focus',
        durationMinutes: 90,
        type: 'focus',
        expectedStart: '09:30',
      },
      {
        id: BLOCK_IDS.breakBlock,
        label: 'Example — reset break',
        durationMinutes: 15,
        type: 'break',
        expectedStart: '11:00',
      },
      {
        id: BLOCK_IDS.focus2,
        label: 'Example — deep focus (second)',
        durationMinutes: 60,
        type: 'focus',
        expectedStart: '14:00',
      },
    ],
  };

  const dayLog: DayLog = {
    id: `bootstrap-daylog-${today}`,
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    date: today,
    dayStartAt: now,
    state: 'normal',
    completedBlockIds: [BLOCK_IDS.morning, BLOCK_IDS.focus1],
    skippedBlockIds: [],
    notes: '',
  };

  const tx = db.transaction(
    [STORES.missions, STORES.routines, STORES.dayLogs],
    'readwrite',
  );
  await Promise.all([
    tx.objectStore(STORES.missions).put(mission),
    tx.objectStore(STORES.routines).put(routine),
    tx.objectStore(STORES.dayLogs).put(dayLog),
  ]);
  await tx.done;
}

/**
 * Purges every bootstrap-prefixed record from the seeded stores. Called by
 * the Mission activation service (ADR 0007) so bootstrap data never survives
 * the user creating their own contract.
 *
 * Import as a function of the repositories to keep this the single source of
 * truth for "what counts as bootstrap".
 */
export async function purgeBootstrap(repositories: {
  missionRepository: { deleteByIdPrefix: (p: string) => Promise<number> };
  routineRepository: { deleteByIdPrefix: (p: string) => Promise<number> };
  dayLogRepository: { deleteByIdPrefix: (p: string) => Promise<number> };
}): Promise<{ missionsRemoved: number; routinesRemoved: number; dayLogsRemoved: number }> {
  const [missionsRemoved, routinesRemoved, dayLogsRemoved] = await Promise.all([
    repositories.missionRepository.deleteByIdPrefix(BOOTSTRAP_ID_PREFIX),
    repositories.routineRepository.deleteByIdPrefix(BOOTSTRAP_ID_PREFIX),
    repositories.dayLogRepository.deleteByIdPrefix(BOOTSTRAP_ID_PREFIX),
  ]);
  return { missionsRemoved, routinesRemoved, dayLogsRemoved };
}
