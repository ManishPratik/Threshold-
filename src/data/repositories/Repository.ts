import { getDb } from '@data/db/client';
import type { StoreName } from '@data/db/schema';
import type { BaseEntity } from '@data/types/common';

/**
 * Base IndexedDB repository. Provides CRUD + bulk operations required by
 * the future Import / Export JSON flow.
 *
 * Domain-specific queries (getActiveMission, getByDate, etc.) live on the
 * concrete subclasses so the query surface stays typed and discoverable.
 */
export class Repository<T extends BaseEntity> {
  constructor(protected readonly storeName: StoreName) {}

  async getById(id: string): Promise<T | undefined> {
    const db = await getDb();
    return (await db.get(this.storeName, id)) as T | undefined;
  }

  async getAll(): Promise<T[]> {
    const db = await getDb();
    return (await db.getAll(this.storeName)) as T[];
  }

  async put(entity: T): Promise<void> {
    const db = await getDb();
    await db.put(this.storeName, entity);
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(this.storeName, id);
  }

  async count(): Promise<number> {
    const db = await getDb();
    return db.count(this.storeName);
  }

  async clear(): Promise<void> {
    const db = await getDb();
    await db.clear(this.storeName);
  }

  /** Bulk insert. Used by the future Import flow. */
  async putMany(entities: T[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    await Promise.all(entities.map((e) => tx.store.put(e)));
    await tx.done;
  }

  /** Export alias — returns all rows for the future Export flow. */
  async exportAll(): Promise<T[]> {
    return this.getAll();
  }

  /**
   * Deletes every record whose id starts with `prefix`. Returns the count deleted.
   * Used by the bootstrap purge on Mission activation (see ADR 0006 / 0007).
   */
  async deleteByIdPrefix(prefix: string): Promise<number> {
    const db = await getDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const keys = await tx.store.getAllKeys();
    let removed = 0;
    for (const key of keys) {
      if (typeof key === 'string' && key.startsWith(prefix)) {
        await tx.store.delete(key);
        removed += 1;
      }
    }
    await tx.done;
    return removed;
  }
}
