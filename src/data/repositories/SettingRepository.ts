import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import type { Setting } from '@data/types';
import { Repository } from './Repository';

export class SettingRepository extends Repository<Setting> {
  constructor() {
    super(STORES.settings);
  }

  async getByKey(key: string): Promise<Setting | undefined> {
    const db = await getDb();
    const idx = db.transaction(this.storeName).store.index('by-key');
    return (await idx.get(key)) as Setting | undefined;
  }
}

export const settingRepository = new SettingRepository();
