import type { Routine, RoutineBlock } from '@data/types/Routine';
import type { DayLog } from '@data/types/DayLog';

export interface TodayProgress {
  totalBlocks: number;
  completedBlocks: number;
  skippedBlocks: number;
  remainingBlocks: number;
  currentBlock: RoutineBlock | null;
  currentBlockIndex: number; // -1 when day is done
  /**
   * All blocks still open (not completed, not skipped) in routine order.
   * Includes `currentBlock` at index 0 when one exists — callers that render
   * the hero separately should slice `.slice(1)` to get the secondary list.
   * "Guide, never trap": exposing the full list lets the UI offer any block
   * for out-of-order completion without breaking the "recommended = first
   * incomplete" logic above.
   */
  openBlocks: RoutineBlock[];
}

/**
 * Derives "what should the user do next?" from the routine + today's log.
 * Pure — no persistence, no side effects. The current block is the first
 * routine block whose id is not yet in completedBlockIds or skippedBlockIds.
 */
export function getTodayProgress(routine: Routine, dayLog: DayLog): TodayProgress {
  const done = new Set([...dayLog.completedBlockIds, ...dayLog.skippedBlockIds]);
  const totalBlocks = routine.blocks.length;
  const completedBlocks = dayLog.completedBlockIds.length;
  const skippedBlocks = dayLog.skippedBlockIds.length;

  const openBlocks: RoutineBlock[] = [];
  let currentBlockIndex = -1;
  for (let i = 0; i < routine.blocks.length; i += 1) {
    const block = routine.blocks[i];
    if (block && !done.has(block.id)) {
      if (currentBlockIndex === -1) currentBlockIndex = i;
      openBlocks.push(block);
    }
  }

  const currentBlock = currentBlockIndex === -1 ? null : (routine.blocks[currentBlockIndex] ?? null);
  const remainingBlocks = totalBlocks - completedBlocks - skippedBlocks;

  return {
    totalBlocks,
    completedBlocks,
    skippedBlocks,
    remainingBlocks,
    currentBlock,
    currentBlockIndex,
    openBlocks,
  };
}
