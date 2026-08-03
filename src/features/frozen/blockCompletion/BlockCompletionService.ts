import type { BlockCompletion } from '@data/types/frozen/BlockCompletion';
import { BlockCompletionRepository } from '@data/repositories/frozen/BlockCompletionRepository';
import type { ISODate, ISODateTime } from '@shared/lib/date';
import { nowIso } from '@shared/lib/date';

const BLOCK_COMPLETION_SCHEMA_VERSION = 1;

/**
 * Frozen-architecture BlockCompletion service. Writes and reads
 * BlockCompletion records only. The composite primary key
 * (promiseId, date, blockId) enforces one-completion-per-block-per-day at
 * the IDB level; `put` semantics make the completion write idempotent so
 * duplicate taps never create duplicate rows.
 *
 * No declaration logic, no Promise lifecycle mutation, no routine
 * editing, no UI logic. The caller-supplied `date` is the logical-day
 * target for the completion (per Engineering Foundations §8) and is
 * preserved verbatim.
 *
 * Every mutation runs inside a single readwrite transaction on the
 * `blockCompletions` store — repository methods each open their own
 * single-store transaction, which satisfies Engineering Foundations §10
 * atomicity for single-store writes.
 *
 * Not wired into any production code in this slice.
 */
export class BlockCompletionService {
  constructor(
    private readonly completions: BlockCompletionRepository = new BlockCompletionRepository(),
  ) {}

  /**
   * Record that (promiseId, date, blockId) is completed. Idempotent:
   * re-tapping the same key overwrites the row with the same identity
   * and refreshes `completedAt`. Returns the stored record.
   */
  async completeBlock(
    promiseId: string,
    date: ISODate,
    blockId: string,
    completedAt?: ISODateTime,
  ): Promise<BlockCompletion> {
    const record: BlockCompletion = {
      promiseId,
      date,
      blockId,
      completedAt: completedAt ?? nowIso(),
      schemaVersion: BLOCK_COMPLETION_SCHEMA_VERSION,
    };
    await this.completions.put(record);
    return record;
  }

  /**
   * Delete the completion at (promiseId, date, blockId), if present.
   * Safe when no completion exists — the underlying delete is a no-op.
   */
  async uncompleteBlock(
    promiseId: string,
    date: ISODate,
    blockId: string,
  ): Promise<void> {
    await this.completions.delete(promiseId, date, blockId);
  }

  /** True when (promiseId, date, blockId) has a completion recorded. */
  async isBlockCompleted(
    promiseId: string,
    date: ISODate,
    blockId: string,
  ): Promise<boolean> {
    return this.completions.exists(promiseId, date, blockId);
  }

  /**
   * Read every completion for one Promise on today's logical day. Alias of
   * `getCompletedBlocksForDate` with today's date supplied by the caller
   * so the service stays free of logical-day computation.
   */
  async getCompletedBlocksForToday(
    promiseId: string,
    today: ISODate,
  ): Promise<BlockCompletion[]> {
    return this.completions.listForToday(promiseId, today);
  }

  /**
   * Read every completion for one Promise on the given logical date. Uses
   * the `by-promiseId-date` compound index defined in migration2.
   */
  async getCompletedBlocksForDate(
    promiseId: string,
    date: ISODate,
  ): Promise<BlockCompletion[]> {
    return this.completions.listForToday(promiseId, date);
  }

  /**
   * Read every completion for one Promise across ALL logical days. Delegates
   * to BlockCompletionRepository.listForPromise which uses the
   * `by-promiseId-date` compound index with a bounded prefix range. Consumers:
   * derived Self-Trust score and Analytics counts across the full Promise arc.
   */
  async listForPromise(promiseId: string): Promise<BlockCompletion[]> {
    return this.completions.listForPromise(promiseId);
  }

  /**
   * Delete every completion for one Promise on one logical date. Runs
   * inside a single readwrite transaction via
   * `BlockCompletionRepository.clearForDate`. No-op when the day has no
   * completions.
   */
  async clearDayCompletions(
    promiseId: string,
    date: ISODate,
  ): Promise<void> {
    await this.completions.clearForDate(promiseId, date);
  }
}
