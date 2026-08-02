import type { IDBPDatabase, IDBPTransaction } from 'idb';
import { FROZEN_STORES, STORES } from './schema';

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

/**
 * v2 — frozen-architecture stores. Creates every frozen store. The two whose
 * final names (`routines`, `notes`) collide with v1 stores of the same name
 * are created here under temporary names (`frozenRoutines`, `frozenNotes`)
 * so both architectures coexist during the parallel phase. The eventual v3
 * cleanup migration deletes the v1 stores and copies data from these
 * temporary stores into stores under the final names. No v1 store is
 * touched here; every legacy record survives the upgrade.
 */
const migration2: Migration = (db) => {
  // Singleton pointer record. Only one row per install, id === 'app'.
  db.createObjectStore(FROZEN_STORES.appState, { keyPath: 'id' });

  const promises = db.createObjectStore(FROZEN_STORES.promises, { keyPath: 'id' });
  promises.createIndex('by-attemptNumber', 'attemptNumber', { unique: true });
  promises.createIndex('by-startDate', 'startDate');
  promises.createIndex('by-activatedAt', 'activatedAt');
  promises.createIndex('by-brokenAt', 'brokenAt');

  // Composite key [promiseId, date]. One verdict per (promise, day).
  const declarations = db.createObjectStore(FROZEN_STORES.declarations, {
    keyPath: ['promiseId', 'date'],
  });
  declarations.createIndex('by-promiseId', 'promiseId');
  declarations.createIndex('by-date', 'date');

  // Composite key [promiseId, date, blockId]. Idempotent per block per day.
  const blockCompletions = db.createObjectStore(FROZEN_STORES.blockCompletions, {
    keyPath: ['promiseId', 'date', 'blockId'],
  });
  blockCompletions.createIndex('by-promiseId-date', ['promiseId', 'date']);

  // Frozen Routine store under a temporary name — one routine per Promise,
  // uniqueness enforced at the index level. Renamed to `routines` by the
  // v3 cleanup migration once the v1 `routines` store is deleted.
  const frozenRoutines = db.createObjectStore(FROZEN_STORES.frozenRoutines, {
    keyPath: 'id',
  });
  frozenRoutines.createIndex('by-promiseId', 'promiseId', { unique: true });

  // Frozen Note store under a temporary name — notes belong to a Promise.
  // Renamed to `notes` by the v3 cleanup migration once the v1 `notes`
  // store is deleted.
  const frozenNotes = db.createObjectStore(FROZEN_STORES.frozenNotes, {
    keyPath: 'id',
  });
  frozenNotes.createIndex('by-promiseId', 'promiseId');
  frozenNotes.createIndex('by-createdAt', 'createdAt');
};

export const MIGRATIONS: Record<number, Migration> = {
  1: migration1,
  2: migration2,
};
