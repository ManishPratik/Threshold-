import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Text } from '@shared/ui';
import { formatShortDate } from '@shared/lib/date';
import type { Note } from '@data/types/Note';
import {
  KnowledgeServiceError,
  listTrashedNotes,
  permanentlyDeleteNote,
  restoreNote,
} from '@features/knowledge-vault';
import styles from './TrashSection.module.css';

/**
 * Knowledge Vault trash. Renders as a single warm card that either shows
 * the empty state or a list of soft-deleted notes with per-row Restore +
 * Delete Forever actions. Delete Forever is a two-step confirmation.
 */
export function TrashSection() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const reload = useCallback(async () => {
    try {
      const fresh = await listTrashedNotes();
      setNotes(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load trash.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const fresh = await listTrashedNotes();
        if (!cancelled) setNotes(fresh);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load trash.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const doRestore = (id: string) => {
    setError(undefined);
    void (async () => {
      try {
        await restoreNote(id);
        setConfirmingDeleteId((current) => (current === id ? null : current));
        await reload();
      } catch (e) {
        setError(
          e instanceof KnowledgeServiceError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Restore failed.',
        );
      }
    })();
  };

  const doDeleteForever = (id: string) => {
    setError(undefined);
    void (async () => {
      try {
        await permanentlyDeleteNote(id);
        setConfirmingDeleteId(null);
        await reload();
      } catch (e) {
        setError(
          e instanceof KnowledgeServiceError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Delete failed.',
        );
      }
    })();
  };

  return (
    <Card padding="md" className={styles.card} as="article" aria-labelledby="trash-heading">
      <p className={styles.kicker} id="trash-heading">
        Trash
      </p>
      <p className={styles.subline}>Deleted notes rest here until you restore or clear them.</p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {notes === null ? null : notes.length === 0 ? (
        <p className={styles.emptyLine}>Nothing in trash.</p>
      ) : (
        <ul className={styles.list}>
          {notes.map((n) => {
            const confirming = confirmingDeleteId === n.id;
            const deletedLabel = n.deletedAt
              ? formatShortDate(n.deletedAt.slice(0, 10))
              : '—';
            return (
              <li key={n.id} className={styles.row}>
                <div className={styles.rowText}>
                  <Text size="md" weight="medium" as="span" className={styles.rowTitle}>
                    {n.title}
                  </Text>
                  <Text size="xs" variant="muted" className={styles.meta}>
                    Deleted {deletedLabel}
                  </Text>
                </div>
                <div className={styles.rowActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => doRestore(n.id)}
                  >
                    Restore
                  </Button>
                  {confirming ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmingDeleteId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => doDeleteForever(n.id)}
                      >
                        Yes, delete
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingDeleteId(n.id)}
                    >
                      Delete forever
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
