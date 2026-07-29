import type { IDBPDatabase } from 'idb';
import { getDb, closeDb } from './client';
import { ALL_STORE_NAMES, STORES } from './schema';
import type { Mission } from '@data/types/Mission';
import type { Routine } from '@data/types/Routine';
import type { DayLog } from '@data/types/DayLog';
import type { PromiseEvent } from '@data/types/PromiseEvent';
import type { SelfTrustSnapshot } from '@data/types/SelfTrustSnapshot';
import type { Note } from '@data/types/Note';
import type { Review } from '@data/types/Review';
import type { Setting } from '@data/types/Setting';
import { nowIso } from '@shared/lib/date';

/**
 * Backup format for Import / Export. Single-file JSON containing every
 * store's rows plus a version stamp and export timestamp.
 *
 * Kept in the data layer because it is infrastructure-level (spans every
 * aggregate) rather than a domain operation. UI code invokes the exported
 * functions directly from the Settings surface — same pattern as
 * src/data/db/stats.ts and src/data/db/reset.ts.
 */

/**
 * Backup document schema version. Bump when the shape of the document itself
 * changes (adding a new store, changing the top-level layout). Records inside
 * the `data` block carry their own `schemaVersion` per-entity for record-level
 * migrations.
 */
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupData {
  missions: Mission[];
  routines: Routine[];
  dayLogs: DayLog[];
  promiseEvents: PromiseEvent[];
  snapshots: SelfTrustSnapshot[];
  notes: Note[];
  reviews: Review[];
  settings: Setting[];
}

export interface BackupPayload {
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  data: BackupData;
}

// ────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────

async function readAllStores(db: IDBPDatabase): Promise<BackupData> {
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
    db.getAll(STORES.missions) as Promise<Mission[]>,
    db.getAll(STORES.routines) as Promise<Routine[]>,
    db.getAll(STORES.dayLogs) as Promise<DayLog[]>,
    db.getAll(STORES.promiseEvents) as Promise<PromiseEvent[]>,
    db.getAll(STORES.snapshots) as Promise<SelfTrustSnapshot[]>,
    db.getAll(STORES.notes) as Promise<Note[]>,
    db.getAll(STORES.reviews) as Promise<Review[]>,
    db.getAll(STORES.settings) as Promise<Setting[]>,
  ]);
  return { missions, routines, dayLogs, promiseEvents, snapshots, notes, reviews, settings };
}

/**
 * Returns the full backup payload as an in-memory object. Callers (UI) hand
 * this to `serializeBackup` and then to a download trigger.
 */
export async function buildBackup(appVersion: string): Promise<BackupPayload> {
  const db = await getDb();
  const data = await readAllStores(db);
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion,
    exportedAt: nowIso(),
    data,
  };
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

// ────────────────────────────────────────────────────────────
// Import — parse + validate
// ────────────────────────────────────────────────────────────

const EXPECTED_STORES = [
  'missions',
  'routines',
  'dayLogs',
  'promiseEvents',
  'snapshots',
  'notes',
  'reviews',
  'settings',
] as const satisfies readonly (keyof BackupData)[];

export interface BackupValidationOk {
  valid: true;
  payload: BackupPayload;
  counts: Record<keyof BackupData, number>;
}

export interface BackupValidationError {
  valid: false;
  errors: string[];
}

export type BackupValidationResult = BackupValidationOk | BackupValidationError;

function isRecordShape(row: unknown): row is Record<string, unknown> & { id: string; schemaVersion: number } {
  if (typeof row !== 'object' || row === null) return false;
  const r = row as Record<string, unknown>;
  return typeof r['id'] === 'string' && typeof r['schemaVersion'] === 'number';
}

/**
 * Parses a raw backup JSON string and validates its shape. Returns either
 * `{ valid: true, payload, counts }` or `{ valid: false, errors }`. Does not
 * touch the DB.
 *
 * V1 validation is deliberately shallow: the schema-version + top-level shape
 * + row-level id/schemaVersion presence. Deep per-field validation is
 * deferred — this file is user-authored data (their own backup) and rejecting
 * on cosmetic drift creates more friction than value.
 */
export function parseAndValidateBackup(raw: string): BackupValidationResult {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ['Not valid JSON.'] };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, errors: ['Backup must be a JSON object.'] };
  }

  const doc = parsed as Record<string, unknown>;

  if (doc['schemaVersion'] !== BACKUP_SCHEMA_VERSION) {
    errors.push(
      `Unsupported backup schemaVersion ${String(doc['schemaVersion'])}; expected ${BACKUP_SCHEMA_VERSION}.`,
    );
  }
  if (typeof doc['appVersion'] !== 'string') {
    errors.push('Missing or invalid appVersion.');
  }
  if (typeof doc['exportedAt'] !== 'string') {
    errors.push('Missing or invalid exportedAt.');
  }

  const data = doc['data'];
  if (typeof data !== 'object' || data === null) {
    errors.push('Missing or invalid data block.');
    return { valid: false, errors };
  }

  const dataRec = data as Record<string, unknown>;
  const counts = {} as Record<keyof BackupData, number>;
  for (const key of EXPECTED_STORES) {
    const rows = dataRec[key];
    if (!Array.isArray(rows)) {
      errors.push(`Store '${key}' is missing or not an array.`);
      continue;
    }
    for (let i = 0; i < rows.length; i += 1) {
      if (!isRecordShape(rows[i])) {
        errors.push(`Row ${i} in '${key}' is missing id or schemaVersion.`);
        break;
      }
    }
    counts[key] = rows.length;
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    payload: doc as unknown as BackupPayload,
    counts,
  };
}

// ────────────────────────────────────────────────────────────
// Import — apply (replace-all)
// ────────────────────────────────────────────────────────────

/**
 * Replace-all restore. Clears every store, then writes the payload's rows
 * into each store. V1 uses replace-all rather than merge because per-entity
 * conflict rules would compound complexity for negligible user benefit at
 * personal scale.
 *
 * All writes happen inside a single versionchange-scoped transaction so the
 * restore either succeeds fully or leaves the previous state intact. On
 * success, callers should call `closeDb()` and reload the page so the app
 * boots against the imported state with a clean React tree.
 */
export async function replaceAllFromBackup(
  payload: BackupPayload,
): Promise<{ counts: Record<keyof BackupData, number> }> {
  const db = await getDb();
  const tx = db.transaction(ALL_STORE_NAMES, 'readwrite');

  // Clear every store first.
  await Promise.all(ALL_STORE_NAMES.map((s) => tx.objectStore(s).clear()));

  // Put each row from the payload back.
  for (const key of EXPECTED_STORES) {
    const store = tx.objectStore(STORES[key]);
    const rows = payload.data[key];
    for (const row of rows) {
      await store.put(row);
    }
  }
  await tx.done;

  // Close the singleton so callers reloading get a fresh connection.
  await closeDb();

  return {
    counts: {
      missions: payload.data.missions.length,
      routines: payload.data.routines.length,
      dayLogs: payload.data.dayLogs.length,
      promiseEvents: payload.data.promiseEvents.length,
      snapshots: payload.data.snapshots.length,
      notes: payload.data.notes.length,
      reviews: payload.data.reviews.length,
      settings: payload.data.settings.length,
    },
  };
}
