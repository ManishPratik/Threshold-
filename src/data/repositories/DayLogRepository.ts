import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import type { DayLog } from '@data/types';
import { nowIso, type ISODate } from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import { generateId } from '@shared/lib/id';
import { Repository } from './Repository';

const SCHEMA_VERSION = 1;

export class DayLogRepository extends Repository<DayLog> {
  constructor() {
    super(STORES.dayLogs);
  }

  async getByDate(date: ISODate): Promise<DayLog | undefined> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-date');
    return (await idx.get(date)) as DayLog | undefined;
  }

  async getRange(startDate: ISODate, endDate: ISODate): Promise<DayLog[]> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-date');
    return (await idx.getAll(IDBKeyRange.bound(startDate, endDate))) as DayLog[];
  }

  /**
   * Returns today's DayLog, creating an empty one at the current logical date
   * if none exists. Deliberately not idempotent-by-time — callers relying on
   * "today" always get the row corresponding to the current day-boundary rule.
   */
  async getOrCreateForToday(): Promise<DayLog> {
    const date = currentLogicalDate();
    const existing = await this.getByDate(date);
    if (existing) return existing;

    const now = nowIso();
    const fresh: DayLog = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      schemaVersion: SCHEMA_VERSION,
      date,
      dayStartAt: now,
      state: 'normal',
      completedBlockIds: [],
      skippedBlockIds: [],
      notes: '',
    };
    await this.put(fresh);
    return fresh;
  }

  /**
   * Records a completed block on today's DayLog. Idempotent — no duplicates.
   * Returns the updated DayLog so the caller can update local state.
   */
  async markBlockCompleted(dayLogId: string, blockId: string): Promise<DayLog> {
    const current = await this.getById(dayLogId);
    if (!current) throw new Error(`DayLog ${dayLogId} not found`);
    if (current.completedBlockIds.includes(blockId)) return current;

    const updated: DayLog = {
      ...current,
      updatedAt: nowIso(),
      completedBlockIds: [...current.completedBlockIds, blockId],
    };
    await this.put(updated);
    return updated;
  }
}

export const dayLogRepository = new DayLogRepository();
