import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import type { Routine } from '@data/types';
import { Repository } from './Repository';

export class RoutineRepository extends Repository<Routine> {
  constructor() {
    super(STORES.routines);
  }

  async getActive(): Promise<Routine[]> {
    const all = await this.getAll();
    return all.filter((r) => r.active);
  }

  async getByMission(missionId: string): Promise<Routine[]> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-missionId');
    return (await idx.getAll(missionId)) as Routine[];
  }

  /**
   * Atomic swap: deletes every existing routine for the given mission, then
   * inserts the provided routines. Used by the routine domain service so the
   * "replace existing routine" flow cannot leave two half-active routines behind.
   */
  async replaceAllForMission(missionId: string, next: Routine[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const idx = tx.store.index('by-missionId');
    const existing = (await idx.getAll(missionId)) as Routine[];
    const keepIds = new Set(next.map((r) => r.id));
    for (const r of existing) {
      if (!keepIds.has(r.id)) {
        await tx.store.delete(r.id);
      }
    }
    for (const r of next) {
      await tx.store.put(r);
    }
    await tx.done;
  }
}

export const routineRepository = new RoutineRepository();
