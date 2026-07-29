import { missionRepository, routineRepository } from '@data/repositories';
import { isBootstrapMission } from '@data/db/seed';
import type { Routine, RoutineBlock, RoutineBlockType } from '@data/types/Routine';
import { nowIso } from '@shared/lib/date';
import { generateId } from '@shared/lib/id';

/**
 * Routine domain service (mirrors the pattern from ADR 0007). All routine
 * lifecycle rules — validation, active-mission requirement, atomic replacement
 * — live here. Repositories remain single-aggregate persistence.
 */

const SCHEMA_VERSION = 1;

export const BLOCK_TYPES = ['focus', 'break', 'ritual'] as const satisfies readonly RoutineBlockType[];
export const ROUTINE_NAME_MAX = 80;
export const BLOCK_NAME_MAX = 80;
export const BLOCK_DURATION_MIN = 1;
export const BLOCK_DURATION_MAX = 480;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface BlockDraft {
  id?: string | undefined;
  label: string;
  durationMinutes: number;
  type: RoutineBlockType;
  expectedStart: string | null;
}

export interface RoutineDraft {
  name: string;
  blocks: BlockDraft[];
}

export interface DraftValidationError {
  field: string;
  message: string;
}

export class RoutineServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoutineServiceError';
  }
}

// ────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────

export function validateRoutineDraft(draft: RoutineDraft): DraftValidationError[] {
  const errors: DraftValidationError[] = [];

  const name = draft.name.trim();
  if (name.length === 0) {
    errors.push({ field: 'name', message: 'Give your routine a name.' });
  } else if (name.length > ROUTINE_NAME_MAX) {
    errors.push({
      field: 'name',
      message: `Keep the name under ${ROUTINE_NAME_MAX} characters.`,
    });
  }

  if (draft.blocks.length === 0) {
    errors.push({
      field: 'blocks',
      message: 'Add at least one block to activate the routine.',
    });
  }

  draft.blocks.forEach((b, i) => {
    if (b.label.trim().length === 0) {
      errors.push({ field: `blocks.${i}.label`, message: 'Every block needs a name.' });
    } else if (b.label.length > BLOCK_NAME_MAX) {
      errors.push({
        field: `blocks.${i}.label`,
        message: `Block name must stay under ${BLOCK_NAME_MAX} characters.`,
      });
    }
    if (
      !Number.isInteger(b.durationMinutes) ||
      b.durationMinutes < BLOCK_DURATION_MIN ||
      b.durationMinutes > BLOCK_DURATION_MAX
    ) {
      errors.push({
        field: `blocks.${i}.durationMinutes`,
        message: `Duration must be a whole number of minutes between ${BLOCK_DURATION_MIN} and ${BLOCK_DURATION_MAX}.`,
      });
    }
    if (!(BLOCK_TYPES as readonly string[]).includes(b.type)) {
      errors.push({ field: `blocks.${i}.type`, message: 'Invalid block type.' });
    }
    if (b.expectedStart !== null && b.expectedStart.length > 0 && !TIME_PATTERN.test(b.expectedStart)) {
      errors.push({
        field: `blocks.${i}.expectedStart`,
        message: 'Preferred time must be HH:MM (24-hour) or empty.',
      });
    }
  });

  return errors;
}

// ────────────────────────────────────────────────────────────
// Save (create or edit)
// ────────────────────────────────────────────────────────────

/**
 * Persists the routine for the currently active mission. Replaces every
 * existing routine for that mission in a single transaction so we never end up
 * with two "active" routines.
 *
 * Refuses if:
 *   - the draft fails validation
 *   - there is no active mission
 *   - the active mission is bootstrap (user must create their real mission first)
 */
export async function saveRoutineForActiveMission(
  draft: RoutineDraft,
  options?: { replacingRoutineId?: string | undefined },
): Promise<Routine> {
  const errors = validateRoutineDraft(draft);
  if (errors.length > 0) {
    throw new RoutineServiceError(errors.map((e) => e.message).join(' '));
  }

  const mission = await missionRepository.getActive();
  if (!mission) {
    throw new RoutineServiceError('Create a mission before saving a routine.');
  }
  if (isBootstrapMission(mission)) {
    throw new RoutineServiceError(
      'Create your own mission contract first — routines are only saved against real missions.',
    );
  }

  const now = nowIso();
  const routineId = options?.replacingRoutineId ?? generateId();

  const blocks: RoutineBlock[] = draft.blocks.map((b) => ({
    id: b.id ?? generateId(),
    label: b.label.trim(),
    durationMinutes: b.durationMinutes,
    type: b.type,
    expectedStart:
      b.expectedStart && b.expectedStart.length > 0 ? b.expectedStart : null,
  }));

  const routine: Routine = {
    id: routineId,
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    name: draft.name.trim(),
    missionId: mission.id,
    active: true,
    blocks,
  };

  await routineRepository.replaceAllForMission(mission.id, [routine]);
  return routine;
}

// ────────────────────────────────────────────────────────────
// Draft helpers for the UI
// ────────────────────────────────────────────────────────────

export function newBlockDraft(): BlockDraft {
  return {
    id: generateId(),
    label: '',
    durationMinutes: 25,
    type: 'focus',
    expectedStart: null,
  };
}

/** Turns a persisted Routine into an editable draft (round-trip safe). */
export function routineToDraft(routine: Routine): RoutineDraft {
  return {
    name: routine.name,
    blocks: routine.blocks.map((b) => ({
      id: b.id,
      label: b.label,
      durationMinutes: b.durationMinutes,
      type: b.type,
      expectedStart: b.expectedStart,
    })),
  };
}
