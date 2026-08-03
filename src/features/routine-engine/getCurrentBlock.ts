import type { Routine, RoutineBlock } from '@data/types/frozen/Routine';

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
 */
export interface TodayProgress {
  totalBlocks: number;
  completedBlocks: number;
  remainingBlocks: number;
  currentBlock: RoutineBlock | null;
  currentBlockIndex: number; // -1 when day is done
}

/**
 * Derives "what should the user do next?" from the routine + the day's
 * completed-block ids. Pure — no persistence, no side effects. The current
 * block is the first routine block whose id is not yet completed.
 */
export function getTodayProgress(
  routine: Routine,
  completedBlockIds: readonly string[],
): TodayProgress {
  const done = new Set(completedBlockIds);
  const totalBlocks = routine.blocks.length;
  const completedBlocks = completedBlockIds.length;

  let currentBlockIndex = -1;
  for (let i = 0; i < routine.blocks.length; i += 1) {
    const block = routine.blocks[i];
    if (block && !done.has(block.id)) {
      currentBlockIndex = i;
      break;
    }
  }

  const currentBlock =
    currentBlockIndex === -1
      ? null
      : (routine.blocks[currentBlockIndex] ?? null);
  const remainingBlocks = totalBlocks - completedBlocks;

  return {
    totalBlocks,
    completedBlocks,
    remainingBlocks,
    currentBlock,
    currentBlockIndex,
  };
}
