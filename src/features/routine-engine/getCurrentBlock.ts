import type { Routine, RoutineBlock } from '@data/types/Routine';
import type { DayLog } from '@data/types/DayLog';

export interface TodayProgress {
  totalBlocks: number;
  completedBlocks: number;
  skippedBlocks: number;
  remainingBlocks: number;
  currentBlock: RoutineBlock | null;
  currentBlockIndex: number; // -1 when day is done
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

  let currentBlockIndex = -1;
  for (let i = 0; i < routine.blocks.length; i += 1) {
    const block = routine.blocks[i];
    if (block && !done.has(block.id)) {
      currentBlockIndex = i;
      break;
    }
  }

  const currentBlock = currentBlockIndex === -1 ? null : (routine.blocks[currentBlockIndex] ?? null);
  const remainingBlocks = totalBlocks - completedBlocks - skippedBlocks;

  return { totalBlocks, completedBlocks, skippedBlocks, remainingBlocks, currentBlock, currentBlockIndex };
}
