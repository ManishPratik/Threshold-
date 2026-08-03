import type { Routine, RoutineBlock } from '@data/types/frozen/Routine';
import { ANCHOR_ORDER, groupByAnchor } from './anchors';

/**
 * Adapted from tag v1.0.0 (routine-engine folder). Original signature was
 * `getTodayProgress(routine: Routine, dayLog: DayLog)`. The Frozen data model
 * has no DayLog store — routine block progress is expressed by the set of
 * BlockCompletion rows for (promiseId, date). Callers pass the derived list
 * of completed block ids for today so this function stays pure and
 * store-agnostic.
 *
 * "Skipped" is not a concept in the Frozen model (BlockCompletion has no
 * skipped side per personal-os/src/data/types/frozen/BlockCompletion.ts
 * lines 12-18). The v1.0.0 shape kept a `skippedBlocks` field which is
 * omitted here; a future recovery of per-block skip UI can restore it
 * without breaking existing consumers.
 *
 * Phase 6: current-focus derivation now traverses blocks in anchor
 * order (morning → midday → evening → night; see
 * personal-os/src/features/routine-engine/anchors.ts `ANCHOR_ORDER`)
 * rather than raw insertion order. Within an anchor, blocks retain
 * the caller's order. `currentBlockIndex` continues to reference the
 * original `routine.blocks` array so consumers that key on the
 * position (tests, UI progress badges) keep working.
 */
export interface TodayProgress {
  totalBlocks: number;
  completedBlocks: number;
  remainingBlocks: number;
  currentBlock: RoutineBlock | null;
  currentBlockIndex: number; // -1 when day is done, index into routine.blocks
}

/**
 * Derives "what should the user do next?" from the routine + the day's
 * completed-block ids. Pure — no persistence, no side effects.
 *
 * Traversal order: anchors iterated per `ANCHOR_ORDER`; within an
 * anchor, blocks iterated in `routine.blocks` insertion order. The
 * first block whose id is not in the completed set becomes the current
 * focus. When the current anchor's blocks are all done, the next
 * non-empty anchor's first incomplete block takes over automatically.
 */
export function getTodayProgress(
  routine: Routine,
  completedBlockIds: readonly string[],
): TodayProgress {
  const done = new Set(completedBlockIds);
  const totalBlocks = routine.blocks.length;
  const completedBlocks = completedBlockIds.length;

  const grouped = groupByAnchor(routine.blocks);

  let currentBlock: RoutineBlock | null = null;
  for (const anchor of ANCHOR_ORDER) {
    const bucket = grouped[anchor];
    for (const block of bucket) {
      if (!done.has(block.id)) {
        currentBlock = block;
        break;
      }
    }
    if (currentBlock !== null) break;
  }

  const selectedId = currentBlock === null ? null : currentBlock.id;
  const currentBlockIndex =
    selectedId === null
      ? -1
      : routine.blocks.findIndex((b) => b.id === selectedId);

  const remainingBlocks = totalBlocks - completedBlocks;

  return {
    totalBlocks,
    completedBlocks,
    remainingBlocks,
    currentBlock,
    currentBlockIndex,
  };
}
