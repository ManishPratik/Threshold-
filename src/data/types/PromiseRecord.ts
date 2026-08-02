import type { ISODate, ISODateTime } from '@shared/lib/date';
import type { BaseEntity } from './common';
import type { Principle } from './Principle';

/**
 * How a Promise ended, if it did.
 *
 * - 'final-day-broken': the declaration on the Promise's endDate was `broken`.
 * - 'broken-by-choice': Break Promise was invoked from Promise Detail.
 *
 * A mid-arc broken declaration does NOT end the Promise — the Promise
 * remains active per the Broken Promise rule.
 */
export type PromiseBrokenKind = 'final-day-broken' | 'broken-by-choice';

/**
 * The user's contract with themselves. Every field except the terminal
 * timestamps (brokenAt, brokenKind, completedAt) is set at creation and
 * never edited. Break Promise or endDate resolution are the only paths
 * to mutation after activation.
 *
 * Named `PromiseRecord` (not `Promise`) so the type never collides with
 * the JavaScript built-in `Promise<T>`. Domain conversations still use
 * the word "Promise".
 */
export interface PromiseRecord extends BaseEntity {
  /** One-sentence promise the user made to themselves. Serif hero surface. */
  title: string;
  /** The user's own words for why. Multi-line paragraph. */
  why: string;
  /** The user's own words for what they refuse to lose. Multi-line paragraph. */
  stake: string;
  /**
   * Up to five authored principles. principles[0] is the operating principle
   * surfaced by the Today "Remember" card.
   */
  principles: Principle[];
  /** Optional reward the user chose. Absent when the user did not author one. */
  honour?: string;
  startDate: ISODate;
  endDate: ISODate;
  /**
   * Chronological attempt number, assigned at Promise creation as
   * (count of the user's prior Promises + 1). First Promise ever = 1.
   */
  attemptNumber: number;
  /**
   * The moment the user pressed "Make this Promise." in the Witness Ritual.
   * Anchors the emotional keepsake independent of DB-write latency.
   */
  promisedAt: ISODateTime;
  /** The moment the Promise record was persisted. */
  activatedAt: ISODateTime;
  /** Set when the Promise ends broken. Absent otherwise. */
  brokenAt?: ISODateTime;
  /** Present iff brokenAt is present. */
  brokenKind?: PromiseBrokenKind;
  /**
   * Set when the Promise reaches endDate with the final declaration kept.
   * Absent otherwise.
   */
  completedAt?: ISODateTime;
}
