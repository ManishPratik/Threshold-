import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import type { Mission } from '@data/types';
import { Repository } from './Repository';

export class MissionRepository extends Repository<Mission> {
  constructor() {
    super(STORES.missions);
  }

  async getActive(): Promise<Mission | undefined> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-status');
    return (await idx.get('active')) as Mission | undefined;
  }
}

export const missionRepository = new MissionRepository();
