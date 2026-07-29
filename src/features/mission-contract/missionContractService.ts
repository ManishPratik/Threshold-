import {
  dayLogRepository,
  missionRepository,
  routineRepository,
} from '@data/repositories';
import { isBootstrapMission, purgeBootstrap } from '@data/db/seed';
import type { Mission } from '@data/types/Mission';
import { addDays, nowIso, type ISODate } from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
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
export const MISSION_DURATION_MIN_DAYS = 1;
export const MISSION_DURATION_MAX_DAYS = 365;

export interface MissionDraft {
  title: string;
  why: string;
  durationDays: number;
}

export interface DraftValidationError {
  field: 'title' | 'why' | 'durationDays';
  message: string;
}

/** Post-activation editable slice — matches the locked mutability rule. */
export interface EditableMissionFields {
  notes: string;
  reward: string;
}

const LOCKED_FIELDS = [
  'title',
  'statement',
  'startDate',
  'endDate',
  'status',
  'activatedAt',
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

export function projectDraft(draft: MissionDraft, startDate?: ISODate): MissionProjection {
  const start = startDate ?? currentLogicalDate();
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

  const projection = projectDraft(draft, startDate);
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
    reward: '',
    activatedAt: now,
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
 * Applies edits limited to notes + reward. Any other field in the input
 * is rejected — the mutability rule (ADR 0007) is enforced here.
 */
export async function updateActiveMissionEditable(
  missionId: string,
  edits: Partial<EditableMissionFields> & Record<string, unknown>,
): Promise<Mission> {
  const forbidden = Object.keys(edits).filter(
    (k) => k !== 'notes' && k !== 'reward',
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
  };
  await missionRepository.put(updated);
  return updated;
}

// Exported for tests + diagnostics.
export const _internal = { LOCKED_FIELDS };
