import { getDb } from '@data/db/client';
import { FROZEN_STORES } from '@data/db/schema';
import type { Routine, RoutineBlock } from '@data/types/frozen/Routine';
import { RoutineRepository } from '@data/repositories/frozen/RoutineRepository';
import { BlockCompletionRepository } from '@data/repositories/frozen/BlockCompletionRepository';
import { nowIso } from '@shared/lib/date';

const ROUTINE_SCHEMA_VERSION = 1;

/**
 * Input to createRoutine. The service mints the id and the BaseEntity
 * timestamps; the caller supplies only the Promise this Routine belongs
 * to and the initial block list.
 */
export interface CreateRoutineInput {
  promiseId: string;
  blocks: RoutineBlock[];
}

/**
 * Frozen-architecture Routine service. Owns exactly one Routine per
 * Promise — enforced by the unique `by-promiseId` index defined in
 * migration2 on the frozen Routine store. Duplicate create requests for
 * the same Promise are rejected by IDB before the write completes.
 *
 * No declaration logic, no Promise lifecycle logic, no UI behaviour.
 *
 * `deleteRoutine` is the one cross-store mutation: the Routine and every
 * BlockCompletion for the same Promise are removed inside a single
 * readwrite transaction (Engineering Foundations §10). The direct
 * `getDb` import is used only for that transaction — repository methods
 * each open their own single-store transaction, so composing repositories
 * would break atomicity across `frozenRoutines` and `blockCompletions`.
 *
 * Not wired into any production code in this slice.
 */
export class RoutineService {
  constructor(
    private readonly routines: RoutineRepository = new RoutineRepository(),
    private readonly completions: BlockCompletionRepository = new BlockCompletionRepository(),
  ) {}

  /**
   * Create a Routine for a Promise. Rejects if a Routine for this
   * Promise already exists (unique `by-promiseId` index in migration2).
   */
  async createRoutine(input: CreateRoutineInput): Promise<Routine> {
    const now = nowIso();
    const record: Routine = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      schemaVersion: ROUTINE_SCHEMA_VERSION,
      promiseId: input.promiseId,
      blocks: input.blocks,
    };
    await this.routines.create(record);
    return record;
  }

  /** Read the Routine for a Promise. Undefined when absent. */
  async getRoutine(promiseId: string): Promise<Routine | undefined> {
    return this.routines.getByPromiseId(promiseId);
  }

  /**
   * Overwrite a Routine with the caller-supplied record. Refreshes
   * `updatedAt`. Preserves the record's `promiseId` — the unique index
   * rejects any attempt to move the Routine to a Promise already owning
   * one.
   */
  async updateRoutine(routine: Routine): Promise<Routine> {
    const next: Routine = { ...routine, updatedAt: nowIso() };
    await this.routines.put(next);
    return next;
  }

  /**
   * Replace the block list of the Routine owned by a Promise. Reads the
   * current Routine, substitutes `blocks`, refreshes `updatedAt`, and
   * writes atomically via the frozen Routine store's single-store
   * transaction. Throws when no Routine exists for the Promise.
   */
  async replaceBlocks(
    promiseId: string,
    blocks: RoutineBlock[],
  ): Promise<Routine> {
    const existing = await this.routines.getByPromiseId(promiseId);
    if (!existing) {
      throw new Error(`No Routine exists for promise ${promiseId}`);
    }
    const next: Routine = { ...existing, blocks, updatedAt: nowIso() };
    await this.routines.put(next);
    return next;
  }

  /** Return the block list for a Promise's Routine. Empty when absent. */
  async getBlocks(promiseId: string): Promise<RoutineBlock[]> {
    const routine = await this.routines.getByPromiseId(promiseId);
    return routine?.blocks ?? [];
  }

  /** True when a Routine exists for the Promise. */
  async hasRoutine(promiseId: string): Promise<boolean> {
    const routine = await this.routines.getByPromiseId(promiseId);
    return routine !== undefined;
  }

  /**
   * Delete a Promise's Routine and every BlockCompletion attached to
   * that Promise, inside a single readwrite transaction over
   * `frozenRoutines` and `blockCompletions`. The completion cascade uses
   * the `by-promiseId-date` compound index defined in migration2 with a
   * bounded range on the promiseId prefix. No-op when the Promise has
   * no Routine — the completion cascade still runs, which is safe when
   * no completions exist.
   *
   * `completions` is retained as an instance field so callers holding a
   * shared repository instance are consistent even though the cascade
   * itself runs directly against the store within the transaction.
   */
  async deleteRoutine(promiseId: string): Promise<void> {
    // Reference the completions repository field to keep it live for
    // callers even when the cascade uses direct-store access below.
    void this.completions;

    const db = await getDb();
    const tx = db.transaction(
      [FROZEN_STORES.frozenRoutines, FROZEN_STORES.blockCompletions],
      'readwrite',
    );

    const routineIdx = tx
      .objectStore(FROZEN_STORES.frozenRoutines)
      .index('by-promiseId');
    const routineKey = await routineIdx.getKey(promiseId);
    if (routineKey !== undefined) {
      await tx.objectStore(FROZEN_STORES.frozenRoutines).delete(routineKey);
    }

    const completionsIdx = tx
      .objectStore(FROZEN_STORES.blockCompletions)
      .index('by-promiseId-date');
    const range = IDBKeyRange.bound([promiseId], [promiseId, '￿']);
    let cursor = await completionsIdx.openCursor(range);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
  }
}
