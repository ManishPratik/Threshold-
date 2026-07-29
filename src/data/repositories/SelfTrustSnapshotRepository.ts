import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import type { SelfTrustSnapshot } from '@data/types';
import type { ISODate } from '@shared/lib/date';
import { Repository } from './Repository';

export class SelfTrustSnapshotRepository extends Repository<SelfTrustSnapshot> {
  constructor() {
    super(STORES.snapshots);
  }

  async getByDate(date: ISODate): Promise<SelfTrustSnapshot | undefined> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-date');
    return (await idx.get(date)) as SelfTrustSnapshot | undefined;
  }

  async getRange(startDate: ISODate, endDate: ISODate): Promise<SelfTrustSnapshot[]> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-date');
    return (await idx.getAll(IDBKeyRange.bound(startDate, endDate))) as SelfTrustSnapshot[];
  }

  /**
   * Returns the most recent snapshot by date (latest logical day with a
   * projection), or undefined if none exist. Used as the "current score"
   * read path on the Today screen.
   */
  async getLatest(): Promise<SelfTrustSnapshot | undefined> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-date');
    const cursor = await idx.openCursor(null, 'prev');
    return cursor ? (cursor.value as SelfTrustSnapshot) : undefined;
  }
}

export const selfTrustSnapshotRepository = new SelfTrustSnapshotRepository();
