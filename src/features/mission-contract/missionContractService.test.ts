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
  it('accepts a well-formed draft', () => {
    expect(validateDraft({ title: 'A', why: 'B', durationDays: 40 })).toEqual([]);
  });

  it('rejects empty title', () => {
    const errs = validateDraft({ title: '  ', why: 'B', durationDays: 40 });
    expect(errs.map((e) => e.field)).toContain('title');
  });

  it('rejects empty why', () => {
    const errs = validateDraft({ title: 'A', why: '', durationDays: 40 });
    expect(errs.map((e) => e.field)).toContain('why');
  });

  it('rejects out-of-range duration', () => {
    expect(validateDraft({ title: 'A', why: 'B', durationDays: 0 })).toHaveLength(1);
    expect(validateDraft({ title: 'A', why: 'B', durationDays: 400 })).toHaveLength(1);
    expect(validateDraft({ title: 'A', why: 'B', durationDays: 1.5 })).toHaveLength(1);
  });

  it('accepts every documented preset', () => {
    for (const d of DURATION_PRESETS) {
      expect(validateDraft({ title: 'A', why: 'B', durationDays: d })).toEqual([]);
    }
  });
});

describe('projectDraft', () => {
  it('endDate = startDate + (durationDays - 1)', () => {
    const p = projectDraft({ title: '', why: '', durationDays: 40 }, '2026-01-01');
    expect(p.startDate).toBe('2026-01-01');
    expect(p.endDate).toBe('2026-02-09');
    expect(p.totalDays).toBe(40);
  });
});

describe('activateNewMission', () => {
  it('persists a mission, purges bootstrap, and ensures today log', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (dayLogRepository.getOrCreateForToday as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (missionRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await activateNewMission(
      { title: 'Do the thing', why: 'It matters', durationDays: 40 },
      '2026-01-01',
    );

    expect(result.title).toBe('Do the thing');
    expect(result.statement).toBe('It matters');
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-02-09');
    expect(result.status).toBe('active');
    expect(result.targetMetrics).toEqual({ targetDays: 40 });
    expect(result.notes).toBe('');
    expect(result.reward).toBe('');

    expect(missionRepository.put).toHaveBeenCalledTimes(1);
    expect(purgeBootstrap).toHaveBeenCalledTimes(1);
    expect(dayLogRepository.getOrCreateForToday).toHaveBeenCalledTimes(1);
  });

  it('allows activation when only a bootstrap mission is active', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({ id: 'bootstrap-mission-01' }),
    );
    (dayLogRepository.getOrCreateForToday as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(
      activateNewMission({ title: 'A', why: 'B', durationDays: 30 }),
    ).resolves.toBeDefined();

    expect(missionRepository.put).toHaveBeenCalledTimes(1);
    expect(purgeBootstrap).toHaveBeenCalledTimes(1);
  });

  it('refuses activation when a real active mission exists', async () => {
    (missionRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({ id: 'real-mission' }),
    );

    await expect(
      activateNewMission({ title: 'A', why: 'B', durationDays: 30 }),
    ).rejects.toBeInstanceOf(MissionContractError);

    expect(missionRepository.put).not.toHaveBeenCalled();
    expect(purgeBootstrap).not.toHaveBeenCalled();
  });

  it('refuses invalid drafts before touching the DB', async () => {
    await expect(
      activateNewMission({ title: '', why: '', durationDays: 0 }),
    ).rejects.toBeInstanceOf(MissionContractError);
    expect(missionRepository.getActive).not.toHaveBeenCalled();
  });
});

describe('updateActiveMissionEditable', () => {
  it('updates notes and reward on the active mission', async () => {
    (missionRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
      stubMission({ id: 'm1', status: 'active', notes: 'old', reward: 'old' }),
    );
    (missionRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const updated = await updateActiveMissionEditable('m1', { notes: 'new n', reward: 'new r' });

    expect(updated.notes).toBe('new n');
    expect(updated.reward).toBe('new r');
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
