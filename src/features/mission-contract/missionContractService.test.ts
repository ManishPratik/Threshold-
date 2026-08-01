import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the repositories + bootstrap purge BEFORE importing the service.
vi.mock('@data/repositories', () => {
  const missionRepository = {
    getById: vi.fn(),
    getActive: vi.fn(),
    put: vi.fn(),
    deleteByIdPrefix: vi.fn(),
  };
  const routineRepository = { deleteByIdPrefix: vi.fn() };
  const dayLogRepository = {
    deleteByIdPrefix: vi.fn(),
    getOrCreateForToday: vi.fn(),
  };
  return { missionRepository, routineRepository, dayLogRepository };
});

vi.mock('@data/db/seed', () => ({
  BOOTSTRAP_ID_PREFIX: 'bootstrap-',
  isBootstrapMission: (m: { id: string }) => m.id.startsWith('bootstrap-'),
  purgeBootstrap: vi.fn(async () => ({
    missionsRemoved: 1,
    routinesRemoved: 1,
    dayLogsRemoved: 1,
  })),
  seedIfEmpty: vi.fn(async () => {
    /* not used by service */
  }),
}));

import {
  activateNewMission,
  validateDraft,
  projectDraft,
  updateActiveMissionEditable,
  getEffectiveStartDate,
  LATE_START_CUTOFF_HOUR,
  MissionContractError,
  DURATION_PRESETS,
} from './missionContractService';
import { missionRepository, dayLogRepository } from '@data/repositories';
import { purgeBootstrap } from '@data/db/seed';
import type { Mission } from '@data/types/Mission';

const stubMission = (overrides: Partial<Mission> = {}): Mission => ({
  id: 'mission-x',
  createdAt: '',
  updatedAt: '',
  schemaVersion: 1,
  title: 't',
  statement: 'w',
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  status: 'active',
  targetMetrics: {},
  notes: '',
  reward: '',
  activatedAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateDraft', () => {
  it('accepts a well-formed draft (with refuseToLose, no reward)', () => {
    expect(
      validateDraft({ title: 'A', why: 'B', refuseToLose: 'R', durationDays: 40 }),
    ).toEqual([]);
  });

  it('accepts a well-formed draft including optional reward', () => {
    expect(
      validateDraft({
        title: 'A',
        why: 'B',
        refuseToLose: 'R',
        reward: 'weekend trip',
        durationDays: 40,
      }),
    ).toEqual([]);
  });

  it('rejects empty title', () => {
    const errs = validateDraft({ title: '  ', why: 'B', refuseToLose: 'R', durationDays: 40 });
    expect(errs.map((e) => e.field)).toContain('title');
  });

  it('rejects empty why', () => {
    const errs = validateDraft({ title: 'A', why: '', refuseToLose: 'R', durationDays: 40 });
    expect(errs.map((e) => e.field)).toContain('why');
  });

  it('rejects empty refuseToLose', () => {
    const errs = validateDraft({ title: 'A', why: 'B', refuseToLose: '  ', durationDays: 40 });
    expect(errs.map((e) => e.field)).toContain('refuseToLose');
  });

  it('allows reward to be omitted or empty', () => {
    expect(
      validateDraft({ title: 'A', why: 'B', refuseToLose: 'R', durationDays: 40 }),
    ).toEqual([]);
    expect(
      validateDraft({ title: 'A', why: 'B', refuseToLose: 'R', reward: '', durationDays: 40 }),
    ).toEqual([]);
    expect(
      validateDraft({ title: 'A', why: 'B', refuseToLose: 'R', reward: '   ', durationDays: 40 }),
    ).toEqual([]);
  });

  it('rejects out-of-range duration', () => {
    expect(
      validateDraft({ title: 'A', why: 'B', refuseToLose: 'R', durationDays: 0 }),
    ).toHaveLength(1);
    expect(
      validateDraft({ title: 'A', why: 'B', refuseToLose: 'R', durationDays: 400 }),
    ).toHaveLength(1);
    expect(
      validateDraft({ title: 'A', why: 'B', refuseToLose: 'R', durationDays: 1.5 }),
    ).toHaveLength(1);
  });

  it('accepts every documented preset', () => {
    for (const d of DURATION_PRESETS) {
      expect(
        validateDraft({ title: 'A', why: 'B', refuseToLose: 'R', durationDays: d }),
      ).toEqual([]);
    }
  });
});

describe('projectDraft', () => {
  it('endDate = startDate + (durationDays - 1)', () => {
    const p = projectDraft(
      { title: '', why: '', refuseToLose: '', durationDays: 40 },
      '2026-01-01',
    );
    expect(p.startDate).toBe('2026-01-01');
    expect(p.endDate).toBe('2026-02-09');
    expect(p.totalDays).toBe(40);
  });

  it('uses the effective start date when no explicit startDate is passed', () => {
    // 2026-07-31 23:50 local — inside the late-start window (>= 21).
    // Effective Day 1 must shift to 2026-08-01.
    const p = projectDraft(
      { title: '', why: '', refuseToLose: '', durationDays: 3 },
      undefined,
      { now: new Date(2026, 6, 31, 23, 50, 0) },
    );
    expect(p.startDate).toBe('2026-08-01');
    expect(p.endDate).toBe('2026-08-03');
    expect(p.totalDays).toBe(3);
  });

  it('honours a custom cutoffHour override', () => {
    // With cutoffHour=18 a commit at 19:00 shifts to tomorrow.
    const p = projectDraft(
      { title: '', why: '', refuseToLose: '', durationDays: 1 },
      undefined,
      { now: new Date(2026, 6, 31, 19, 0, 0), cutoffHour: 18 },
    );
    expect(p.startDate).toBe('2026-08-01');
  });
});

describe('getEffectiveStartDate', () => {
  it('exposes the documented default cutoff hour', () => {
    expect(LATE_START_CUTOFF_HOUR).toBe(21);
  });

  it('before cutoff (20:59) → today', () => {
    // 2026-07-31 20:59 local. Logical date = 2026-07-31.
    expect(
      getEffectiveStartDate({ now: new Date(2026, 6, 31, 20, 59, 0) }),
    ).toBe('2026-07-31');
  });

  it('at cutoff (21:00) → tomorrow', () => {
    expect(
      getEffectiveStartDate({ now: new Date(2026, 6, 31, 21, 0, 0) }),
    ).toBe('2026-08-01');
  });

  it('late night (23:59) → tomorrow', () => {
    expect(
      getEffectiveStartDate({ now: new Date(2026, 6, 31, 23, 59, 0) }),
    ).toBe('2026-08-01');
  });

  it('post-midnight, pre-dayStart (00:30) → today\'s calendar', () => {
    // 2026-08-01 00:30. dayStart=04:00 collapses this to logical 2026-07-31.
    // Late-window rule shifts start to logical+1 = 2026-08-01, which matches
    // the user's calendar "today" — the fair Day 1.
    expect(
      getEffectiveStartDate({ now: new Date(2026, 7, 1, 0, 30, 0) }),
    ).toBe('2026-08-01');
  });

  it('after dayStart (04:30) → today', () => {
    expect(
      getEffectiveStartDate({ now: new Date(2026, 7, 1, 4, 30, 0) }),
    ).toBe('2026-08-01');
  });

  it('crosses month/year boundary correctly', () => {
    // 2026-12-31 23:00 → 2027-01-01.
    expect(
      getEffectiveStartDate({ now: new Date(2026, 11, 31, 23, 0, 0) }),
    ).toBe('2027-01-01');
  });
});

describe('activateNewMission', () => {
  it('persists refuseToLose + optional reward + trimmed fields', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (dayLogRepository.getOrCreateForToday as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (missionRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await activateNewMission(
      {
        title: '  Do the thing  ',
        why: '  It matters  ',
        refuseToLose: '  my health  ',
        reward: '  weekend trip  ',
        durationDays: 40,
      },
      '2026-01-01',
    );

    expect(result.title).toBe('Do the thing');
    expect(result.statement).toBe('It matters');
    expect(result.refuseToLose).toBe('my health');
    expect(result.reward).toBe('weekend trip');
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-02-09');
    expect(result.status).toBe('active');
    expect(result.targetMetrics).toEqual({ targetDays: 40 });
    expect(result.notes).toBe('');

    expect(missionRepository.put).toHaveBeenCalledTimes(1);
    expect(purgeBootstrap).toHaveBeenCalledTimes(1);
    expect(dayLogRepository.getOrCreateForToday).toHaveBeenCalledTimes(1);
  });

  it('defaults reward to empty string when omitted', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (dayLogRepository.getOrCreateForToday as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (missionRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await activateNewMission(
      { title: 'A', why: 'B', refuseToLose: 'R', durationDays: 30 },
    );

    expect(result.reward).toBe('');
    expect(result.refuseToLose).toBe('R');
  });

  it('persists promisedAt verbatim when supplied via opts', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (dayLogRepository.getOrCreateForToday as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (missionRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pressIso = '2026-07-31T18:20:15.007Z';
    const result = await activateNewMission(
      { title: 'A', why: 'B', refuseToLose: 'R', durationDays: 30 },
      '2026-08-01',
      { promisedAt: pressIso },
    );

    expect(result.promisedAt).toBe(pressIso);
    // activatedAt is independent — its own timestamp path (nowIso), NOT the
    // press instant. We can't pin it exactly but it must exist and differ.
    expect(typeof result.activatedAt).toBe('string');
    expect(result.activatedAt).not.toBe(pressIso);
  });

  it('leaves promisedAt undefined when not supplied (backward compat)', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (dayLogRepository.getOrCreateForToday as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (missionRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await activateNewMission(
      { title: 'A', why: 'B', refuseToLose: 'R', durationDays: 30 },
    );

    expect(result.promisedAt).toBeUndefined();
  });

  it('allows activation when only a bootstrap mission is active', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({ id: 'bootstrap-mission-01' }),
    );
    (dayLogRepository.getOrCreateForToday as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(
      activateNewMission({ title: 'A', why: 'B', refuseToLose: 'R', durationDays: 30 }),
    ).resolves.toBeDefined();

    expect(missionRepository.put).toHaveBeenCalledTimes(1);
    expect(purgeBootstrap).toHaveBeenCalledTimes(1);
  });

  it('refuses activation when a real active mission exists', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({ id: 'real-mission' }),
    );

    await expect(
      activateNewMission({ title: 'A', why: 'B', refuseToLose: 'R', durationDays: 30 }),
    ).rejects.toBeInstanceOf(MissionContractError);

    expect(missionRepository.put).not.toHaveBeenCalled();
    expect(purgeBootstrap).not.toHaveBeenCalled();
  });

  it('refuses invalid drafts before touching the DB', async () => {
    await expect(
      activateNewMission({ title: '', why: '', refuseToLose: '', durationDays: 0 }),
    ).rejects.toBeInstanceOf(MissionContractError);
    expect(missionRepository.getActive).not.toHaveBeenCalled();
  });

  it('refuses drafts missing only refuseToLose', async () => {
    await expect(
      activateNewMission({ title: 'A', why: 'B', refuseToLose: '', durationDays: 30 }),
    ).rejects.toBeInstanceOf(MissionContractError);
    expect(missionRepository.getActive).not.toHaveBeenCalled();
  });
});

describe('updateActiveMissionEditable', () => {
  it('updates notes, reward, and refuseToLose on the active mission', async () => {
    (missionRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({
        id: 'm1',
        status: 'active',
        notes: 'old n',
        reward: 'old r',
        refuseToLose: 'old anchor',
      }),
    );
    (missionRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const updated = await updateActiveMissionEditable('m1', {
      notes: 'new n',
      reward: 'new r',
      refuseToLose: 'new anchor',
    });

    expect(updated.notes).toBe('new n');
    expect(updated.reward).toBe('new r');
    expect(updated.refuseToLose).toBe('new anchor');
    expect(missionRepository.put).toHaveBeenCalledTimes(1);
  });

  it('rejects attempts to change locked fields', async () => {
    (missionRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({ id: 'm1', status: 'active' }),
    );

    await expect(
      updateActiveMissionEditable('m1', { notes: 'ok', title: 'nope' }),
    ).rejects.toBeInstanceOf(MissionContractError);

    expect(missionRepository.put).not.toHaveBeenCalled();
  });

  it('rejects attempts to edit promisedAt (locked)', async () => {
    (missionRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({ id: 'm1', status: 'active' }),
    );

    await expect(
      updateActiveMissionEditable('m1', { promisedAt: '2027-01-01T00:00:00.000Z' }),
    ).rejects.toBeInstanceOf(MissionContractError);

    expect(missionRepository.put).not.toHaveBeenCalled();
  });

  it('refuses when the mission is not active', async () => {
    (missionRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({ id: 'm1', status: 'archived' }),
    );

    await expect(
      updateActiveMissionEditable('m1', { notes: 'x' }),
    ).rejects.toBeInstanceOf(MissionContractError);
  });

  it('throws for missing mission', async () => {
    (missionRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await expect(
      updateActiveMissionEditable('missing', { notes: 'x' }),
    ).rejects.toBeInstanceOf(MissionContractError);
  });
});
