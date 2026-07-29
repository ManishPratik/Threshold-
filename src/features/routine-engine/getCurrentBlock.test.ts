import { describe, it, expect } from 'vitest';
import { getTodayProgress } from './getCurrentBlock';
import type { Routine, RoutineBlock } from '@data/types/Routine';
import type { DayLog } from '@data/types/DayLog';

function block(id: string, label: string): RoutineBlock {
  return { id, label, durationMinutes: 30, type: 'focus', expectedStart: null };
}

const routine: Routine = {
  id: 'r1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  schemaVersion: 1,
  name: 'test',
  missionId: 'm1',
  active: true,
  blocks: [block('a', 'A'), block('b', 'B'), block('c', 'C')],
};

function dayLog(completed: string[], skipped: string[] = []): DayLog {
  return {
    id: 'd1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    date: '2026-01-01',
    dayStartAt: '2026-01-01T04:00:00.000Z',
    state: 'normal',
    completedBlockIds: completed,
    skippedBlockIds: skipped,
    notes: '',
  };
}

describe('getTodayProgress', () => {
  it('returns the first block when nothing done', () => {
    const p = getTodayProgress(routine, dayLog([]));
    expect(p.currentBlock?.id).toBe('a');
    expect(p.currentBlockIndex).toBe(0);
    expect(p.completedBlocks).toBe(0);
    expect(p.remainingBlocks).toBe(3);
  });

  it('advances past completed blocks', () => {
    const p = getTodayProgress(routine, dayLog(['a', 'b']));
    expect(p.currentBlock?.id).toBe('c');
    expect(p.completedBlocks).toBe(2);
    expect(p.remainingBlocks).toBe(1);
  });

  it('treats skipped blocks as done', () => {
    const p = getTodayProgress(routine, dayLog(['a'], ['b']));
    expect(p.currentBlock?.id).toBe('c');
    expect(p.remainingBlocks).toBe(1);
  });

  it('returns null current block when everything is done', () => {
    const p = getTodayProgress(routine, dayLog(['a', 'b', 'c']));
    expect(p.currentBlock).toBeNull();
    expect(p.currentBlockIndex).toBe(-1);
    expect(p.remainingBlocks).toBe(0);
  });
});
