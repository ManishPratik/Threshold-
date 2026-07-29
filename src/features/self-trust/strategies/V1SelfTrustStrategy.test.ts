import { describe, it, expect } from 'vitest';
import { v1SelfTrustStrategy } from './V1SelfTrustStrategy';
import { V1_CONSTANTS } from '../constants';
import type { PromiseEvent } from '@data/types/PromiseEvent';

function keptEvent(id: string): PromiseEvent {
  return {
    id,
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    dayLogId: 'd',
    kind: 'kept',
    source: 'manual',
    blockId: id,
    missionId: 'm',
    at: '',
    note: '',
  };
}

function brokenEvent(id: string): PromiseEvent {
  return { ...keptEvent(id), kind: 'broken' };
}

function deferredEvent(id: string): PromiseEvent {
  return { ...keptEvent(id), kind: 'deferred' };
}

describe('v1SelfTrustStrategy', () => {
  it('exposes a version identifier matching the constants', () => {
    expect(v1SelfTrustStrategy.version).toBe(V1_CONSTANTS.version);
    expect(v1SelfTrustStrategy.name).toBe(V1_CONSTANTS.name);
  });

  it('awards +1 per kept promise', () => {
    const result = v1SelfTrustStrategy.scoreDay({
      events: [keptEvent('a'), keptEvent('b'), keptEvent('c')],
      totalScheduledBlocks: 5,
      completedBlockIds: ['a', 'b', 'c'],
      skippedBlockIds: [],
    });
    expect(result.dailyDelta).toBe(3);
    expect(result.breakdown.keptPoints).toBe(3);
    expect(result.breakdown.bonusPoints).toBe(0);
  });

  it('deducts 2 per broken promise', () => {
    const result = v1SelfTrustStrategy.scoreDay({
      events: [brokenEvent('a'), brokenEvent('b')],
      totalScheduledBlocks: 5,
      completedBlockIds: [],
      skippedBlockIds: [],
    });
    expect(result.dailyDelta).toBe(-4);
    expect(result.breakdown.brokenPoints).toBe(-4);
  });

  it('scores skipped and deferred as zero', () => {
    const result = v1SelfTrustStrategy.scoreDay({
      events: [deferredEvent('a'), deferredEvent('b')],
      totalScheduledBlocks: 3,
      completedBlockIds: [],
      skippedBlockIds: ['x', 'y'],
    });
    expect(result.dailyDelta).toBe(0);
    expect(result.breakdown.deferredCount).toBe(2);
    expect(result.breakdown.skippedCount).toBe(2);
  });

  it('awards the +3 full-day bonus when every scheduled block is complete', () => {
    const result = v1SelfTrustStrategy.scoreDay({
      events: [keptEvent('a'), keptEvent('b'), keptEvent('c')],
      totalScheduledBlocks: 3,
      completedBlockIds: ['a', 'b', 'c'],
      skippedBlockIds: [],
    });
    expect(result.dailyDelta).toBe(3 + 3);
    expect(result.breakdown.bonusPoints).toBe(3);
  });

  it('does not award the full-day bonus when the routine has zero blocks', () => {
    const result = v1SelfTrustStrategy.scoreDay({
      events: [],
      totalScheduledBlocks: 0,
      completedBlockIds: [],
      skippedBlockIds: [],
    });
    expect(result.dailyDelta).toBe(0);
    expect(result.breakdown.bonusPoints).toBe(0);
  });

  it('does not award the full-day bonus when a block is missing', () => {
    const result = v1SelfTrustStrategy.scoreDay({
      events: [keptEvent('a'), keptEvent('b')],
      totalScheduledBlocks: 3,
      completedBlockIds: ['a', 'b'],
      skippedBlockIds: [],
    });
    expect(result.dailyDelta).toBe(2);
    expect(result.breakdown.bonusPoints).toBe(0);
  });

  it('combines kept + broken + skipped + bonus additively before floor', () => {
    // 4 kept (+4) + 1 broken (-2) + 2 skipped (0) + no bonus = +2
    const result = v1SelfTrustStrategy.scoreDay({
      events: [
        keptEvent('a'),
        keptEvent('b'),
        keptEvent('c'),
        keptEvent('d'),
        brokenEvent('e'),
      ],
      totalScheduledBlocks: 7,
      completedBlockIds: ['a', 'b', 'c', 'd'],
      skippedBlockIds: ['x', 'y'],
    });
    expect(result.dailyDelta).toBe(2);
    expect(result.breakdown.keptPoints).toBe(4);
    expect(result.breakdown.brokenPoints).toBe(-2);
    expect(result.breakdown.skippedPoints).toBe(0);
    expect(result.breakdown.bonusPoints).toBe(0);
  });

  it('is a pure function — same inputs yield same outputs', () => {
    const input = {
      events: [keptEvent('a'), brokenEvent('b')],
      totalScheduledBlocks: 3,
      completedBlockIds: ['a'],
      skippedBlockIds: ['x'],
    };
    const a = v1SelfTrustStrategy.scoreDay(input);
    const b = v1SelfTrustStrategy.scoreDay(input);
    expect(a).toEqual(b);
  });
});
