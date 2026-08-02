import type { Note } from '@data/types/frozen/Note';
import { NoteRepository } from '@data/repositories/frozen/NoteRepository';
import { nowIso } from '@shared/lib/date';

/**
 * Maximum note length per Engineering Foundations §7. Enforced at write
 * time on the trimmed text — leading and trailing whitespace do not
 * count toward the limit.
 */
export const NOTE_MAX_LENGTH = 1000;

const NOTE_SCHEMA_VERSION = 1;

/**
 * Frozen-architecture Note service. Notes belong to a Promise and are
 * mutated only through this service. Every write validates the text
 * before touching the store: trim leading and trailing whitespace,
 * reject when the trimmed length is zero, reject when the trimmed length
 * exceeds `NOTE_MAX_LENGTH`. The stored text is the trimmed value.
 *
 * `updatedAt` refreshes on every modification; `createdAt`, `id`,
 * `promiseId`, and `schemaVersion` are preserved across updates.
 *
 * No declaration logic, no Promise lifecycle logic, no UI behaviour.
 *
 * Every mutation runs inside a single readwrite transaction on the
 * frozen Note store — the repository's per-method transactions satisfy
 * Engineering Foundations §10 for single-store writes.
 *
 * Duplicate-submission protection lives at the UI layer via the
 * `useSubmitOnce` hook; the service performs no additional deduping.
 *
 * Not wired into any production code in this slice.
 */
export class NoteService {
  constructor(
    private readonly notes: NoteRepository = new NoteRepository(),
  ) {}

  /**
   * Create a new Note attached to a Promise. Mints id via
   * `crypto.randomUUID`, sets `createdAt` and `updatedAt` to `nowIso()`.
   * Throws when the text is empty (post-trim) or exceeds `NOTE_MAX_LENGTH`.
   */
  async createNote(promiseId: string, text: string): Promise<Note> {
    const trimmed = validateNoteText(text);
    const now = nowIso();
    const record: Note = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      schemaVersion: NOTE_SCHEMA_VERSION,
      promiseId,
      text: trimmed,
    };
    await this.notes.create(record);
    return record;
  }

  /**
   * Update the text of an existing Note. Reads the current record,
   * substitutes `text` (trimmed) and refreshes `updatedAt`, preserves
   * `id`, `createdAt`, `promiseId`, and `schemaVersion`. Throws when
   * the text is empty (post-trim), exceeds `NOTE_MAX_LENGTH`, or the
   * Note does not exist.
   */
  async updateNote(id: string, text: string): Promise<Note> {
    const trimmed = validateNoteText(text);
    const existing = await this.notes.getById(id);
    if (!existing) {
      throw new Error(`No Note exists with id ${id}`);
    }
    const next: Note = {
      ...existing,
      text: trimmed,
      updatedAt: nowIso(),
    };
    await this.notes.put(next);
    return next;
  }

  /** Read a Note by id. Undefined when absent. */
  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.getById(id);
  }

  /**
   * Read every Note attached to a Promise. Order is the repository's
   * natural index order; sorting for UI (e.g., reverse-chronological on
   * Promise Detail) is a caller concern.
   */
  async listNotesForPromise(promiseId: string): Promise<Note[]> {
    return this.notes.listForPromise(promiseId);
  }

  /** Delete a Note by id. Safe when the Note does not exist. */
  async deleteNote(id: string): Promise<void> {
    await this.notes.delete(id);
  }

  /**
   * Delete every Note owned by a Promise inside a single readwrite
   * transaction (the repository handles the cursor). No-op when the
   * Promise has no notes.
   */
  async deleteNotesForPromise(promiseId: string): Promise<void> {
    await this.notes.deleteByPromiseId(promiseId);
  }
}

function validateNoteText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Note text is empty.');
  }
  if (trimmed.length > NOTE_MAX_LENGTH) {
    throw new Error(
      `Note text exceeds the ${NOTE_MAX_LENGTH}-character limit ` +
        `(got ${trimmed.length}).`,
    );
  }
  return trimmed;
}
