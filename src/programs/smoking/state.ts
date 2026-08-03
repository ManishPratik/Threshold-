import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';
import { countSurfed, type CravingEntry } from './craving';

/**
 * Program-scoped state layer for the Smoking Cessation Life Program.
 *
 * Persistence reuses the legacy `settings` v1 IDB store declared at
 * personal-os/src/data/db/schema.ts line 19 and created by
 * personal-os/src/data/db/migrations.ts lines 40-42 (keyPath `id`,
 * unique `by-key` index). That store was annotated at
 * personal-os/src/data/db/schema.ts line 12 as having "No live
 * consumer"; the Smoking program is now that consumer. No new IDB
 * store, no v3 migration, no touch to the frozen v2 store list at
 * personal-os/src/data/db/schema.ts lines 25-32.
 *
 * Data shape: a single record per program-scoped key. The craving log
 * lives at `id === 'smoking-craving-log'` with a fixed shape below.
 * All Threshold-era CravingEntry fields (ts, resisted, type, trigger,
 * note) survive verbatim per personal-os/src/programs/smoking/craving.ts.
 */

const CRAVING_LOG_ID = 'smoking-craving-log';
const CRAVING_LOG_KEY = 'smoking.cravingLog';

interface CravingLogRecord {
  id: string;
  key: string;
  entries: CravingEntry[];
  updatedAt: string;
  schemaVersion: number;
}

const CURRENT_SCHEMA_VERSION = 1;

/** Read every craving entry, oldest-first. Returns `[]` when the log
 *  has never been written. */
export async function readCravingLog(): Promise<CravingEntry[]> {
  const db = await getDb();
  const record = (await db.get(STORES.settings, CRAVING_LOG_ID)) as
    | CravingLogRecord
    | undefined;
  if (!record) return [];
  return [...record.entries];
}

/** Append one entry and persist. Returns the full updated log so the
 *  UI can compute the surfed count without a second read. */
export async function appendCravingEntry(
  entry: CravingEntry,
): Promise<CravingEntry[]> {
  const db = await getDb();
  const existing = (await db.get(STORES.settings, CRAVING_LOG_ID)) as
    | CravingLogRecord
    | undefined;
  const entries: CravingEntry[] = existing
    ? [...existing.entries, entry]
    : [entry];
  const next: CravingLogRecord = {
    id: CRAVING_LOG_ID,
    key: CRAVING_LOG_KEY,
    entries,
    updatedAt: new Date().toISOString(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
  await db.put(STORES.settings, next);
  return entries;
}

/** Convenience helper: read the log and return the surfed count. Used
 *  by the FAB widget to load the compact counter without keeping the
 *  full log in memory. */
export async function fetchSurfedCount(): Promise<number> {
  const log = await readCravingLog();
  return countSurfed(log);
}

// Quit-time persistence — a single Unix-millis timestamp representing
// when the user last had a cigarette. Every clean-hours-derived widget
// (Chamber, PeakBanner, HurdlesChain) reads from here. Stored in the
// same reused legacy `settings` v1 store as the craving log — one
// record per key, no schema migration.

const QUIT_TIME_ID = 'smoking-quit-time';
const QUIT_TIME_KEY = 'smoking.quitTime';

interface QuitTimeRecord {
  id: string;
  key: string;
  quitAt: number;
  updatedAt: string;
  schemaVersion: number;
}

/** Read the stored quit time in Unix millis. `null` when the user
 *  has not yet stamped a quit moment. */
export async function readQuitAt(): Promise<number | null> {
  const db = await getDb();
  const record = (await db.get(STORES.settings, QUIT_TIME_ID)) as
    | QuitTimeRecord
    | undefined;
  return record ? record.quitAt : null;
}

/** Persist the given quit time in Unix millis. Overwrites any prior
 *  value so re-stamping is always the latest moment. */
export async function setQuitAt(quitAt: number): Promise<void> {
  const db = await getDb();
  const record: QuitTimeRecord = {
    id: QUIT_TIME_ID,
    key: QUIT_TIME_KEY,
    quitAt,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
  await db.put(STORES.settings, record);
}

/** Clear the stored quit time. Used by full-relapse and program
 *  disable flows. */
export async function clearQuitAt(): Promise<void> {
  const db = await getDb();
  await db.delete(STORES.settings, QUIT_TIME_ID);
}

/** Clean-hours derivation matching the Threshold source at
 *  ac4b193~1:index.html line 3380 formula
 *  `(Date.now() - getQuitTs()) / 3600000`. Pure — the caller supplies
 *  both timestamps so tests are deterministic. */
export function cleanHoursSince(
  quitAt: number,
  now: number = Date.now(),
): number {
  return Math.max(0, (now - quitAt) / 3600000);
}

// Pack cost persistence — the user's daily-pack rupee cost drives the
// money-saved statistic. Default 250 rupees matches the Threshold
// source at ac4b193~1:index.html line 5323 fallback.

const PACK_COST_ID = 'smoking-pack-cost';
const PACK_COST_KEY = 'smoking.packCost';
export const DEFAULT_PACK_COST_RUPEES = 250;

interface PackCostRecord {
  id: string;
  key: string;
  packCost: number;
  updatedAt: string;
  schemaVersion: number;
}

/** Read the stored pack cost in rupees. Returns the default when the
 *  user has not chosen a value. */
export async function readPackCost(): Promise<number> {
  const db = await getDb();
  const record = (await db.get(STORES.settings, PACK_COST_ID)) as
    | PackCostRecord
    | undefined;
  return record ? record.packCost : DEFAULT_PACK_COST_RUPEES;
}

/** Persist the pack cost in rupees. */
export async function setPackCost(packCost: number): Promise<void> {
  const db = await getDb();
  const record: PackCostRecord = {
    id: PACK_COST_ID,
    key: PACK_COST_KEY,
    packCost,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
  await db.put(STORES.settings, record);
}

// Editable slot persistence — one record per slot key. Keys match the
// Threshold source at ac4b193~1:index.html line 4926 `_EDIT_TEXT_CFG`
// map. The frozen data-layer's `settings` v1 store hosts them all.

interface EditableSlotRecord {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
  schemaVersion: number;
}

function editableSlotId(slotKey: string): string {
  return `smoking-editable-${slotKey}`;
}

export async function readEditableSlot(slotKey: string): Promise<string | null> {
  const db = await getDb();
  const record = (await db.get(STORES.settings, editableSlotId(slotKey))) as
    | EditableSlotRecord
    | undefined;
  return record ? record.value : null;
}

export async function setEditableSlot(
  slotKey: string,
  value: string,
): Promise<void> {
  const db = await getDb();
  const record: EditableSlotRecord = {
    id: editableSlotId(slotKey),
    key: `smoking.${slotKey}`,
    value,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
  await db.put(STORES.settings, record);
}

// Peak-crossed one-shot celebration state. Threshold source at
// ac4b193~1:index.html line 3208 stamps LS.PEAK_CROSSED = '1' once
// the celebration has been acknowledged so it never fires twice.

const PEAK_ACKED_ID = 'smoking-peak-crossed-acked';

export async function isPeakCrossedAcked(): Promise<boolean> {
  const db = await getDb();
  const record = await db.get(STORES.settings, PEAK_ACKED_ID);
  return record !== undefined;
}

export async function ackPeakCrossed(): Promise<void> {
  const db = await getDb();
  await db.put(STORES.settings, {
    id: PEAK_ACKED_ID,
    key: 'smoking.peakCrossedAcked',
    ackedAt: Date.now(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  });
}

// Hurdle-ack persistence — a set of hurdle ids already acknowledged.
// Matches ac4b193~1:index.html line 3298 `getAckedHurdles` /
// line 3302 `setAckedHurdles`.

const HURDLES_ACKED_ID = 'smoking-hurdles-acked';

interface HurdlesAckedRecord {
  id: string;
  key: string;
  ids: string[];
  updatedAt: string;
  schemaVersion: number;
}

export async function readAckedHurdles(): Promise<readonly string[]> {
  const db = await getDb();
  const record = (await db.get(STORES.settings, HURDLES_ACKED_ID)) as
    | HurdlesAckedRecord
    | undefined;
  return record ? record.ids : [];
}

export async function ackHurdle(hurdleId: string): Promise<readonly string[]> {
  const db = await getDb();
  const existing = (await db.get(STORES.settings, HURDLES_ACKED_ID)) as
    | HurdlesAckedRecord
    | undefined;
  const next = existing?.ids.includes(hurdleId)
    ? existing.ids
    : [...(existing?.ids ?? []), hurdleId];
  const record: HurdlesAckedRecord = {
    id: HURDLES_ACKED_ID,
    key: 'smoking.hurdlesAcked',
    ids: next,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
  await db.put(STORES.settings, record);
  return next;
}

// Full-relapse reset — clears every smoking-scoped record except the
// pack cost and editable-slot content. Matches the behaviour of
// ac4b193~1:index.html `confirmSmoked` reset set which preserves
// user-edited text and settings.

export async function fullRelapseReset(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORES.settings, 'readwrite');
  await tx.store.delete(QUIT_TIME_ID);
  await tx.store.delete(CRAVING_LOG_ID);
  await tx.store.delete(PEAK_ACKED_ID);
  await tx.store.delete(HURDLES_ACKED_ID);
  await tx.done;
}
