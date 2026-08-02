import { getDb } from '@data/db/client';
import { FROZEN_STORES } from '@data/db/schema';
import type { Routine } from '@data/types/frozen/Routine';

/**
 * Frozen-architecture repository for the frozen Routine store. Bound to
 * the temporary store name `frozenRoutines` during the parallel phase; the
 * v3 cleanup migration copies data into a store under the final name
 * `routines` and this file will be updated in that slice to point at the
 * final name.
 *
 * One routine per Promise — the `by-promiseId` index defined in migration2
 * is declared unique so IDB rejects a second insert for the same
 * `promiseId`. No execution logic, no block-completion logic, no Promise
 * logic — the caller composes those.
 *
 * Bound only to the frozen store. No import from any legacy repository,
 * type, or service. Exported only as a class (no eager singleton) so the
 * unwired state is visible at a grep level.
 */
export class RoutineRepository {
  private readonly storeName = FROZEN_STORES.frozenRoutines;
  private readonly promiseIdIndex = 'by-promiseId';

  /**
   * Insert a new Routine. Rejects if a Routine with the same `id` already
   * exists, or if a Routine for the same `promiseId` already exists (the
   * `by-promiseId` index is unique per migration2).
   */
  async create(routine: Routine): Promise<void> {
    const db = await getDb();
    await db.add(this.storeName, routine);
  }

  /**
   * Idempotent upsert by primary key `id`. Overwrites the row with that
   * `id` if present. The unique `by-promiseId` index still rejects any
   * attempt to change `promiseId` to one already owned by another Routine.
   */
  async put(routine: Routine): Promise<void> {
    const db = await getDb();
    await db.put(this.storeName, routine);
  }

  /** Read a Routine by primary key. Undefined when absent. */
  async getById(id: string): Promise<Routine | undefined> {
    const db = await getDb();
    return (await db.get(this.storeName, id)) as Routine | undefined;
  }

  /**
   * Read the Routine owned by a specific Promise. Uses the unique
   * `by-promiseId` index defined in migration2. Undefined when no Routine
   * exists for the Promise.
   */
  async getByPromiseId(promiseId: string): Promise<Routine | undefined> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index(this.promiseIdIndex);
    return (await idx.get(promiseId)) as Routine | undefined;
  }

  /** True when a Routine with the given `id` exists. */
  async exists(id: string): Promise<boolean> {
    const db = await getDb();
    const key = await db.getKey(this.storeName, id);
    return key !== undefined;
  }

  /** Return every Routine, unordered. */
  async list(): Promise<Routine[]> {
    const db = await getDb();
    return (await db.getAll(this.storeName)) as Routine[];
  }

  /** Delete a Routine by primary key, if present. */
  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(this.storeName, id);
  }

  /**
   * Delete the Routine owned by a specific Promise, if one exists. Resolves
   * the id via the unique `by-promiseId` index and performs the delete
   * inside the same transaction. No-op when no Routine exists for the
   * Promise.
   */
  async deleteByPromiseId(promiseId: string): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const idx = tx.store.index(this.promiseIdIndex);
    const key = await idx.getKey(promiseId);
    if (key !== undefined) {
      await tx.store.delete(key);
    }
    await tx.done;
  }
}
