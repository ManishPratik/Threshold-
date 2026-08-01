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

describe('getTodayProgress > openBlocks', () => {
  it('lists all blocks in order when nothing is done', () => {
    const p = getTodayProgress(routine, dayLog([]));
    expect(p.openBlocks.map((b) => b.id)).toEqual(['a', 'b', 'c']);
  });

  it('preserves original routine order (not completion order)', () => {
    // 'b' completed first, then 'a' — openBlocks must still start with 'c'
    // if we complete 'a' and 'b'. When only 'b' is complete, list = ['a','c'].
    const p = getTodayProgress(routine, dayLog(['b']));
    expect(p.openBlocks.map((b) => b.id)).toEqual(['a', 'c']);
    expect(p.currentBlock?.id).toBe('a');
    expect(p.currentBlockIndex).toBe(0);
  });

  it('excludes skipped blocks', () => {
    const p = getTodayProgress(routine, dayLog(['a'], ['b']));
    expect(p.openBlocks.map((b) => b.id)).toEqual(['c']);
  });

  it('is empty when every block is done or skipped', () => {
    const p = getTodayProgress(routine, dayLog(['a', 'c'], ['b']));
    expect(p.openBlocks).toEqual([]);
    expect(p.currentBlock).toBeNull();
  });

  it('places currentBlock at openBlocks[0]', () => {
    const p = getTodayProgress(routine, dayLog(['a']));
    expect(p.openBlocks[0]?.id).toBe(p.currentBlock?.id);
    expect(p.openBlocks.map((b) => b.id)).toEqual(['b', 'c']);
  });
});
