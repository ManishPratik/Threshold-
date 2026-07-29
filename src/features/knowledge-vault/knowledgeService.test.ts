import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@data/repositories', () => ({
  noteRepository: {
    getById: vi.fn(),
    getActive: vi.fn(),
    getAll: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import {
  KnowledgeServiceError,
  NOTE_BODY_MAX,
  NOTE_TAGS_MAX,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX,
  listActiveNotes,
  listTrashedNotes,
  parseTagsInput,
  permanentlyDeleteNote,
  restoreNote,
  saveNote,
  softDeleteNote,
  validateNoteDraft,
  type NoteDraft,
} from './knowledgeService';
import { noteRepository } from '@data/repositories';
import type { Note } from '@data/types/Note';

const validDraft: NoteDraft = {
  title: 'Read Deep Work',
  body: 'Book by Cal Newport. Key idea: sustained focus is a superpower.',
  tags: ['reading', 'focus'],
};

function stubNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    createdAt: '2026-05-10T09:00:00.000Z',
    updatedAt: '2026-05-10T09:00:00.000Z',
    schemaVersion: 1,
    title: 'Old',
    body: 'body',
    tags: [],
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateNoteDraft', () => {
  it('accepts a well-formed draft', () => {
    expect(validateNoteDraft(validDraft)).toEqual([]);
  });

  it('rejects empty or whitespace-only title', () => {
    const errs = validateNoteDraft({ ...validDraft, title: '  ' });
    expect(errs.map((e) => e.field)).toContain('title');
  });

  it('rejects over-long title', () => {
    const errs = validateNoteDraft({ ...validDraft, title: 'x'.repeat(NOTE_TITLE_MAX + 1) });
    expect(errs.map((e) => e.field)).toContain('title');
  });

  it('accepts empty body', () => {
    expect(validateNoteDraft({ ...validDraft, body: '' })).toEqual([]);
  });

  it('rejects over-long body', () => {
    const errs = validateNoteDraft({ ...validDraft, body: 'x'.repeat(NOTE_BODY_MAX + 1) });
    expect(errs.map((e) => e.field)).toContain('body');
  });

  it('rejects too many tags', () => {
    const tooMany = Array.from({ length: NOTE_TAGS_MAX + 1 }, (_, i) => `t${i}`);
    expect(validateNoteDraft({ ...validDraft, tags: tooMany }).map((e) => e.field)).toContain(
      'tags',
    );
  });

  it('rejects over-long tag', () => {
    const errs = validateNoteDraft({
      ...validDraft,
      tags: ['ok', 'x'.repeat(NOTE_TAG_MAX_LENGTH + 1)],
    });
    expect(errs.map((e) => e.field)).toContain('tags');
  });
});

describe('parseTagsInput', () => {
  it('splits, trims, lowercases, deduplicates, and drops empties', () => {
    expect(parseTagsInput('  Focus, reading ,,focus , DEEP-work ')).toEqual([
      'focus',
      'reading',
      'deep-work',
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseTagsInput('')).toEqual([]);
    expect(parseTagsInput('   ,,,,')).toEqual([]);
  });
});

describe('saveNote — create', () => {
  it('persists a new note with deletedAt=null and timestamps', async () => {
    (noteRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const saved = await saveNote(validDraft);

    expect(saved.title).toBe(validDraft.title);
    expect(saved.body).toBe(validDraft.body);
    expect(saved.tags).toEqual(validDraft.tags);
    expect(saved.deletedAt).toBeNull();
    expect(saved.createdAt).toBeTruthy();
    expect(saved.updatedAt).toBe(saved.createdAt);
    expect(typeof saved.id).toBe('string');
    expect(noteRepository.put).toHaveBeenCalledTimes(1);
  });

  it('trims the title on save', async () => {
    (noteRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const saved = await saveNote({ ...validDraft, title: '  Trim me  ' });
    expect(saved.title).toBe('Trim me');
  });

  it('rejects invalid drafts before touching the DB', async () => {
    await expect(saveNote({ title: '', body: '', tags: [] })).rejects.toBeInstanceOf(
      KnowledgeServiceError,
    );
    expect(noteRepository.put).not.toHaveBeenCalled();
  });
});

describe('saveNote — edit', () => {
  it('updates fields and preserves id + createdAt + deletedAt', async () => {
    const existing = stubNote({ id: 'n1', deletedAt: null });
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
    (noteRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const updated = await saveNote(
      { title: 'New', body: 'body2', tags: ['x'] },
      { replacingNoteId: 'n1' },
    );

    expect(updated.id).toBe('n1');
    expect(updated.createdAt).toBe(existing.createdAt);
    expect(updated.title).toBe('New');
    expect(updated.body).toBe('body2');
    expect(updated.tags).toEqual(['x']);
    expect(updated.deletedAt).toBeNull();
    expect(updated.updatedAt).not.toBe(existing.updatedAt);
  });

  it('throws when the target note does not exist', async () => {
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await expect(
      saveNote(validDraft, { replacingNoteId: 'missing' }),
    ).rejects.toBeInstanceOf(KnowledgeServiceError);
  });
});

describe('softDeleteNote', () => {
  it('sets deletedAt on an active note', async () => {
    const existing = stubNote({ id: 'n1', deletedAt: null });
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
    (noteRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await softDeleteNote('n1');
    expect(result.deletedAt).not.toBeNull();
    expect(noteRepository.put).toHaveBeenCalledTimes(1);
  });

  it('is idempotent on already-deleted notes', async () => {
    const existing = stubNote({ id: 'n1', deletedAt: '2026-05-01T00:00:00.000Z' });
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const result = await softDeleteNote('n1');
    expect(result.deletedAt).toBe('2026-05-01T00:00:00.000Z');
    expect(noteRepository.put).not.toHaveBeenCalled();
  });

  it('throws when the note does not exist', async () => {
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await expect(softDeleteNote('missing')).rejects.toBeInstanceOf(KnowledgeServiceError);
  });
});

describe('restoreNote', () => {
  it('clears deletedAt on a soft-deleted note and refreshes updatedAt', async () => {
    const existing = stubNote({
      id: 'n1',
      deletedAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    });
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
    (noteRepository.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await restoreNote('n1');
    expect(result.deletedAt).toBeNull();
    expect(result.updatedAt).not.toBe(existing.updatedAt);
    expect(noteRepository.put).toHaveBeenCalledTimes(1);
  });

  it('is idempotent on an already-active note', async () => {
    const existing = stubNote({ id: 'n1', deletedAt: null });
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const result = await restoreNote('n1');
    expect(result).toBe(existing);
    expect(noteRepository.put).not.toHaveBeenCalled();
  });

  it('throws when the note does not exist', async () => {
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await expect(restoreNote('missing')).rejects.toBeInstanceOf(KnowledgeServiceError);
  });
});

describe('permanentlyDeleteNote', () => {
  it('deletes a soft-deleted note through the repository', async () => {
    const existing = stubNote({ id: 'n1', deletedAt: '2026-05-01T00:00:00.000Z' });
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
    (noteRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await permanentlyDeleteNote('n1');
    expect(noteRepository.delete).toHaveBeenCalledTimes(1);
    expect(noteRepository.delete).toHaveBeenCalledWith('n1');
  });

  it('refuses to hard-delete an active note', async () => {
    const active = stubNote({ id: 'n1', deletedAt: null });
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(active);

    await expect(permanentlyDeleteNote('n1')).rejects.toBeInstanceOf(KnowledgeServiceError);
    expect(noteRepository.delete).not.toHaveBeenCalled();
  });

  it('throws when the note does not exist', async () => {
    (noteRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await expect(permanentlyDeleteNote('missing')).rejects.toBeInstanceOf(
      KnowledgeServiceError,
    );
  });
});

describe('listTrashedNotes', () => {
  it('returns only soft-deleted notes sorted by deletedAt descending', async () => {
    const all: Note[] = [
      stubNote({ id: 'a', deletedAt: '2026-05-01T00:00:00.000Z' }),
      stubNote({ id: 'b', deletedAt: null }),
      stubNote({ id: 'c', deletedAt: '2026-05-05T00:00:00.000Z' }),
      stubNote({ id: 'd', deletedAt: '2026-05-03T00:00:00.000Z' }),
    ];
    (noteRepository.getAll as ReturnType<typeof vi.fn>).mockResolvedValue(all);
    const trashed = await listTrashedNotes();
    expect(trashed.map((n) => n.id)).toEqual(['c', 'd', 'a']);
  });

  it('returns empty when nothing is trashed', async () => {
    (noteRepository.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    expect(await listTrashedNotes()).toEqual([]);
  });
});

describe('listActiveNotes', () => {
  it('returns active notes sorted by updatedAt descending', async () => {
    const notes: Note[] = [
      stubNote({ id: 'a', updatedAt: '2026-05-10T08:00:00.000Z' }),
      stubNote({ id: 'b', updatedAt: '2026-05-12T08:00:00.000Z' }),
      stubNote({ id: 'c', updatedAt: '2026-05-11T08:00:00.000Z' }),
    ];
    (noteRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue(notes);
    const result = await listActiveNotes();
    expect(result.map((n) => n.id)).toEqual(['b', 'c', 'a']);
  });

  it('returns empty array when nothing is active', async () => {
    (noteRepository.getActive as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    expect(await listActiveNotes()).toEqual([]);
  });
});
