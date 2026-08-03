import { describe, it, expect } from 'vitest';
import type { Anchor, Routine } from '@data/types/frozen/Routine';
import { getTodayProgress } from './getCurrentBlock';

function makeRoutine(blockIds: string[]): Routine {
  return {
    id: 'r1',
    promiseId: 'p1',
    blocks: blockIds.map((id) => ({
      id,
      name: id,
      durationMinutes: 15,
      type: 'Ritual',
    })),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
  };
}

function makeAnchoredRoutine(
  spec: readonly { id: string; anchor?: Anchor }[],
): Routine {
  return {
    id: 'r1',
    promiseId: 'p1',
    blocks: spec.map((s) => ({
      id: s.id,
      name: s.id,
      durationMinutes: 15,
      type: 'Ritual',
      ...(s.anchor === undefined ? {} : { anchor: s.anchor }),
    })),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
  };
}

describe('getTodayProgress — empty and boundary inputs', () => {
  it('empty routine returns zero counts and null current block', () => {
    const p = getTodayProgress(makeRoutine([]), []);
    expect(p).toEqual({
      totalBlocks: 0,
      completedBlocks: 0,
      remainingBlocks: 0,
      currentBlock: null,
      currentBlockIndex: -1,
    });
  });

  it('no completions selects first block as current', () => {
    const routine = makeRoutine(['a', 'b', 'c']);
    const p = getTodayProgress(routine, []);
    expect(p.currentBlockIndex).toBe(0);
    expect(p.currentBlock?.id).toBe('a');
    expect(p.totalBlocks).toBe(3);
    expect(p.completedBlocks).toBe(0);
    expect(p.remainingBlocks).toBe(3);
  });
});

describe('getTodayProgress — progression through the routine', () => {
  it('first block completed selects second block as current', () => {
    const routine = makeRoutine(['a', 'b', 'c']);
    const p = getTodayProgress(routine, ['a']);
    expect(p.currentBlockIndex).toBe(1);
    expect(p.currentBlock?.id).toBe('b');
    expect(p.completedBlocks).toBe(1);
    expect(p.remainingBlocks).toBe(2);
  });

  it('all blocks completed returns null current block', () => {
    const routine = makeRoutine(['a', 'b', 'c']);
    const p = getTodayProgress(routine, ['a', 'b', 'c']);
    expect(p.currentBlockIndex).toBe(-1);
    expect(p.currentBlock).toBeNull();
    expect(p.completedBlocks).toBe(3);
    expect(p.remainingBlocks).toBe(0);
  });

  it('non-sequential completion still selects the first remaining block', () => {
    const routine = makeRoutine(['a', 'b', 'c']);
    const p = getTodayProgress(routine, ['b', 'c']);
    expect(p.currentBlockIndex).toBe(0);
    expect(p.currentBlock?.id).toBe('a');
    expect(p.completedBlocks).toBe(2);
    expect(p.remainingBlocks).toBe(1);
  });

  it('completion ids not present in the routine are ignored for indexing but counted', () => {
    const routine = makeRoutine(['a', 'b']);
    const p = getTodayProgress(routine, ['x', 'a']);
    // Note: v1.0.0 shape counts completedBlocks as the length of the input
    // array. Callers pre-filter to routine-owned blocks; the pure function
    // preserves that permissive contract.
    expect(p.completedBlocks).toBe(2);
    expect(p.currentBlockIndex).toBe(1);
    expect(p.currentBlock?.id).toBe('b');
  });

  it('one-block routine — completing it clears the current block', () => {
    const routine = makeRoutine(['only']);
    const before = getTodayProgress(routine, []);
    expect(before.currentBlock?.id).toBe('only');
    const after = getTodayProgress(routine, ['only']);
    expect(after.currentBlock).toBeNull();
    expect(after.currentBlockIndex).toBe(-1);
    expect(after.remainingBlocks).toBe(0);
  });
});

describe('getTodayProgress — anchor-aware traversal (Phase 6)', () => {
  it('picks the first morning block ahead of a later evening block even when insertion order says otherwise', () => {
    const routine = makeAnchoredRoutine([
      { id: 'a', anchor: 'evening' },
      { id: 'b', anchor: 'morning' },
      { id: 'c', anchor: 'midday' },
    ]);
    const p = getTodayProgress(routine, []);
    expect(p.currentBlock?.id).toBe('b');
    // currentBlockIndex still keys into routine.blocks so UI callers
    // that use it to highlight a row keep working.
    expect(p.currentBlockIndex).toBe(1);
  });

  it('advances to the next anchor once every block in the current anchor is done', () => {
    const routine = makeAnchoredRoutine([
      { id: 'm1', anchor: 'morning' },
      { id: 'm2', anchor: 'morning' },
      { id: 'e1', anchor: 'evening' },
    ]);
    const p = getTodayProgress(routine, ['m1', 'm2']);
    expect(p.currentBlock?.id).toBe('e1');
    expect(p.currentBlockIndex).toBe(2);
  });

  it('advances directly from morning to night when midday and evening are empty', () => {
    const routine = makeAnchoredRoutine([
      { id: 'm1', anchor: 'morning' },
      { id: 'n1', anchor: 'night' },
    ]);
    const p = getTodayProgress(routine, ['m1']);
    expect(p.currentBlock?.id).toBe('n1');
  });

  it('preserves within-anchor insertion order', () => {
    const routine = makeAnchoredRoutine([
      { id: 'm2', anchor: 'morning' },
      { id: 'm1', anchor: 'morning' },
    ]);
    const p = getTodayProgress(routine, []);
    expect(p.currentBlock?.id).toBe('m2');
  });

  it('treats a block without an anchor field as morning', () => {
    const routine = makeAnchoredRoutine([
      { id: 'legacy' },
      { id: 'evening-1', anchor: 'evening' },
    ]);
    const p = getTodayProgress(routine, []);
    expect(p.currentBlock?.id).toBe('legacy');
  });

  it('reports all-anchors-done as null current block', () => {
    const routine = makeAnchoredRoutine([
      { id: 'm', anchor: 'morning' },
      { id: 'n', anchor: 'night' },
    ]);
    const p = getTodayProgress(routine, ['m', 'n']);
    expect(p.currentBlock).toBeNull();
    expect(p.currentBlockIndex).toBe(-1);
    expect(p.remainingBlocks).toBe(0);
  });
});
