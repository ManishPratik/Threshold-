import type {
  Declaration,
  DeclarationVerdict,
} from '@data/types/frozen/Declaration';
import { DeclarationRepository } from '@data/repositories/frozen/DeclarationRepository';
import { PromiseRepository } from '@data/repositories/frozen/PromiseRepository';
import type { ISODate, ISODateTime } from '@shared/lib/date';
import { addDays, nowIso } from '@shared/lib/date';

const DECLARATION_SCHEMA_VERSION = 1;

/**
 * Frozen-architecture Declaration service. Writes and reads Declaration
 * records only. Enforces the one-verdict-per-(promiseId, date) invariant
 * — the composite primary key in migration2 rejects duplicates, and this
 * service reads back on conflict so a same-verdict re-tap is a no-op and
 * a different-verdict re-tap is a hard refusal.
 *
 * No Promise lifecycle mutations, no Reflection UI logic, no Recovery /
 * Completion / Witness / Routine / Note / routing logic — the caller
 * composes those.
 *
 * `declaredAt` is optional on every write. When absent, the service
 * captures `nowIso()`. Callers under real UI pass the moment the ritual
 * button was tapped; tests pass explicit timestamps for determinism. The
 * caller-supplied `date` is the logical-day target for the declaration
 * (per Engineering Foundations §8) and is preserved verbatim.
 *
 * Not wired into any production code in this slice.
 */
export class DeclarationService {
  constructor(
    private readonly declarations: DeclarationRepository = new DeclarationRepository(),
    private readonly promises: PromiseRepository = new PromiseRepository(),
  ) {}

  /**
   * Write a `kept` declaration for (promiseId, date). Returns the stored
   * Declaration. Idempotent: re-tapping the same (promiseId, date) with
   * `kept` returns the existing record. Refuses to overwrite an existing
   * `broken` declaration for the same day (Reflection is one-shot).
   */
  async declareKept(
    promiseId: string,
    date: ISODate,
    declaredAt?: ISODateTime,
  ): Promise<Declaration> {
    return this.write(promiseId, date, 'kept', declaredAt);
  }

  /**
   * Write a `broken` declaration for (promiseId, date). Returns the stored
   * Declaration. Idempotent: re-tapping the same (promiseId, date) with
   * `broken` returns the existing record. Refuses to overwrite an
   * existing `kept` declaration for the same day.
   */
  async declareBroken(
    promiseId: string,
    date: ISODate,
    declaredAt?: ISODateTime,
  ): Promise<Declaration> {
    return this.write(promiseId, date, 'broken', declaredAt);
  }

  /**
   * Read today's declaration for `promiseId`. Alias of `getDeclaration`
   * with an explicit "today" date supplied by the caller so the service
   * stays free of logical-day computation.
   */
  async getTodayDeclaration(
    promiseId: string,
    today: ISODate,
  ): Promise<Declaration | undefined> {
    return this.declarations.get(promiseId, today);
  }

  /** Read the declaration for one (promiseId, date). Undefined when absent. */
  async getDeclaration(
    promiseId: string,
    date: ISODate,
  ): Promise<Declaration | undefined> {
    return this.declarations.get(promiseId, date);
  }

  /**
   * Read every declaration for a Promise in ascending logical-date order
   * (delegates to `DeclarationRepository.backfillOldestFirst`). Chain
   * renders in this order; History does not surface individual
   * declarations.
   */
  async listDeclarationsForPromise(
    promiseId: string,
  ): Promise<Declaration[]> {
    return this.declarations.backfillOldestFirst(promiseId);
  }

  /**
   * Return the logical dates in `[promise.startDate, today)` that have no
   * declaration, ordered oldest-first. Today's undeclared day is not a
   * backfill candidate — Reflection Screen A handles today's ritual until
   * the logical-day boundary rolls per Engineering Foundations §8.
   *
   * Returns an empty array when the Promise does not exist.
   */
  async backfillMissingDaysOldestFirst(
    promiseId: string,
    today: ISODate,
  ): Promise<ISODate[]> {
    const promise = await this.promises.getById(promiseId);
    if (!promise) return [];

    const declared = new Set(
      (await this.declarations.listForPromise(promiseId)).map((d) => d.date),
    );

    const missing: ISODate[] = [];
    let cursor = promise.startDate;
    while (cursor < today) {
      if (!declared.has(cursor)) missing.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return missing;
  }

  private async write(
    promiseId: string,
    date: ISODate,
    verdict: DeclarationVerdict,
    declaredAt?: ISODateTime,
  ): Promise<Declaration> {
    const record: Declaration = {
      promiseId,
      date,
      verdict,
      declaredAt: declaredAt ?? nowIso(),
      schemaVersion: DECLARATION_SCHEMA_VERSION,
    };
    try {
      await this.declarations.create(record);
      return record;
    } catch (err) {
      const existing = await this.declarations.get(promiseId, date);
      if (existing && existing.verdict === verdict) {
        return existing;
      }
      if (existing) {
        throw new Error(
          `Declaration for promise ${promiseId} on ${date} already exists ` +
            `with verdict '${existing.verdict}'; refusing to overwrite with '${verdict}'.`,
        );
      }
      throw err;
    }
  }
}
