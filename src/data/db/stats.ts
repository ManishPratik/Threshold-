import { getDb } from './client';
import { STORES } from './schema';

/**
 * Cross-store record counts. Powers the Settings → About surface. Kept in the
 * data layer (not a domain service) because it is an infrastructure metadata
 * concern spanning every aggregate, not a domain operation.
 */
export interface StorageStats {
  missions: number;
  routines: number;
  dayLogs: number;
  promiseEvents: number;
  snapshots: number;
  notes: number;
  reviews: number;
  settings: number;
  total: number;
}

export async function getStorageStats(): Promise<StorageStats> {
  const db = await getDb();
  const [
    missions,
    routines,
    dayLogs,
    promiseEvents,
    snapshots,
    notes,
    reviews,
    settings,
  ] = await Promise.all([
    db.count(STORES.missions),
    db.count(STORES.routines),
    db.count(STORES.dayLogs),
    db.count(STORES.promiseEvents),
    db.count(STORES.snapshots),
    db.count(STORES.notes),
    db.count(STORES.reviews),
    db.count(STORES.settings),
  ]);
  return {
    missions,
    routines,
    dayLogs,
    promiseEvents,
    snapshots,
    notes,
    reviews,
    settings,
    total:
      missions +
      routines +
      dayLogs +
      promiseEvents +
      snapshots +
      notes +
      reviews +
      settings,
  };
}
