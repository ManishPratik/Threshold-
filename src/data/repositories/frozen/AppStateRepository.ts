import { getDb } from '@data/db/client';
import { FROZEN_STORES } from '@data/db/schema';
import type { AppState } from '@data/types/frozen/AppState';
import { APP_STATE_ID } from '@data/types/frozen/AppState';

/**
 * Frozen-architecture repository for the singleton `appState` object store.
 * One record per install, keyed on the literal id `'app'` (see
 * `APP_STATE_ID`). The record is the only pointer to the active Promise.
 *
 * No boot logic, no hydration, no routing, no Promise logic — the caller
 * composes those. Bound only to the frozen store. No import from any
 * legacy repository, type, or service. Exported only as a class (no eager
 * singleton) so the unwired state is visible at a grep level.
 */
export class AppStateRepository {
  private readonly storeName = FROZEN_STORES.appState;

  /** Read the singleton record. Undefined when not yet initialised. */
  async get(): Promise<AppState | undefined> {
    const db = await getDb();
    return (await db.get(this.storeName, APP_STATE_ID)) as AppState | undefined;
  }

  /**
   * Ensure the singleton exists. Writes a default record
   * `{ id: 'app', currentPromiseId: null, schemaVersion: 1 }` when no
   * record is present. No-op when the record already exists. Returns the
   * record that ends up in the store.
   */
  async initialize(): Promise<AppState> {
    const existing = await this.get();
    if (existing !== undefined) return existing;
    const initial: AppState = {
      id: APP_STATE_ID,
      currentPromiseId: null,
      schemaVersion: 1,
    };
    const db = await getDb();
    await db.put(this.storeName, initial);
    return initial;
  }

  /** Overwrite the singleton with the given state. */
  async put(state: AppState): Promise<void> {
    const db = await getDb();
    await db.put(this.storeName, state);
  }

  /**
   * Set `currentPromiseId` to the given string. Initialises the singleton
   * first if it is absent so callers do not have to sequence init + update.
   */
  async updateCurrentPromiseId(promiseId: string): Promise<void> {
    const current = (await this.get()) ?? {
      id: APP_STATE_ID,
      currentPromiseId: null,
      schemaVersion: 1,
    };
    const next: AppState = { ...current, currentPromiseId: promiseId };
    const db = await getDb();
    await db.put(this.storeName, next);
  }

  /**
   * Set `currentPromiseId` to `null`. Initialises the singleton first if it
   * is absent so callers do not have to sequence init + clear.
   */
  async clearCurrentPromiseId(): Promise<void> {
    const current = (await this.get()) ?? {
      id: APP_STATE_ID,
      currentPromiseId: null,
      schemaVersion: 1,
    };
    const next: AppState = { ...current, currentPromiseId: null };
    const db = await getDb();
    await db.put(this.storeName, next);
  }

  /** True when the singleton record has been initialised. */
  async exists(): Promise<boolean> {
    const db = await getDb();
    const key = await db.getKey(this.storeName, APP_STATE_ID);
    return key !== undefined;
  }

  /**
   * Read the enabled Life-Program ids. Absent or empty are both surfaced
   * as `[]`. Never mutates the store.
   */
  async getEnabledProgramIds(): Promise<readonly string[]> {
    const current = await this.get();
    return current?.enabledProgramIds ?? [];
  }

  /**
   * Overwrite the enabled Life-Program ids. Initialises the singleton
   * first if it is absent so callers do not have to sequence init + write.
   * Duplicates are removed and order is preserved (first-occurrence wins).
   */
  async setEnabledProgramIds(ids: readonly string[]): Promise<void> {
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push(id);
    }
    const current = (await this.get()) ?? {
      id: APP_STATE_ID,
      currentPromiseId: null,
      schemaVersion: 1,
    };
    const next: AppState = { ...current, enabledProgramIds: deduped };
    const db = await getDb();
    await db.put(this.storeName, next);
  }

  /**
   * Read the chosen Starting Point. Returns `null` when onboarding has
   * not yet been completed — Home renders its onboarding state in that
   * case.
   */
  async getStartingPoint(): Promise<string | null> {
    const current = await this.get();
    return current?.startingPoint ?? null;
  }

  /**
   * Persist the chosen Starting Point. Initialises the singleton first
   * if it is absent so callers do not have to sequence init + write.
   */
  async setStartingPoint(startingPoint: string): Promise<void> {
    const current = (await this.get()) ?? {
      id: APP_STATE_ID,
      currentPromiseId: null,
      schemaVersion: 1,
    };
    const next: AppState = { ...current, startingPoint };
    const db = await getDb();
    await db.put(this.storeName, next);
  }
}
