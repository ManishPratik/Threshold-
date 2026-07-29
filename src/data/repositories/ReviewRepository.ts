import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import type { Review, ReviewKind } from '@data/types';
import type { ISODate } from '@shared/lib/date';
import { Repository } from './Repository';

export class ReviewRepository extends Repository<Review> {
  constructor() {
    super(STORES.reviews);
  }

  async getByKindAndPeriod(kind: ReviewKind, periodStart: ISODate): Promise<Review | undefined> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-kind-periodStart');
    return (await idx.get([kind, periodStart])) as Review | undefined;
  }

  async listByKind(kind: ReviewKind): Promise<Review[]> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-kind-periodStart');
    return (await idx.getAll(IDBKeyRange.bound([kind, ''], [kind, '￿']))) as Review[];
  }
}

export const reviewRepository = new ReviewRepository();
