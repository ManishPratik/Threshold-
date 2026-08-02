import type { ISODate, ISODateTime } from '@shared/lib/date';

/**
 * The user's truthful declaration for a single logical day of a Promise.
 * One record per (promiseId, date). Immutable after write — Reflection is
 * a one-shot ritual per day; re-opening it renders read-only.
 *
 * The `date` field is a YYYY-MM-DD label for the LOGICAL day per the
 * Engineering Foundations time rules (04:00 local boundary), not the
 * calendar date of `declaredAt`.
 */
export type DeclarationVerdict = 'kept' | 'broken';

export interface Declaration {
  promiseId: string;
  date: ISODate;
  verdict: DeclarationVerdict;
  /** The moment the user tapped Yes or No on Reflection Screen A. */
  declaredAt: ISODateTime;
  schemaVersion: number;
}
