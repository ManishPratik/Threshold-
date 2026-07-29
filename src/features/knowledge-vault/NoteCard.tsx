import { Button, Card, Heading, Text } from '@shared/ui';
import type { Note } from '@data/types/Note';
import { formatShortDate } from '@shared/lib/date';
import styles from './NoteCard.module.css';

export interface NoteCardProps {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}

const BODY_SNIPPET_LENGTH = 180;

function snippet(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length <= BODY_SNIPPET_LENGTH) return trimmed;
  return trimmed.slice(0, BODY_SNIPPET_LENGTH) + '…';
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const updatedDate = note.updatedAt.slice(0, 10);
  return (
    <Card padding="md" className={styles.card} as="article" aria-labelledby={`note-${note.id}`}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Heading
            level={2}
            visualLevel={4}
            id={`note-${note.id}`}
            className={styles.title}
          >
            {note.title}
          </Heading>
          <Text size="xs" variant="muted" className={styles.meta}>
            Updated {formatShortDate(updatedDate)}
          </Text>
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      {note.body.trim().length > 0 && (
        <Text size="sm" variant="secondary" className={styles.snippet}>
          {snippet(note.body)}
        </Text>
      )}

      {note.tags.length > 0 && (
        <ul className={styles.tags}>
          {note.tags.map((t) => (
            <li key={t} className={styles.tag}>
              {t}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
