import { describe, it, expect } from 'vitest';
import type { Anchor, RoutineBlock } from '@data/types/frozen/Routine';
import {
  ANCHOR_LABELS,
  ANCHOR_ORDER,
  getBlockAnchor,
  groupByAnchor,
  orderedAnchorsWithBlocks,
} from './anchors';

function block(id: string, anchor?: Anchor): RoutineBlock {
  return {
    id,
    name: id,
    durationMinutes: 15,
    type: 'Ritual',
    ...(anchor === undefined ? {} : { anchor }),
  };
}

describe('ANCHOR_ORDER', () => {
  it('is morning → midday → evening → night', () => {
    expect(ANCHOR_ORDER).toEqual(['morning', 'midday', 'evening', 'night']);
  });
  it('is a readonly-shaped array (immutability contract)', () => {
    // ADR 0009 §2 fixes the four V1 anchors — consumers must not mutate.
    expect(ANCHOR_ORDER.length).toBe(4);
  });
});

describe('ANCHOR_LABELS', () => {
  it('has a label for every anchor value', () => {
    for (const a of ANCHOR_ORDER) {
      expect(typeof ANCHOR_LABELS[a]).toBe('string');
      expect(ANCHOR_LABELS[a].length).toBeGreaterThan(0);
    }
  });
});

describe('getBlockAnchor', () => {
  it('returns the block anchor when present', () => {
    expect(getBlockAnchor(block('a', 'evening'))).toBe('evening');
  });
  it('defaults to morning when the anchor field is absent', () => {
    expect(getBlockAnchor(block('a'))).toBe('morning');
  });
});

describe('groupByAnchor', () => {
  it('returns four empty buckets for an empty block list', () => {
    const g = groupByAnchor([]);
    expect(g).toEqual({ morning: [], midday: [], evening: [], night: [] });
  });

  it('assigns anchorless blocks to morning', () => {
    const g = groupByAnchor([block('a'), block('b')]);
    expect(g.morning.map((b) => b.id)).toEqual(['a', 'b']);
    expect(g.midday).toEqual([]);
    expect(g.evening).toEqual([]);
    expect(g.night).toEqual([]);
  });

  it('preserves within-anchor insertion order', () => {
    const g = groupByAnchor([
      block('e2', 'evening'),
      block('e1', 'evening'),
      block('m', 'morning'),
    ]);
    expect(g.morning.map((b) => b.id)).toEqual(['m']);
    expect(g.evening.map((b) => b.id)).toEqual(['e2', 'e1']);
  });
});

describe('orderedAnchorsWithBlocks', () => {
  it('returns an empty list for an empty block list', () => {
    expect(orderedAnchorsWithBlocks([])).toEqual([]);
  });

  it('skips empty anchors', () => {
    expect(
      orderedAnchorsWithBlocks([
        block('m', 'morning'),
        block('n', 'night'),
      ]),
    ).toEqual(['morning', 'night']);
  });

  it('preserves canonical order regardless of block insertion order', () => {
    expect(
      orderedAnchorsWithBlocks([
        block('n', 'night'),
        block('m', 'morning'),
        block('e', 'evening'),
      ]),
    ).toEqual(['morning', 'evening', 'night']);
  });
});
