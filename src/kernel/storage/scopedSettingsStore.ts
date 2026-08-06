// Scoped-storage factory. Wraps the reused `settings` v1 IndexedDB
// store (src/data/db/schema.ts:19; created by
// src/data/db/migrations.ts:41-42 with keyPath `id` and unique
// `by-key` index) with a per-module keyspace so any module can
// persist small values without touching the kernel data layer
// directly.
//
// Kernel-internal file: importing from `@data/*` here is intentional
// because this file IS part of the kernel public surface's
// implementation. Modules consume through the `@kernel/storage`
// barrel (index.ts) — never through this path.

import { getDb } from '@data/db/client';
import { STORES } from '@data/db/schema';

/**
 * Public surface returned by `scopedSettingsStore`. Get / put /
 * delete one value per user-supplied key inside a module-scoped
 * keyspace. `listKeys` returns the user-facing keys (without the
 * module-id prefix) so callers work in terms of their own keyspace.
 */
export interface ScopedSettingsStore {
  get<T = unknown>(userKey: string): Promise<T | undefined>;
  put<T = unknown>(userKey: string, value: T): Promise<void>;
  delete(userKey: string): Promise<void>;
  listKeys(): Promise<readonly string[]>;
}

/**
 * Delimiter between the module id and the user key. `::` chosen to
 * avoid collision with the single-dot notation used by existing
 * `settings` rows at src/programs/smoking/state.ts:24, 85, 142 and
 * src/features/daily-flow-engine/ackLog.ts:41-51. Keeps the `by-key`
 * unique index at src/data/db/migrations.ts:42 safe under parallel
 * module writes.
 */
const KEY_DELIMITER = '::';
const RECORD_SCHEMA_VERSION = 1;

interface ScopedRecord {
  id: string;
  key: string;
  moduleId: string;
  userKey: string;
  value: unknown;
  updatedAt: string;
  schemaVersion: number;
}

function makeRecordId(moduleId: string, userKey: string): string {
  return `${moduleId}${KEY_DELIMITER}${userKey}`;
}

function isScopedIdForModule(moduleId: string, id: string): boolean {
  return id.startsWith(`${moduleId}${KEY_DELIMITER}`);
}

function extractUserKey(moduleId: string, id: string): string {
  return id.slice(`${moduleId}${KEY_DELIMITER}`.length);
}

/**
 * E3 storage host factory. Returns a small `ScopedSettingsStore`
 * bound to the given module id. Every record written through the
 * returned surface lives in the reused `settings` v1 IndexedDB store
 * (src/data/db/schema.ts:19, src/data/db/migrations.ts:41-42) under
 * a `<moduleId>::<userKey>` id.
 *
 * No schema migration — the `settings` store's shape (keyPath `id`,
 * unique `by-key` index) already accommodates this pattern; the
 * `by-key` uniqueness constraint is satisfied because `id === key`
 * for every scoped record and `moduleId` is per-module unique.
 */
export function scopedSettingsStore(moduleId: string): ScopedSettingsStore {
  if (moduleId.length === 0 || moduleId.includes(KEY_DELIMITER)) {
    throw new RangeError(
      `scopedSettingsStore: moduleId must be non-empty and must not contain "${KEY_DELIMITER}"`,
    );
  }
  return {
    async get<T = unknown>(userKey: string): Promise<T | undefined> {
      const db = await getDb();
      const id = makeRecordId(moduleId, userKey);
      const record = (await db.get(STORES.settings, id)) as
        | ScopedRecord
        | undefined;
      return record ? (record.value as T) : undefined;
    },
    async put<T = unknown>(userKey: string, value: T): Promise<void> {
      const db = await getDb();
      const id = makeRecordId(moduleId, userKey);
      const record: ScopedRecord = {
        id,
        key: id,
        moduleId,
        userKey,
        value,
        updatedAt: new Date().toISOString(),
        schemaVersion: RECORD_SCHEMA_VERSION,
      };
      await db.put(STORES.settings, record);
    },
    async delete(userKey: string): Promise<void> {
      const db = await getDb();
      const id = makeRecordId(moduleId, userKey);
      await db.delete(STORES.settings, id);
    },
    async listKeys(): Promise<readonly string[]> {
      const db = await getDb();
      const allIds = (await db.getAllKeys(STORES.settings)) as string[];
      const out: string[] = [];
      for (const id of allIds) {
        if (typeof id !== 'string') continue;
        if (!isScopedIdForModule(moduleId, id)) continue;
        out.push(extractUserKey(moduleId, id));
      }
      return out;
    },
  };
}
