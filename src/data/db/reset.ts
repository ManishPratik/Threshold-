import { deleteDb } from './client';

/**
 * Wipes the app's IndexedDB. Callers must reload the page after this returns —
 * the DB singleton has been closed and the next call to getDb() will re-open
 * a fresh store, which in turn re-runs the bootstrap seed (ADR 0006).
 *
 * Deliberately thin. Kept in the data layer (not a service) because it is an
 * infrastructure concern spanning every aggregate, not a domain operation.
 */
export async function resetAllData(): Promise<void> {
  await deleteDb();
}
