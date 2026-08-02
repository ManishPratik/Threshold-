import { getDb } from '@data/db/client';
import { FROZEN_STORES } from '@data/db/schema';
import { APP_STATE_ID } from '@data/types/frozen/AppState';
import type { AppState } from '@data/types/frozen/AppState';
import type { Principle } from '@data/types/Principle';
import type {
  PromiseBrokenKind,
  PromiseRecord,
} from '@data/types/PromiseRecord';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { PromiseRepository } from '@data/repositories/frozen/PromiseRepository';
import type { ISODate, ISODateTime } from '@shared/lib/date';
import { nowIso } from '@shared/lib/date';

const PROMISE_SCHEMA_VERSION = 1;
const APP_STATE_SCHEMA_VERSION = 1;

/**
 * Input to createPromise. Every field the user authored plus the exact
 * moment they pressed "Make this Promise." in the Witness Ritual. The
 * service computes id, attemptNumber, activatedAt, and BaseEntity
 * timestamps.
 */
export interface CreatePromiseInput {
  title: string;
  why: string;
  stake: string;
  principles: Principle[];
  honour?: string;
  startDate: ISODate;
  endDate: ISODate;
  promisedAt: ISODateTime;
}

/**
 * Frozen-architecture Promise service. Orchestrates PromiseRepository and
 * AppStateRepository. Enforces the invariant that at most one Promise is
 * active at a time — the AppState singleton's `currentPromiseId` is the
 * pointer.
 *
 * Cross-store writes (create, break, complete) run inside a single
 * IndexedDB transaction per Engineering Foundations §10. Read-only
 * methods delegate to the repositories. The direct `getDb` import is
 * used only to open those multi-store transactions — repository methods
 * each open their own single-store transaction, so composing repositories
 * would break atomicity across `promises` and `appState`.
 *
 * Not wired into any production code in this slice.
 */
export class PromiseService {
  constructor(
    private readonly promises: PromiseRepository = new PromiseRepository(),
    private readonly appState: AppStateRepository = new AppStateRepository(),
  ) {}

  /**
   * Create a new Promise and set it as the active Promise. Runs the
   * promise-write and the AppState pointer-update inside a single
   * readwrite transaction over `promises` and `appState`.
   */
  async createPromise(input: CreatePromiseInput): Promise<PromiseRecord> {
    const now = nowIso();
    const priorCount = (await this.promises.list()).length;

    const record: PromiseRecord = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      schemaVersion: PROMISE_SCHEMA_VERSION,
      title: input.title,
      why: input.why,
      stake: input.stake,
      principles: input.principles,
      startDate: input.startDate,
      endDate: input.endDate,
      attemptNumber: priorCount + 1,
      promisedAt: input.promisedAt,
      activatedAt: now,
      ...(input.honour !== undefined ? { honour: input.honour } : {}),
    };

    const db = await getDb();
    const tx = db.transaction(
      [FROZEN_STORES.promises, FROZEN_STORES.appState],
      'readwrite',
    );

    // Guard: reject creation while another Promise is active. Reading the
    // AppState pointer INSIDE this transaction closes the race window
    // between check and write. Throwing before any write aborts the
    // transaction so neither the Promise row nor the AppState pointer is
    // mutated.
    const existingState = (await tx
      .objectStore(FROZEN_STORES.appState)
      .get(APP_STATE_ID)) as AppState | undefined;
    if (existingState && existingState.currentPromiseId !== null) {
      throw new Error(
        'Cannot create a new Promise while one is active. Break or complete the existing Promise first.',
      );
    }

    await tx.objectStore(FROZEN_STORES.promises).add(record);

    const nextState: AppState = existingState
      ? { ...existingState, currentPromiseId: record.id }
      : {
          id: APP_STATE_ID,
          currentPromiseId: record.id,
          schemaVersion: APP_STATE_SCHEMA_VERSION,
        };
    await tx.objectStore(FROZEN_STORES.appState).put(nextState);

    await tx.done;
    return record;
  }

  /**
   * Return the active Promise, resolved via the AppState pointer.
   * Undefined when no Promise is active. If the pointer references a
   * missing Promise (data-integrity failure), returns undefined without
   * throwing.
   */
  async getActivePromise(): Promise<PromiseRecord | undefined> {
    const state = await this.appState.get();
    if (!state || state.currentPromiseId === null) return undefined;
    return this.promises.getById(state.currentPromiseId);
  }

  /** Delegates to PromiseRepository.getById. */
  async getPromiseById(id: string): Promise<PromiseRecord | undefined> {
    return this.promises.getById(id);
  }

  /** Delegates to PromiseRepository.list. */
  async listPromises(): Promise<PromiseRecord[]> {
    return this.promises.list();
  }

  /**
   * Terminate a Promise as broken. Writes `brokenAt = now` and
   * `brokenKind` to the Promise, and clears the AppState pointer if it
   * references this Promise. Runs in a single readwrite transaction over
   * `promises` and `appState`. Returns the updated record, or undefined
   * when no Promise with `id` exists.
   */
  async breakPromise(
    id: string,
    kind: PromiseBrokenKind = 'broken-by-choice',
  ): Promise<PromiseRecord | undefined> {
    return this.terminatePromise(id, { kind });
  }

  /**
   * Terminate a Promise as completed. Writes `completedAt = now` to the
   * Promise, and clears the AppState pointer if it references this
   * Promise. Runs in a single readwrite transaction over `promises` and
   * `appState`. Returns the updated record, or undefined when no Promise
   * with `id` exists.
   */
  async completePromise(id: string): Promise<PromiseRecord | undefined> {
    return this.terminatePromise(id, { complete: true });
  }

  /** Set the AppState pointer to the given Promise id. */
  async setCurrentPromise(promiseId: string): Promise<void> {
    return this.appState.updateCurrentPromiseId(promiseId);
  }

  /** Clear the AppState pointer. */
  async clearCurrentPromise(): Promise<void> {
    return this.appState.clearCurrentPromiseId();
  }

  private async terminatePromise(
    id: string,
    opts: { kind?: PromiseBrokenKind; complete?: boolean },
  ): Promise<PromiseRecord | undefined> {
    const db = await getDb();
    const tx = db.transaction(
      [FROZEN_STORES.promises, FROZEN_STORES.appState],
      'readwrite',
    );

    const existing = (await tx
      .objectStore(FROZEN_STORES.promises)
      .get(id)) as PromiseRecord | undefined;

    if (!existing) {
      await tx.done;
      return undefined;
    }

    const now = nowIso();
    const next: PromiseRecord = {
      ...existing,
      updatedAt: now,
      ...(opts.complete
        ? { completedAt: now }
        : { brokenAt: now, brokenKind: opts.kind ?? 'broken-by-choice' }),
    };
    await tx.objectStore(FROZEN_STORES.promises).put(next);

    const state = (await tx
      .objectStore(FROZEN_STORES.appState)
      .get(APP_STATE_ID)) as AppState | undefined;
    if (state && state.currentPromiseId === id) {
      const cleared: AppState = { ...state, currentPromiseId: null };
      await tx.objectStore(FROZEN_STORES.appState).put(cleared);
    }

    await tx.done;
    return next;
  }
}
