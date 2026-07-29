import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import type { PromiseEvent } from '@data/types';
import { Repository } from './Repository';

/**
 * Append-only. `put` is inherited but callers must never re-put an existing event id.
 * Adds `append` as the canonical write and disallows mutation via type-level intent.
 */
export class PromiseEventRepository extends Repository<PromiseEvent> {
  constructor() {
    super(STORES.promiseEvents);
  }

  async append(event: PromiseEvent): Promise<void> {
    const existing = await this.getById(event.id);
    if (existing) {
      throw new Error(`PromiseEvent ${event.id} already exists — this store is append-only.`);
    }
    await this.put(event);
  }

  async getByDayLog(dayLogId: string): Promise<PromiseEvent[]> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-dayLogId');
    return (await idx.getAll(dayLogId)) as PromiseEvent[];
  }
}

export const promiseEventRepository = new PromiseEventRepository();
