import { noteRepository } from '@data/repositories';
import type { Note } from '@data/types/Note';
import { nowIso } from '@shared/lib/date';
import { generateId } from '@shared/lib/id';

/**
 * Knowledge Vault domain service. Mirrors the pattern from ADR 0007:
 * repositories persist single aggregates; this service owns validation,
 * timestamp discipline, and the soft-delete rule.
 */

const SCHEMA_VERSION = 1;

export const NOTE_TITLE_MAX = 120;
export const NOTE_BODY_MAX = 10_000;
export const NOTE_TAG_MAX_LENGTH = 40;
export const NOTE_TAGS_MAX = 20;

export interface NoteDraft {
  title: string;
  body: string;
  tags: string[];
}

export interface NoteFieldError {
  field: 'title' | 'body' | 'tags';
  message: string;
}

export class KnowledgeServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KnowledgeServiceError';
  }
}

// ────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────

export function validateNoteDraft(draft: NoteDraft): NoteFieldError[] {
  const errors: NoteFieldError[] = [];
  const title = draft.title.trim();

  if (title.length === 0) {
    errors.push({ field: 'title', message: 'Give this note a title.' });
  } else if (title.length > NOTE_TITLE_MAX) {
    errors.push({
      field: 'title',
      message: `Titles must stay under ${NOTE_TITLE_MAX} characters.`,
    });
  }

  if (draft.body.length > NOTE_BODY_MAX) {
    errors.push({
      field: 'body',
      message: `Body must stay under ${NOTE_BODY_MAX} characters.`,
    });
  }

  if (draft.tags.length > NOTE_TAGS_MAX) {
    errors.push({
      field: 'tags',
      message: `Keep tags under ${NOTE_TAGS_MAX}.`,
    });
  }
  for (const t of draft.tags) {
    if (t.length > NOTE_TAG_MAX_LENGTH) {
      errors.push({
        field: 'tags',
        message: `Each tag must stay under ${NOTE_TAG_MAX_LENGTH} characters.`,
      });
      break;
    }
  }

  return errors;
}

/**
 * Parses a user-typed comma-separated tag string into a normalised array:
 * trimmed, lowercased, de-duplicated, empty entries dropped.
 */
export function parseTagsInput(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input.split(',')) {
    const t = raw.trim().toLowerCase();
    if (t.length === 0) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    tags.push(t);
  }
  return tags;
}

// ────────────────────────────────────────────────────────────
// Save (create or edit)
// ────────────────────────────────────────────────────────────

export async function saveNote(
  draft: NoteDraft,
  options?: { replacingNoteId?: string | undefined },
): Promise<Note> {
  const errors = validateNoteDraft(draft);
  if (errors.length > 0) {
    throw new KnowledgeServiceError(errors.map((e) => e.message).join(' '));
  }

  const now = nowIso();
  const existingId = options?.replacingNoteId;

  if (existingId) {
    const current = await noteRepository.getById(existingId);
    if (!current) {
      throw new KnowledgeServiceError(`Note ${existingId} not found.`);
    }
    const updated: Note = {
      ...current,
      title: draft.title.trim(),
      body: draft.body,
      tags: draft.tags,
      updatedAt: now,
    };
    await noteRepository.put(updated);
    return updated;
  }

  const note: Note = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    title: draft.title.trim(),
    body: draft.body,
    tags: draft.tags,
    deletedAt: null,
  };
  await noteRepository.put(note);
  return note;
}

// ────────────────────────────────────────────────────────────
// Soft delete
// ────────────────────────────────────────────────────────────

export async function softDeleteNote(id: string): Promise<Note> {
  const current = await noteRepository.getById(id);
  if (!current) {
    throw new KnowledgeServiceError(`Note ${id} not found.`);
  }
  if (current.deletedAt !== null) {
    return current;
  }
  const updated: Note = {
    ...current,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
  };
  await noteRepository.put(updated);
  return updated;
}

/**
 * Reverses a soft delete by clearing `deletedAt`. Idempotent on already-active
 * notes. Powers the inline Undo affordance on the Vault list.
 */
export async function restoreNote(id: string): Promise<Note> {
  const current = await noteRepository.getById(id);
  if (!current) {
    throw new KnowledgeServiceError(`Note ${id} not found.`);
  }
  if (current.deletedAt === null) {
    return current;
  }
  const now = nowIso();
  const updated: Note = {
    ...current,
    deletedAt: null,
    updatedAt: now,
  };
  await noteRepository.put(updated);
  return updated;
}

/**
 * Hard-deletes a note. Only allowed against already soft-deleted notes so
 * accidental permanent deletion cannot happen from the active list — Trash
 * is a two-step process (soft delete → open Settings → confirm purge).
 */
export async function permanentlyDeleteNote(id: string): Promise<void> {
  const current = await noteRepository.getById(id);
  if (!current) {
    throw new KnowledgeServiceError(`Note ${id} not found.`);
  }
  if (current.deletedAt === null) {
    throw new KnowledgeServiceError(
      'Only trashed notes can be permanently deleted. Soft-delete first.',
    );
  }
  await noteRepository.delete(id);
}

// ────────────────────────────────────────────────────────────
// Reads
// ────────────────────────────────────────────────────────────

/** Active (non-deleted) notes sorted by updatedAt descending. */
export async function listActiveNotes(): Promise<Note[]> {
  const active = await noteRepository.getActive();
  return active.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Soft-deleted notes sorted by deletedAt descending (most recent first). */
export async function listTrashedNotes(): Promise<Note[]> {
  const all = await noteRepository.getAll();
  return all
    .filter((n) => n.deletedAt !== null)
    .sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
}
