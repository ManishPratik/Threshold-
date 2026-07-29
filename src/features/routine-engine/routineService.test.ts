import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@data/repositories', () => ({
  missionRepository: { getActive: vi.fn() },
  routineRepository: { replaceAllForMission: vi.fn() },
}));

// isBootstrap module uses a plain string constant; safe to load actual.
import {
  validateRoutineDraft,
  saveRoutineForActiveMission,
  RoutineServiceError,
  newBlockDraft,
  routineToDraft,
  BLOCK_DURATION_MAX,
  BLOCK_DURATION_MIN,
  type RoutineDraft,
} from './routineService';
import { missionRepository, routineRepository } from '@data/repositories';
import type { Mission } from '@data/types/Mission';
import type { Routine } from '@data/types/Routine';

const stubMission = (overrides: Partial<Mission> = {}): Mission => ({
  id: 'real-mission-1',
  createdAt: '',
  updatedAt: '',
  schemaVersion: 1,
  title: 'T',
  statement: 'W',
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  status: 'active',
  targetMetrics: {},
  notes: '',
  reward: '',
  activatedAt: null,
  ...overrides,
});

const validDraft: RoutineDraft = {
  name: 'Daily flow',
  blocks: [
    { id: 'b1', label: 'Morning', durationMinutes: 15, type: 'ritual', expectedStart: '07:00' },
    { id: 'b2', label: 'Focus', durationMinutes: 90, type: 'focus', expectedStart: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateRoutineDraft', () => {
  it('accepts a well-formed draft', () => {
    expect(validateRoutineDraft(validDraft)).toEqual([]);
  });

  it('requires a routine name', () => {
    expect(
      validateRoutineDraft({ ...validDraft, name: '   ' }).map((e) => e.field),
    ).toContain('name');
  });

  it('requires at least one block', () => {
    expect(
      validateRoutineDraft({ name: 'X', blocks: [] }).map((e) => e.field),
    ).toContain('blocks');
  });

  it('requires each block to have a name', () => {
    const errs = validateRoutineDraft({
      ...validDraft,
      blocks: [
        { id: 'b', label: '  ', durationMinutes: 15, type: 'focus', expectedStart: null },
      ],
    });
    expect(errs.map((e) => e.field)).toContain('blocks.0.label');
  });

  it('rejects duration outside [1, 480]', () => {
    const under = validateRoutineDraft({
      ...validDraft,
      blocks: [
        {
          id: 'b',
          label: 'L',
          durationMinutes: BLOCK_DURATION_MIN - 1,
          type: 'focus',
          expectedStart: null,
        },
      ],
    });
    const over = validateRoutineDraft({
      ...validDraft,
      blocks: [
        {
          id: 'b',
          label: 'L',
          durationMinutes: BLOCK_DURATION_MAX + 1,
          type: 'focus',
          expectedStart: null,
        },
      ],
    });
    expect(under.map((e) => e.field)).toContain('blocks.0.durationMinutes');
    expect(over.map((e) => e.field)).toContain('blocks.0.durationMinutes');
  });

  it('rejects non-integer duration', () => {
    const errs = validateRoutineDraft({
      ...validDraft,
      blocks: [
        { id: 'b', label: 'L', durationMinutes: 15.5, type: 'focus', expectedStart: null },
      ],
    });
    expect(errs.map((e) => e.field)).toContain('blocks.0.durationMinutes');
  });

  it('accepts null or valid HH:MM expectedStart, rejects garbage', () => {
    const okNull = validateRoutineDraft({
      ...validDraft,
      blocks: [{ id: 'b', label: 'L', durationMinutes: 15, type: 'focus', expectedStart: null }],
    });
    const okTime = validateRoutineDraft({
      ...validDraft,
      blocks: [
        { id: 'b', label: 'L', durationMinutes: 15, type: 'focus', expectedStart: '23:59' },
      ],
    });
    const bad = validateRoutineDraft({
      ...validDraft,
      blocks: [
        { id: 'b', label: 'L', durationMinutes: 15, type: 'focus', expectedStart: '25:00' },
      ],
    });
    expect(okNull).toEqual([]);
    expect(okTime).toEqual([]);
    expect(bad.map((e) => e.field)).toContain('blocks.0.expectedStart');
  });
});

describe('saveRoutineForActiveMission', () => {
  it('persists the routine against the active real mission', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(stubMission());
    (routineRepository.replaceAllForMission as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const saved = await saveRoutineForActiveMission(validDraft);

    expect(saved.missionId).toBe('real-mission-1');
    expect(saved.active).toBe(true);
    expect(saved.blocks).toHaveLength(2);
    expect(saved.name).toBe('Daily flow');
    expect(routineRepository.replaceAllForMission).toHaveBeenCalledTimes(1);
    const [missionIdArg, routinesArg] = (routineRepository.replaceAllForMission as ReturnType<
      typeof vi.fn
    >).mock.calls[0] as [string, Routine[]];
    expect(missionIdArg).toBe('real-mission-1');
    expect(routinesArg).toHaveLength(1);
    expect(routinesArg[0]?.id).toBe(saved.id);
  });

  it('reuses the provided routine id when replacingRoutineId is passed (edit flow)', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(stubMission());
    (routineRepository.replaceAllForMission as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const saved = await saveRoutineForActiveMission(validDraft, {
      replacingRoutineId: 'existing-routine-id',
    });
    expect(saved.id).toBe('existing-routine-id');
  });

  it('refuses when there is no active mission', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await expect(saveRoutineForActiveMission(validDraft)).rejects.toBeInstanceOf(
      RoutineServiceError,
    );
    expect(routineRepository.replaceAllForMission).not.toHaveBeenCalled();
  });

  it('refuses when the active mission is bootstrap', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({ id: 'bootstrap-mission-01' }),
    );
    await expect(saveRoutineForActiveMission(validDraft)).rejects.toBeInstanceOf(
      RoutineServiceError,
    );
    expect(routineRepository.replaceAllForMission).not.toHaveBeenCalled();
  });

  it('refuses invalid drafts before touching the DB', async () => {
    await expect(
      saveRoutineForActiveMission({ name: '', blocks: [] }),
    ).rejects.toBeInstanceOf(RoutineServiceError);
    expect(missionRepository.getActive).not.toHaveBeenCalled();
  });
});

describe('newBlockDraft / routineToDraft', () => {
  it('newBlockDraft produces a valid single-block base', () => {
    const b = newBlockDraft();
    expect(typeof b.id).toBe('string');
    expect(b.durationMinutes).toBeGreaterThanOrEqual(BLOCK_DURATION_MIN);
    expect(b.durationMinutes).toBeLessThanOrEqual(BLOCK_DURATION_MAX);
    expect(b.type).toBe('focus');
    expect(b.expectedStart).toBeNull();
  });

  it('routineToDraft preserves block identity and ordering', () => {
    const routine: Routine = {
      id: 'r1',
      createdAt: '',
      updatedAt: '',
      schemaVersion: 1,
      name: 'Original',
      missionId: 'm',
      active: true,
      blocks: [
        { id: 'x', label: 'A', durationMinutes: 10, type: 'focus', expectedStart: null },
        { id: 'y', label: 'B', durationMinutes: 20, type: 'break', expectedStart: '12:00' },
      ],
    };
    const draft = routineToDraft(routine);
    expect(draft.name).toBe('Original');
    expect(draft.blocks.map((b) => b.id)).toEqual(['x', 'y']);
    expect(draft.blocks[1]?.expectedStart).toBe('12:00');
  });
});
