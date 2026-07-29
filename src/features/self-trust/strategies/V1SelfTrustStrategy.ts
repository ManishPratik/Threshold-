import { V1_CONSTANTS } from '../constants';
import type { DailyScoreInput, DailyScoreResult, SelfTrustStrategy } from './SelfTrustStrategy';

/**
 * V1 formula — deliberately simple, deterministic, and easy to explain.
 *
 *   kept promise    → +1
 *   broken promise  → -2
 *   skipped block   →  0   (no penalty; no reward)
 *   deferred        →  0
 *   full-day bonus  → +3   (awarded when every scheduled block is complete)
 *
 * The service applies scoreFloor (0) to the cumulative — never negative.
 */
export const v1SelfTrustStrategy: SelfTrustStrategy = {
  version: V1_CONSTANTS.version,
  name: V1_CONSTANTS.name,
  scoreDay(input: DailyScoreInput): DailyScoreResult {
    let keptCount = 0;
    let brokenCount = 0;
    let deferredCount = 0;

    for (const e of input.events) {
      if (e.kind === 'kept') keptCount += 1;
      else if (e.kind === 'broken') brokenCount += 1;
      else if (e.kind === 'deferred') deferredCount += 1;
    }

    const skippedCount = input.skippedBlockIds.length;

    const keptPoints = keptCount * V1_CONSTANTS.pointsPerKept;
    const brokenPoints = brokenCount * V1_CONSTANTS.pointsPerBroken;
    const skippedPoints = skippedCount * V1_CONSTANTS.pointsPerSkipped;
    const deferredPoints = deferredCount * V1_CONSTANTS.pointsPerDeferred;

    const scheduled = input.totalScheduledBlocks;
    const completed = input.completedBlockIds.length;
    const allBlocksDone = scheduled > 0 && completed >= scheduled;
    const bonusPoints = allBlocksDone ? V1_CONSTANTS.fullDayBonus : 0;

    const dailyDelta =
      keptPoints + brokenPoints + skippedPoints + deferredPoints + bonusPoints;

    return {
      dailyDelta,
      breakdown: {
        keptCount,
        brokenCount,
        deferredCount,
        skippedCount,
        keptPoints,
        brokenPoints,
        skippedPoints,
        deferredPoints,
        bonusPoints,
        scheduled,
        completed,
      },
    };
  },
};
