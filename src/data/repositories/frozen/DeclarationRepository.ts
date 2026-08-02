import { getDb } from '@data/db/client';
import { FROZEN_STORES } from '@data/db/schema';
import type { ISODate } from '@shared/lib/date';
import type { Declaration } from '@data/types/frozen/Declaration';

/**
 * Frozen-architecture repository for the `declarations` object store. One
 * record per (promiseId, date) — the composite primary key enforces the
 * one-verdict-per-day invariant.
 *
 * Bound only to the frozen store. No import from any legacy repository,
 * type, or service. Exported only as a class (no eager singleton) so the
 * unwired state is visible at a grep level.
 */
export class DeclarationRepository {
  private readonly storeName = FROZEN_STORES.declarations;

  /**
   * Insert a new Declaration. Rejects if a Declaration for the same
   * (promiseId, date) already exists — Reflection writes at most once per
   * day; re-opening the ritual for a declared day renders read-only.
   */
  async create(declaration: Declaration): Promise<void> {
    const db = await getDb();
    await db.add(this.storeName, declaration);
  }

  /** Idempotent upsert. Overwrites any existing declaration at the same key. */
  async put(declaration: Declaration): Promise<void> {
    const db = await getDb();
    await db.put(this.storeName, declaration);
  }

  /** Read the declaration for one (promiseId, date). Undefined when absent. */
  async get(
    promiseId: string,
    date: ISODate,
  ): Promise<Declaration | undefined> {
    const db = await getDb();
    return (await db.get(this.storeName, [promiseId, date])) as
      | Declaration
      | undefined;
  }

  /**
   * Read every declaration made on `date`, across all Promises. Uses the
   * `by-date` index defined in migration2.
   */
  async getByDate(date: ISODate): Promise<Declaration[]> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-date');
    return (await idx.getAll(date)) as Declaration[];
  }

  /**
   * Read every declaration attached to a single Promise. Uses the
   * `by-promiseId` index defined in migration2. Order is not guaranteed
   * beyond the index's natural iteration; use `backfillOldestFirst` when
   * order matters.
   */
  async listForPromise(promiseId: string): Promise<Declaration[]> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-promiseId');
    return (await idx.getAll(promiseId)) as Declaration[];
  }

  /**
   * Read declarations for one Promise whose date is between `startDate` and
   * `endDate`, both inclusive. Reads via the `by-promiseId` index and
   * filters in memory. Bounded by promise duration.
   */
  async listBetweenDates(
    promiseId: string,
    startDate: ISODate,
    endDate: ISODate,
  ): Promise<Declaration[]> {
    const forPromise = await this.listForPromise(promiseId);
    return forPromise.filter(
      (d) => d.date >= startDate && d.date <= endDate,
    );
  }

  /** True when a declaration exists at (promiseId, date). */
  async exists(promiseId: string, date: ISODate): Promise<boolean> {
    const db = await getDb();
    const key = await db.getKey(this.storeName, [promiseId, date]);
    return key !== undefined;
  }

  /** Delete the declaration at (promiseId, date), if present. */
  async delete(promiseId: string, date: ISODate): Promise<void> {
    const db = await getDb();
    await db.delete(this.storeName, [promiseId, date]);
  }

  /**
   * Return every declaration for a Promise in ascending logical-date order.
   * Ordering only — no interpretation of missing days, no filtering of
   * awaiting days, no business logic. The caller composes this with the
   * Reflection backfill loop.
   */
  async backfillOldestFirst(promiseId: string): Promise<Declaration[]> {
    const forPromise = await this.listForPromise(promiseId);
    return [...forPromise].sort((a, b) => a.date.localeCompare(b.date));
  }
}
