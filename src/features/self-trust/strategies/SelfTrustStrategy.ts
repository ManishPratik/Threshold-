import type { PromiseEvent } from '@data/types/PromiseEvent';

/**
 * The one input shape any scoring strategy receives for a single logical day.
 * The service assembles this from repositories; strategies never touch storage.
 */
export interface DailyScoreInput {
  /** All PromiseEvents that fall within this logical day (chronological). */
  events: PromiseEvent[];
  /** Total blocks the day's active routine has. Used for full-day bonuses. */
  totalScheduledBlocks: number;
  /** Blocks the user marked completed during the day (from DayLog). */
  completedBlockIds: string[];
  /** Blocks explicitly skipped (from DayLog). */
  skippedBlockIds: string[];
}

/**
 * Output of scoring one day. `dailyDelta` is the raw points contribution
 * before the service applies the cumulative floor. `breakdown` is a
 * strategy-defined observability map — persisted as snapshot.inputs.
 */
export interface DailyScoreResult {
  dailyDelta: number;
  breakdown: Record<string, number>;
}

/**
 * Strategy contract. `version` is stamped onto every SelfTrustSnapshot the
 * strategy produces so the service can detect when a rebuild is required
 * (e.g. after upgrading from V1 to V2).
 */
export interface SelfTrustStrategy {
  readonly version: number;
  readonly name: string;
  scoreDay(input: DailyScoreInput): DailyScoreResult;
}
