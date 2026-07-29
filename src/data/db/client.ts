import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION } from './schema';
import { MIGRATIONS } from './migrations';
import { seedIfEmpty } from './seed';

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Lazy singleton IndexedDB handle. First call opens the DB, runs any pending
 * migrations from oldVersion+1 upward, then runs the bootstrap seed (ADR 0006).
 * The seed is idempotent and only writes if no active Mission is present.
 */
export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, _newVersion, tx) {
          for (let v = oldVersion + 1; v <= DB_VERSION; v += 1) {
            const migration = MIGRATIONS[v];
            if (!migration) {
              throw new Error(`Missing IndexedDB migration for version ${v}`);
            }
            migration(db, tx);
          }
        },
        blocked() {
          console.warn('[db] Upgrade blocked — another tab has personal-os open.');
        },
        blocking() {
          console.warn('[db] Blocking a newer version — closing.');
          void closeDb();
        },
        terminated() {
          console.error('[db] Connection terminated unexpectedly.');
          dbPromise = null;
        },
      });
      await seedIfEmpty(db);
      return db;
    })();
  }
  return dbPromise;
}

/** For tests and hot-reload — closes the singleton and forces a fresh open next time. */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  db.close();
  dbPromise = null;
}

/** Danger — for tests and future import-restore. Deletes the entire DB. */
export async function deleteDb(): Promise<void> {
  await closeDb();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('deleteDatabase blocked by another connection'));
  });
}
