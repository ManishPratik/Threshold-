import { getDb } from '@data/db/client';
import { FROZEN_STORES } from '@data/db/schema';
import type { PromiseRecord } from '@data/types/PromiseRecord';

/**
 * Frozen-architecture repository for the `promises` object store. Reads and
 * writes PromiseRecord rows. Bound only to the frozen store — no import from
 * any legacy repository, no cross-store side effects.
 *
 * The active-Promise pointer lives on AppState (see Engineering Foundations
 * §1). `getActive()` on this repository is a self-contained fallback that
 * identifies the active Promise from its own terminal timestamps
 * (`brokenAt` absent AND `completedAt` absent), so callers that do not hold
 * the AppState pointer can still resolve the current Promise.
 *
 * Unwired in this slice: no production module imports this class. Exported
 * only as a class (no eager singleton instance) to make the isolation
 * visible at a grep level.
 */
export class PromiseRepository {
  private readonly storeName = FROZEN_STORES.promises;

  /**
   * Insert a new Promise. Rejects if a Promise with the same `id` already
   * exists — creation is not idempotent; use `update()` to overwrite.
   */
  async create(promise: PromiseRecord): Promise<void> {
    const db = await getDb();
    await db.add(this.storeName, promise);
  }

  /** Fetch a Promise by primary key. Returns undefined when absent. */
  async getById(id: string): Promise<PromiseRecord | undefined> {
    const db = await getDb();
    return (await db.get(this.storeName, id)) as PromiseRecord | undefined;
  }

  /**
   * Returns the currently active Promise, if one exists. A Promise is active
   * when it has neither ended broken (`brokenAt` absent) nor completed
   * (`completedAt` absent). If multiple such records exist (an app-invariant
   * violation the schema itself does not prevent), the most-recently
   * activated is returned.
   */
  async getActive(): Promise<PromiseRecord | undefined> {
    const db = await getDb();
    const all = (await db.getAll(this.storeName)) as PromiseRecord[];
    const activeCandidates = all.filter(
      (p) => p.brokenAt === undefined && p.completedAt === undefined,
    );
    if (activeCandidates.length === 0) return undefined;
    return activeCandidates.reduce((latest, p) =>
      p.activatedAt > latest.activatedAt ? p : latest,
    );
  }

  /**
   * Overwrite a Promise. Used only to set terminal timestamps
   * (`brokenAt`/`brokenKind`/`completedAt`) — the domain-level immutability
   * of every other field is enforced by the Promise service, not by this
   * repository.
   */
  async update(promise: PromiseRecord): Promise<void> {
    const db = await getDb();
    await db.put(this.storeName, promise);
  }

  /** Delete a Promise by primary key. */
  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(this.storeName, id);
  }

  /** Return every Promise, unordered. */
  async list(): Promise<PromiseRecord[]> {
    const db = await getDb();
    return (await db.getAll(this.storeName)) as PromiseRecord[];
  }

  /** True when a Promise with the given id exists in the store. */
  async exists(id: string): Promise<boolean> {
    const db = await getDb();
    const key = await db.getKey(this.storeName, id);
    return key !== undefined;
  }

  /** Fetch a Promise via the unique `by-attemptNumber` index. */
  async getByAttemptNumber(
    attemptNumber: number,
  ): Promise<PromiseRecord | undefined> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-attemptNumber');
    return (await idx.get(attemptNumber)) as PromiseRecord | undefined;
  }
}
