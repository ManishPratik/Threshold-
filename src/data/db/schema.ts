// IndexedDB schema — versioned. All schema evolution must add a new migration
// in migrations.ts and bump DB_VERSION. Never modify a shipped migration.

export const DB_NAME = 'personal-os';
export const DB_VERSION = 1;

export const STORES = {
  missions: 'missions',
  routines: 'routines',
  dayLogs: 'dayLogs',
  promiseEvents: 'promiseEvents',
  snapshots: 'snapshots',
  notes: 'notes',
  reviews: 'reviews',
  settings: 'settings',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

export const ALL_STORE_NAMES: StoreName[] = Object.values(STORES);
