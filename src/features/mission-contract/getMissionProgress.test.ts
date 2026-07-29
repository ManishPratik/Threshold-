import { describe, it, expect } from 'vitest';
import { getMissionProgress } from './getMissionProgress';
import type { Mission } from '@data/types/Mission';

function mission(startDate: string, endDate: string | null): Mission {
  return {
    id: 'm',
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    title: 't',
    statement: '',
    startDate,
    endDate,
    status: 'active',
    targetMetrics: {},
    notes: '',
    reward: '',
    activatedAt: null,
  };
}

describe('getMissionProgress', () => {
  it('day 1 on start date', () => {
    const p = getMissionProgress(mission('2026-01-01', '2026-01-10'), '2026-01-01');
    expect(p.currentDay).toBe(1);
    expect(p.totalDays).toBe(10);
    expect(p.ratio).toBeCloseTo(0.1);
  });

  it('day 12 of 40 for the bootstrap scenario', () => {
    const p = getMissionProgress(mission('2026-01-01', '2026-02-09'), '2026-01-12');
    expect(p.currentDay).toBe(12);
    expect(p.totalDays).toBe(40);
    expect(p.ratio).toBeCloseTo(0.3);
  });

  it('clamps past the end date', () => {
    const p = getMissionProgress(mission('2026-01-01', '2026-01-03'), '2026-01-10');
    expect(p.currentDay).toBe(3);
    expect(p.totalDays).toBe(3);
  });

  it('handles open-ended missions', () => {
    const p = getMissionProgress(mission('2026-01-01', null), '2026-01-05');
    expect(p.currentDay).toBe(5);
    expect(p.totalDays).toBeNull();
    expect(p.ratio).toBeNull();
  });
});
