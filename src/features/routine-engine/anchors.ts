import type { Anchor, RoutineBlock } from '@data/types/frozen/Routine';

/**
 * Canonical anchor order used by every consumer that groups or
 * iterates routine blocks by phase. See ADR 0009 §2, §8.
 */
export const ANCHOR_ORDER: readonly Anchor[] = [
  'morning',
  'midday',
  'evening',
  'night',
] as const;

/**
 * Human-facing anchor labels. Editor and Today both use this map so
 * label text never diverges between screens.
 */
export const ANCHOR_LABELS: Record<Anchor, string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
  night: 'Night',
};

/**
 * Read a block's anchor with the Phase-6 migration default. Blocks
 * that predate the migration have no `anchor` field on disk; every
 * such block resolves to `morning` per the migration spec. Pure.
 */
export function getBlockAnchor(block: RoutineBlock): Anchor {
  return block.anchor ?? 'morning';
}

/**
 * Group blocks by anchor, preserving the caller's input order within
 * each anchor. Every anchor key is present in the returned record,
 * even when its bucket is empty — consumers can iterate `ANCHOR_ORDER`
 * without an intermediate existence check.
 */
export function groupByAnchor(
  blocks: readonly RoutineBlock[],
): Record<Anchor, RoutineBlock[]> {
  const out: Record<Anchor, RoutineBlock[]> = {
    morning: [],
    midday: [],
    evening: [],
    night: [],
  };
  for (const block of blocks) {
    out[getBlockAnchor(block)].push(block);
  }
  return out;
}

/**
 * Return the anchors that contain at least one block, in canonical
 * order. Empty anchors are omitted so Today never renders an empty
 * section per the Phase-6 spec.
 */
export function orderedAnchorsWithBlocks(
  blocks: readonly RoutineBlock[],
): readonly Anchor[] {
  const grouped = groupByAnchor(blocks);
  return ANCHOR_ORDER.filter((a) => grouped[a].length > 0);
}
