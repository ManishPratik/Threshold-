import { getDb } from '@data/db/client';
import { FROZEN_STORES } from '@data/db/schema';
import type { Note } from '@data/types/frozen/Note';

/**
 * Frozen-architecture repository for the frozen Note store. Bound to the
 * temporary store name `frozenNotes` during the parallel phase; the v3
 * cleanup migration copies data into a store under the final name `notes`
 * and this file will be updated in that slice to point at the final name.
 *
 * Notes belong to a Promise (many notes per Promise). The `by-promiseId`
 * index defined in migration2 is non-unique; the `by-createdAt` index
 * supports chronological reads (composition performed by the caller).
 *
 * No note validation, no character-limit enforcement, no Promise logic,
 * no UI logic, no business rules — the caller composes those.
 *
 * Bound only to the frozen store. No import from any legacy repository,
 * type, or service. Exported only as a class (no eager singleton) so the
 * unwired state is visible at a grep level.
 */
export class NoteRepository {
  private readonly storeName = FROZEN_STORES.frozenNotes;
  private readonly promiseIdIndex = 'by-promiseId';

  /** Insert a new Note. Rejects if a Note with the same `id` already exists. */
  async create(note: Note): Promise<void> {
    const db = await getDb();
    await db.add(this.storeName, note);
  }

  /** Idempotent upsert by primary key `id`. */
  async put(note: Note): Promise<void> {
    const db = await getDb();
    await db.put(this.storeName, note);
  }

  /** Read a Note by primary key. Undefined when absent. */
  async getById(id: string): Promise<Note | undefined> {
    const db = await getDb();
    return (await db.get(this.storeName, id)) as Note | undefined;
  }

  /**
   * Read one Note for a Promise via the non-unique `by-promiseId` index.
   * Returns the first record the index iterator yields — order is not
   * guaranteed. When multiple notes exist, `listForPromise` is the correct
   * call; this method is provided for the "does a note exist for this
   * Promise" one-shot check.
   */
  async getByPromiseId(promiseId: string): Promise<Note | undefined> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index(this.promiseIdIndex);
    return (await idx.get(promiseId)) as Note | undefined;
  }

  /**
   * Read every Note attached to a Promise via the `by-promiseId` index.
   * Order is the index's natural iteration order — sorting for UI (e.g.,
   * reverse-chronological on Promise Detail) is a caller concern.
   */
  async listForPromise(promiseId: string): Promise<Note[]> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index(this.promiseIdIndex);
    return (await idx.getAll(promiseId)) as Note[];
  }

  /** True when a Note with the given `id` exists. */
  async exists(id: string): Promise<boolean> {
    const db = await getDb();
    const key = await db.getKey(this.storeName, id);
    return key !== undefined;
  }

  /** Delete a Note by primary key, if present. */
  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(this.storeName, id);
  }

  /**
   * Delete every Note owned by a Promise. Opens a cursor over the
   * `by-promiseId` index inside a single readwrite transaction and deletes
   * each row. No-op when the Promise has no notes.
   */
  async deleteByPromiseId(promiseId: string): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const idx = tx.store.index(this.promiseIdIndex);
    let cursor = await idx.openCursor(IDBKeyRange.only(promiseId));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }
}
