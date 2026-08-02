import type { BaseEntity } from '../common';

/**
 * A note attached to a Promise. Editable across the Promise's arc via the
 * Notes section on Promise Detail. Notes belong to a Promise (never global,
 * never per-day) — Chain and Reflection do not surface notes.
 *
 * Text is capped at 1000 characters by the NoteEditor at write time; the
 * type does not enforce this at the type level.
 */
export interface Note extends BaseEntity {
  promiseId: string;
  text: string;
}
