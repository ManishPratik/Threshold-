import {
  dayLogRepository,
  missionRepository,
  routineRepository,
} from '@data/repositories';
import { isBootstrapMission, purgeBootstrap } from '@data/db/seed';
import type { Mission } from '@data/types/Mission';
import { addDays, nowIso, type ISODate } from '@shared/lib/date';
import {
  DEFAULT_DAY_START_HOUR,
  getLogicalDate,
} from '@shared/lib/dayBoundary';
import { generateId } from '@shared/lib/id';

/**
 * Mission lifecycle rules (ADR 0007). The UI calls into this module — never
 * MissionRepository.put() directly for lifecycle-affecting writes.
 */

const SCHEMA_VERSION = 1;

/** Preset durations offered in the creation UI, in days. */
export const DURATION_PRESETS = [7, 21, 30, 40, 66, 90] as const;
export type DurationPreset = (typeof DURATION_PRESETS)[number];

export const MISSION_TITLE_MAX = 80;
export const MISSION_WHY_MAX = 500;
export const MISSION_REFUSE_MAX = 200;
export const MISSION_REWARD_MAX = 200;
export const MISSION_DURATION_MIN_DAYS = 1;
export const MISSION_DURATION_MAX_DAYS = 365;

/**
 * Wall-clock hour (0-23) at or after which a new mission is fair-started on
 * the next calendar day instead of the current one. Fairness rule: if a user
 * commits at 23:50 they should not begin already-behind on Day 1.
 * The rule is a domain rule (not a UI rule) — every consumer of mission
 * startDate inherits the correction automatically.
 */
export const LATE_START_CUTOFF_HOUR = 21;

export interface StartDateOpts {
  /** Wall-clock instant. Injectable for tests + future settings-UI plumbing. */
  now?: Date;
  /** Late-start cutoff hour. Defaults to LATE_START_CUTOFF_HOUR. */
  cutoffHour?: number;
  /** Logical-day boundary hour. Defaults to DEFAULT_DAY_START_HOUR (04:00). */
  dayStartHour?: number;
}

/**
 * Opts for `activateNewMission`. Extends `StartDateOpts` so the fair-start
 * computation is configurable, and adds `promisedAt` — the exact user
 * button-press instant during the witness ritual. `promisedAt` is stored
 * verbatim so the emotional keepsake anchors on the true commitment moment
 * rather than the DB write time (activatedAt).
 */
export interface ActivationOpts extends StartDateOpts {
  promisedAt?: string;
}

/**
 * Computes the fair Day-1 date for a mission committed at `now`. A late-night
 * window spans [cutoffHour, 24) ∪ [0, dayStartHour). Inside that window the
 * mission begins on the calendar day after the current logical date; outside
 * it, on the current logical date.
 *
 * Comparing against wall-clock hour (not the logical date) is intentional:
 * the 04:00 logical boundary already collapses 00:00-03:59 into "yesterday",
 * so a commit at 00:30 shifts to yesterday+1 = today's calendar — exactly
 * the fair Day 1.
 */
export function getEffectiveStartDate(opts: StartDateOpts = {}): ISODate {
  const now = opts.now ?? new Date();
  const cutoffHour = opts.cutoffHour ?? LATE_START_CUTOFF_HOUR;
  const dayStartHour = opts.dayStartHour ?? DEFAULT_DAY_START_HOUR;
  const hour = now.getHours();
  const inLateWindow = hour >= cutoffHour || hour < dayStartHour;
  const logicalToday = getLogicalDate(now, dayStartHour);
  return inLateWindow ? addDays(logicalToday, 1) : logicalToday;
}

export interface MissionDraft {
  title: string;
  why: string;
  /** V2 contract addition — required at creation, editable post-activation. */
  refuseToLose: string;
  /** V2 contract addition — optional at creation, editable post-activation. */
  reward?: string | undefined;
  durationDays: number;
}

export interface DraftValidationError {
  field: 'title' | 'why' | 'refuseToLose' | 'reward' | 'durationDays';
  message: string;
}

/** Post-activation editable slice — matches the locked mutability rule. */
export interface EditableMissionFields {
  notes: string;
  reward: string;
  refuseToLose: string;
}

const LOCKED_FIELDS = [
  'title',
  'statement',
  'startDate',
  'endDate',
  'status',
  'activatedAt',
  'promisedAt',
  'targetMetrics',
  'id',
  'schemaVersion',
  'createdAt',
] as const;

// ────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────

export function validateDraft(draft: MissionDraft): DraftValidationError[] {
  const errors: DraftValidationError[] = [];

  const title = draft.title.trim();
  if (title.length === 0) {
    errors.push({ field: 'title', message: 'Give your mission a name.' });
  } else if (title.length > MISSION_TITLE_MAX) {
    errors.push({
      field: 'title',
      message: `Keep the title under ${MISSION_TITLE_MAX} characters.`,
    });
  }

  const why = draft.why.trim();
  if (why.length === 0) {
    errors.push({ field: 'why', message: 'Say why this matters — you will read it later.' });
  } else if (why.length > MISSION_WHY_MAX) {
    errors.push({
      field: 'why',
      message: `Keep it under ${MISSION_WHY_MAX} characters.`,
    });
  }

  const refuseToLose = draft.refuseToLose.trim();
  if (refuseToLose.length === 0) {
    errors.push({
      field: 'refuseToLose',
      message: 'Name what you are refusing to lose — this is your anchor on hard days.',
    });
  } else if (refuseToLose.length > MISSION_REFUSE_MAX) {
    errors.push({
      field: 'refuseToLose',
      message: `Keep it under ${MISSION_REFUSE_MAX} characters.`,
    });
  }

  // Reward is optional at creation; only length is checked when provided.
  const reward = (draft.reward ?? '').trim();
  if (reward.length > MISSION_REWARD_MAX) {
    errors.push({
      field: 'reward',
      message: `Keep it under ${MISSION_REWARD_MAX} characters.`,
    });
  }

  if (
    !Number.isInteger(draft.durationDays) ||
    draft.durationDays < MISSION_DURATION_MIN_DAYS ||
    draft.durationDays > MISSION_DURATION_MAX_DAYS
  ) {
    errors.push({
      field: 'durationDays',
      message: `Duration must be a whole number of days between ${MISSION_DURATION_MIN_DAYS} and ${MISSION_DURATION_MAX_DAYS}.`,
    });
  }

  return errors;
}

// ────────────────────────────────────────────────────────────
// Projection (form → concrete dates, no writes)
// ────────────────────────────────────────────────────────────

export interface MissionProjection {
  startDate: ISODate;
  endDate: ISODate;
  totalDays: number;
}

/**
 * Projects a draft to concrete dates. Callers may pass an explicit `startDate`
 * to bypass cutoff logic (tests, future manual scheduling). Otherwise the
 * effective Day-1 date is derived from `getEffectiveStartDate` — the fair-
 * start domain rule. `startDateOpts` is forwarded to that helper so tests +
 * a future settings-UI can override the cutoff/now/dayStart values.
 */
export function projectDraft(
  draft: MissionDraft,
  startDate?: ISODate,
  startDateOpts?: StartDateOpts,
): MissionProjection {
  const start = startDate ?? getEffectiveStartDate(startDateOpts);
  const end = addDays(start, draft.durationDays - 1);
  return { startDate: start, endDate: end, totalDays: draft.durationDays };
}

// ────────────────────────────────────────────────────────────
// Activation
// ────────────────────────────────────────────────────────────

export class MissionContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissionContractError';
  }
}

/**
 * Creates the user's Mission, purges bootstrap data, and ensures today's
 * DayLog exists. Refuses if a non-bootstrap active Mission already exists —
 * multi-mission creation is out of scope for Milestone 2.
 */
export async function activateNewMission(
  draft: MissionDraft,
  startDate?: ISODate,
  opts?: ActivationOpts,
): Promise<Mission> {
  const errors = validateDraft(draft);
  if (errors.length > 0) {
    throw new MissionContractError(errors.map((e) => e.message).join(' '));
  }

  const existing = await missionRepository.getActive();
  if (existing && !isBootstrapMission(existing)) {
    throw new MissionContractError(
      'An active mission already exists. Editing locked fields requires creating a new contract, which is not yet supported.',
    );
  }

  const projection = projectDraft(draft, startDate, opts);
  const now = nowIso();
  const mission: Mission = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    title: draft.title.trim(),
    statement: draft.why.trim(),
    startDate: projection.startDate,
    endDate: projection.endDate,
    status: 'active',
    targetMetrics: { targetDays: projection.totalDays },
    notes: '',
    reward: (draft.reward ?? '').trim(),
    refuseToLose: draft.refuseToLose.trim(),
    activatedAt: now,
    // Only write promisedAt when the caller supplied it. Leaving it undefined
    // on legacy/non-onboarding activations keeps IndexedDB rows identical
    // for missions created before this field existed.
    ...(opts?.promisedAt !== undefined ? { promisedAt: opts.promisedAt } : {}),
  };

  await missionRepository.put(mission);
  await purgeBootstrap({ missionRepository, routineRepository, dayLogRepository });
  await dayLogRepository.getOrCreateForToday();

  return mission;
}

// ────────────────────────────────────────────────────────────
// Edit (post-activation)
// ────────────────────────────────────────────────────────────

/**
 * Applies edits limited to notes, reward, and refuseToLose. Any other field
 * in the input is rejected — the mutability rule (ADR 0007) is enforced here.
 * refuseToLose was added by the V2 contract redesign; it is editable because
 * "what you're protecting" may evolve over the life of a mission.
 */
export async function updateActiveMissionEditable(
  missionId: string,
  edits: Partial<EditableMissionFields> & Record<string, unknown>,
): Promise<Mission> {
  const forbidden = Object.keys(edits).filter(
    (k) => k !== 'notes' && k !== 'reward' && k !== 'refuseToLose',
  );
  if (forbidden.length > 0) {
    throw new MissionContractError(
      `Locked field(s) cannot be edited after activation: ${forbidden.join(', ')}. Creating a new contract is required.`,
    );
  }

  const current = await missionRepository.getById(missionId);
  if (!current) {
    throw new MissionContractError(`Mission ${missionId} not found.`);
  }
  if (current.status !== 'active') {
    throw new MissionContractError('Only the active mission is editable.');
  }

  const updated: Mission = {
    ...current,
    updatedAt: nowIso(),
    notes: typeof edits.notes === 'string' ? edits.notes : current.notes,
    reward: typeof edits.reward === 'string' ? edits.reward : current.reward,
    refuseToLose:
      typeof edits.refuseToLose === 'string' ? edits.refuseToLose : current.refuseToLose,
  };
  await missionRepository.put(updated);
  return updated;
}

// Exported for tests + diagnostics.
export const _internal = { LOCKED_FIELDS };
