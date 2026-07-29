import type { IDBPDatabase, IDBPTransaction } from 'idb';
import { STORES } from './schema';

/**
 * Migrations are pure functions of (db, oldVersion, tx). They run in order,
 * from oldVersion+1 up to the target version, inside a single versionchange transaction.
 * Never edit a shipped migration — add a new one instead.
 */
export type Migration = (
  db: IDBPDatabase,
  tx: IDBPTransaction<unknown, string[], 'versionchange'>,
) => void;

const migration1: Migration = (db) => {
  // v1 baseline schema — one keyPath='id' store per aggregate.
  const missions = db.createObjectStore(STORES.missions, { keyPath: 'id' });
  missions.createIndex('by-status', 'status');
  missions.createIndex('by-activatedAt', 'activatedAt');

  const routines = db.createObjectStore(STORES.routines, { keyPath: 'id' });
  routines.createIndex('by-active', 'active');
  routines.createIndex('by-missionId', 'missionId');

  const dayLogs = db.createObjectStore(STORES.dayLogs, { keyPath: 'id' });
  dayLogs.createIndex('by-date', 'date', { unique: true });

  const promiseEvents = db.createObjectStore(STORES.promiseEvents, { keyPath: 'id' });
  promiseEvents.createIndex('by-dayLogId', 'dayLogId');
  promiseEvents.createIndex('by-at', 'at');

  const snapshots = db.createObjectStore(STORES.snapshots, { keyPath: 'id' });
  snapshots.createIndex('by-date', 'date', { unique: true });

  const notes = db.createObjectStore(STORES.notes, { keyPath: 'id' });
  notes.createIndex('by-updatedAt', 'updatedAt');
  notes.createIndex('by-deletedAt', 'deletedAt');

  const reviews = db.createObjectStore(STORES.reviews, { keyPath: 'id' });
  reviews.createIndex('by-kind-periodStart', ['kind', 'periodStart']);

  const settings = db.createObjectStore(STORES.settings, { keyPath: 'id' });
  settings.createIndex('by-key', 'key', { unique: true });
};

export const MIGRATIONS: Record<number, Migration> = {
  1: migration1,
};
