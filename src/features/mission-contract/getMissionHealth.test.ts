import { describe, it, expect } from 'vitest';
import { getMissionHealth, healthLabel } from './getMissionHealth';
import type { Mission } from '@data/types/Mission';
import type { DayLog } from '@data/types/DayLog';

const baseMission: Mission = {
  id: 'm1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  schemaVersion: 1,
  title: 't',
  statement: '',
  startDate: '2026-01-01',
  endDate: '2026-02-01',
  status: 'active',
  targetMetrics: {},
  notes: '',
  reward: '',
  activatedAt: '2026-01-01T00:00:00.000Z',
};

function dayLog(state: 'normal' | 'recovery'): DayLog {
  return {
    id: 'd1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    date: '2026-01-01',
    dayStartAt: '2026-01-01T04:00:00.000Z',
    state,
    completedBlockIds: [],
    skippedBlockIds: [],
    notes: '',
  };
}

describe('getMissionHealth', () => {
  it('healthy when active mission and normal-state day', () => {
    expect(getMissionHealth(baseMission, dayLog('normal'))).toBe('healthy');
  });

  it('healthy when today has no log yet', () => {
    expect(getMissionHealth(baseMission, undefined)).toBe('healthy');
  });

  it('in-recovery when today is in recovery state', () => {
    expect(getMissionHealth(baseMission, dayLog('recovery'))).toBe('in-recovery');
  });

  it('completed overrides day state', () => {
    const completed: Mission = { ...baseMission, status: 'completed' };
    expect(getMissionHealth(completed, dayLog('recovery'))).toBe('completed');
  });
});

describe('healthLabel', () => {
  it('maps to human-readable labels', () => {
    expect(healthLabel('healthy')).toBe('Healthy');
    expect(healthLabel('in-recovery')).toBe('In recovery');
    expect(healthLabel('completed')).toBe('Completed');
  });
});
