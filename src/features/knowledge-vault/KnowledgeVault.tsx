import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Heading, Text } from '@shared/ui';
import type { Note } from '@data/types/Note';
import { listActiveNotes, restoreNote, softDeleteNote } from './knowledgeService';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import styles from './KnowledgeVault.module.css';

type Mode =
  | { kind: 'list' }
  | { kind: 'edit'; note: Note | null };

const UNDO_WINDOW_MS = 6000;

/**
 * Knowledge Vault surface. Two modes: list (with per-note actions) and
 * editor (create or edit). Mode swap replaces the whole main region —
 * consistent with the mission and routine flows.
 *
 * Delete → inline "Note deleted · Undo" affordance for ~6s (see UNDO_WINDOW_MS).
 * Clicking Undo restores the note via restoreNote. No toast system, no global
 * state — the affordance lives in local state and clears on timeout.
 */
export function KnowledgeVault() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [actionError, setActionError] = useState<string | undefined>(undefined);
  const [pendingUndoId, setPendingUndoId] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current !== null) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearUndoTimer();
    };
  }, [clearUndoTimer]);

  const reload = useCallback(async () => {
    const fresh = await listActiveNotes();
    setNotes(fresh);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const fresh = await listActiveNotes();
      if (!cancelled) setNotes(fresh);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = (noteId: string) => {
    setActionError(undefined);
    clearUndoTimer();
    void (async () => {
      try {
        await softDeleteNote(noteId);
        await reload();
        setPendingUndoId(noteId);
        undoTimerRef.current = setTimeout(() => {
          setPendingUndoId((current) => (current === noteId ? null : current));
          undoTimerRef.current = null;
        }, UNDO_WINDOW_MS);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Delete failed.');
      }
    })();
  };

  const handleUndo = () => {
    if (!pendingUndoId) return;
    const id = pendingUndoId;
    clearUndoTimer();
    setPendingUndoId(null);
    setActionError(undefined);
    void (async () => {
      try {
        await restoreNote(id);
        await reload();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Undo failed.');
      }
    })();
  };

  if (notes === null) {
    return null;
  }

  if (mode.kind === 'edit') {
    return (
      <NoteEditor
        existing={mode.note}
        onSaved={() => {
          void reload();
          setMode({ kind: 'list' });
        }}
        onCancel={() => setMode({ kind: 'list' })}
      />
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <Heading level={1} className={styles.title}>
            Knowledge
          </Heading>
          <Text size="sm" variant="secondary" className={styles.subtitle}>
            {notes.length === 0
              ? 'No notes yet. Capture the first thing worth remembering.'
              : `${notes.length} note${notes.length === 1 ? '' : 's'}`}
          </Text>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => setMode({ kind: 'edit', note: null })}
        >
          New note
        </Button>
      </header>

      {pendingUndoId && (
        <div className={styles.undoBar} role="status">
          <Text size="sm" as="span" className={styles.undoText}>
            Note deleted.
          </Text>
          <Button type="button" variant="ghost" size="sm" onClick={handleUndo}>
            Undo
          </Button>
        </div>
      )}

      {actionError && (
        <p className={styles.error} role="alert">
          {actionError}
        </p>
      )}

      {notes.length === 0 ? (
        <Card padding="lg" className={styles.emptyCard}>
          <Text variant="secondary">
            Notes live here. Books, quotes, ideas — anything you want to keep close.
          </Text>
        </Card>
      ) : (
        <ul className={styles.list}>
          {notes.map((n) => (
            <li key={n.id}>
              <NoteCard
                note={n}
                onEdit={() => setMode({ kind: 'edit', note: n })}
                onDelete={() => handleDelete(n.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
