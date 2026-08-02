// IndexedDB schema — versioned. All schema evolution must add a new migration
// in migrations.ts and bump DB_VERSION. Never modify a shipped migration.

export const DB_NAME = 'personal-os';
export const DB_VERSION = 2;

// Legacy v1 store names. Retained solely so `migration1` — the shipped v1
// baseline in `migrations.ts` — continues to compile against the same string
// literals it originally created. No live consumer reads or writes these
// stores; the frozen application uses `FROZEN_STORES` below.
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

// Frozen v2 stores. `frozenRoutines` / `frozenNotes` use temporary names to
// avoid a name collision with the v1 stores of the same string. A future
// v3 migration is expected to consolidate them under `routines` / `notes`.
export const FROZEN_STORES = {
  appState: 'appState',
  promises: 'promises',
  declarations: 'declarations',
  blockCompletions: 'blockCompletions',
  frozenRoutines: 'frozenRoutines',
  frozenNotes: 'frozenNotes',
} as const;

export type FrozenStoreName = (typeof FROZEN_STORES)[keyof typeof FROZEN_STORES];
