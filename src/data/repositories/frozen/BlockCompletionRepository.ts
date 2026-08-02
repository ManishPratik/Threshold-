import { getDb } from '@data/db/client';
import { FROZEN_STORES } from '@data/db/schema';
import type { ISODate } from '@shared/lib/date';
import type { BlockCompletion } from '@data/types/frozen/BlockCompletion';

/**
 * Frozen-architecture repository for the `blockCompletions` object store.
 * One record per (promiseId, date, blockId) — the composite primary key
 * enforces the one-completion-per-block-per-day invariant.
 *
 * Bound only to the frozen store. No import from any legacy repository,
 * type, or service. No completion rules, no routine logic, no Promise
 * logic — the caller composes those. Exported only as a class (no eager
 * singleton) so the unwired state is visible at a grep level.
 */
export class BlockCompletionRepository {
  private readonly storeName = FROZEN_STORES.blockCompletions;
  private readonly promiseDateIndex = 'by-promiseId-date';

  /**
   * Insert a new BlockCompletion. Rejects if a completion for the same
   * (promiseId, date, blockId) already exists — use `put()` for idempotent
   * writes (the Today complete-block action is idempotent per Engineering
   * Foundations §3).
   */
  async create(completion: BlockCompletion): Promise<void> {
    const db = await getDb();
    await db.add(this.storeName, completion);
  }

  /** Idempotent upsert. Overwrites any existing completion at the same key. */
  async put(completion: BlockCompletion): Promise<void> {
    const db = await getDb();
    await db.put(this.storeName, completion);
  }

  /** Read one completion by (promiseId, date, blockId). Undefined when absent. */
  async get(
    promiseId: string,
    date: ISODate,
    blockId: string,
  ): Promise<BlockCompletion | undefined> {
    const db = await getDb();
    return (await db.get(this.storeName, [promiseId, date, blockId])) as
      | BlockCompletion
      | undefined;
  }

  /** Delete one completion by (promiseId, date, blockId), if present. */
  async delete(
    promiseId: string,
    date: ISODate,
    blockId: string,
  ): Promise<void> {
    const db = await getDb();
    await db.delete(this.storeName, [promiseId, date, blockId]);
  }

  /** True when a completion exists at (promiseId, date, blockId). */
  async exists(
    promiseId: string,
    date: ISODate,
    blockId: string,
  ): Promise<boolean> {
    const db = await getDb();
    const key = await db.getKey(this.storeName, [promiseId, date, blockId]);
    return key !== undefined;
  }

  /**
   * Every completion for one Promise across all days. Uses the
   * `by-promiseId-date` compound index defined in migration2 with a
   * bounded range on the promiseId prefix.
   */
  async listForPromise(promiseId: string): Promise<BlockCompletion[]> {
    const db = await getDb();
    const range = IDBKeyRange.bound([promiseId], [promiseId, '￿']);
    return (await db.getAllFromIndex(
      this.storeName,
      this.promiseDateIndex,
      range,
    )) as BlockCompletion[];
  }

  /**
   * Every completion across all Promises on one date. The `by-promiseId-date`
   * compound index is keyed on promiseId first, so a date-only lookup falls
   * back to a full scan filtered in memory. Bounded by (active promises) ×
   * (blocks per day).
   */
  async listForDate(date: ISODate): Promise<BlockCompletion[]> {
    const db = await getDb();
    const all = (await db.getAll(this.storeName)) as BlockCompletion[];
    return all.filter((c) => c.date === date);
  }

  /**
   * Every completion for one Promise on one date. Uses the
   * `by-promiseId-date` index directly via IDBKeyRange.only.
   */
  async listForToday(
    promiseId: string,
    today: ISODate,
  ): Promise<BlockCompletion[]> {
    const db = await getDb();
    return (await db.getAllFromIndex(
      this.storeName,
      this.promiseDateIndex,
      IDBKeyRange.only([promiseId, today]),
    )) as BlockCompletion[];
  }

  /**
   * Every completion of one block for one Promise across all days. Reads
   * via `listForPromise` and filters in memory (bounded by promise duration).
   */
  async listForBlock(
    promiseId: string,
    blockId: string,
  ): Promise<BlockCompletion[]> {
    const forPromise = await this.listForPromise(promiseId);
    return forPromise.filter((c) => c.blockId === blockId);
  }

  /**
   * Delete every completion for one Promise on one date. Opens a cursor
   * over the `by-promiseId-date` index and deletes each row inside a single
   * readwrite transaction.
   */
  async clearForDate(promiseId: string, date: ISODate): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const idx = tx.store.index(this.promiseDateIndex);
    let cursor = await idx.openCursor(IDBKeyRange.only([promiseId, date]));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }
}
