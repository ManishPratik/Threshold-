import { useEffect, useState } from 'react';
import type { Note } from '@data/types/frozen/Note';
import type { Principle } from '@data/types/Principle';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import {
  computeDayNumber,
  humanDate,
  humanDateTime,
  totalDaysBetween,
} from '@shared/lib/date';
import { currentLogicalDate, getLogicalDate } from '@shared/lib/dayBoundary';
import {
  NOTE_MAX_LENGTH,
  NoteService,
  PromiseService,
  useSubmitOnce,
} from '@features/frozen';
import { BreakPromiseDialog } from './BreakPromiseDialog';
import styles from './FrozenPromiseDetailPage.module.css';

const NOTE_COUNTER_THRESHOLD = 900;

export interface FrozenPromiseDetailPageProps {
  promiseId: string;
  /** Fires after a Break Promise action commits. */
  onBroken: (() => void) | undefined;
  /** Fires when the user taps the recovery link on the not-found state. */
  onReturn?: () => void;
}

interface DatesTodayLine {
  text: string;
  kind: 'active' | 'kept' | 'broken';
}

/**
 * Frozen Promise Detail screen. Long-scroll single-column reading
 * surface. Loads one Promise and its Notes. Every contract field
 * (title, why, stake, principles, honour, dates) is rendered read-only.
 * Notes are the only editable region. Break-this-promise sits at the
 * bottom as a warning text link that opens the Break dialog.
 */
export function FrozenPromiseDetailPage({
  promiseId,
  onBroken,
  onReturn,
}: FrozenPromiseDetailPageProps) {
  const [loading, setLoading] = useState(true);
  const [promise, setPromise] = useState<PromiseRecord | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadError, setLoadError] = useState<string>('');
  const [breakOpen, setBreakOpen] = useState(false);

  useEffect(() => {
    const promiseService = new PromiseService();
    const noteService = new NoteService();
    let cancelled = false;

    (async () => {
      try {
        const [p, ns] = await Promise.all([
          promiseService.getPromiseById(promiseId),
          noteService.listNotesForPromise(promiseId),
        ]);
        if (cancelled) return;
        setPromise(p ?? null);
        setNotes(ns);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load Promise.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [promiseId]);

  if (loading) {
    return <p className={styles.loading}>Loading.</p>;
  }
  if (!promise) {
    return (
      <div className={styles.notFoundStack}>
        <h1 className={styles.notFoundHero}>Promise not found.</h1>
        <p className={styles.notFoundSubtitle}>
          The Promise you were looking for isn&apos;t here. It may have been
          erased.
        </p>
        {onReturn ? (
          <button
            type="button"
            className={styles.notFoundLink}
            onClick={onReturn}
          >
            Return to History.
          </button>
        ) : null}
        {loadError ? (
          <p className={styles.error} role="alert">
            {loadError}
          </p>
        ) : null}
      </div>
    );
  }

  const isTerminated =
    promise.brokenAt !== undefined || promise.completedAt !== undefined;

  return (
    <div className={styles.column}>
      <h1 className={styles.title} title={promise.title}>{promise.title}</h1>

      <WhyBlock why={promise.why} />
      <StakeBlock stake={promise.stake} />
      <PrinciplesList principles={promise.principles} />
      {promise.honour !== undefined ? (
        <HonourBlock honour={promise.honour} />
      ) : null}
      <DatesBlock promise={promise} />

      <NotesSection
        promiseId={promiseId}
        notes={notes}
        onChange={setNotes}
        readOnly={isTerminated}
      />

      {!isTerminated ? (
        <div className={styles.breakRow}>
          <button
            type="button"
            className={styles.warningTextLink}
            onClick={() => setBreakOpen(true)}
          >
            Break this promise.
          </button>
        </div>
      ) : null}

      <BreakPromiseDialog
        open={breakOpen}
        promise={promise}
        onBroken={() => {
          setBreakOpen(false);
          if (onBroken) onBroken();
        }}
        onCancel={() => setBreakOpen(false)}
      />

      {loadError ? (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}

function WhyBlock({ why }: { why: string }) {
  return (
    <section className={styles.section} aria-label="Why now">
      <p className={styles.eyebrow}>Why now</p>
      <p className={styles.reading}>{why}</p>
    </section>
  );
}

function StakeBlock({ stake }: { stake: string }) {
  return (
    <section className={styles.section} aria-label="What you refuse to lose">
      <p className={styles.eyebrow}>What you refuse to lose</p>
      <p className={styles.reading}>{stake}</p>
    </section>
  );
}

function PrinciplesList({ principles }: { principles: readonly Principle[] }) {
  if (principles.length === 0) return null;
  return (
    <section className={styles.section} aria-label="Principles">
      <p className={styles.eyebrow}>Principles</p>
      <ul className={styles.principlesList}>
        {principles.map((p) => (
          <li key={p.id}>{p.text}</li>
        ))}
      </ul>
    </section>
  );
}

function HonourBlock({ honour }: { honour: string }) {
  return (
    <section className={styles.section} aria-label="Your honour on keeping this">
      <p className={styles.eyebrow}>Your honour on keeping this</p>
      <p className={styles.reading}>{honour}</p>
    </section>
  );
}

function DatesBlock({ promise }: { promise: PromiseRecord }) {
  const today = describeToday(promise);
  const todayClass =
    today.kind === 'kept'
      ? `${styles.datesToday} ${styles.datesTodayKept}`
      : today.kind === 'broken'
        ? `${styles.datesToday} ${styles.datesTodayBroken}`
        : styles.datesToday;
  return (
    <section className={styles.section} aria-label="Dates">
      <p className={styles.eyebrow}>Dates</p>
      <p className={styles.datesRange}>
        {humanDate(promise.startDate)} – {humanDate(promise.endDate)}
      </p>
      <p className={todayClass}>{today.text}</p>
    </section>
  );
}

function describeToday(promise: PromiseRecord): DatesTodayLine {
  const total = totalDaysBetween(promise.startDate, promise.endDate);
  if (promise.completedAt !== undefined) {
    return {
      kind: 'kept',
      text: `Kept through — Day ${total} of ${total}`,
    };
  }
  if (promise.brokenAt !== undefined) {
    const endedDay = computeEndedDay(promise);
    const suffix = endedDay !== undefined ? ` on Day ${endedDay}` : '';
    const kind =
      promise.brokenKind === 'broken-by-choice'
        ? 'broken by choice'
        : 'broken';
    return { kind: 'broken', text: `Ended${suffix} — ${kind}` };
  }
  const today = currentLogicalDate();
  const dayN = computeDayNumber(promise.startDate, today);
  const clamped = Math.min(Math.max(dayN, 0), total);
  return { kind: 'active', text: `Day ${clamped} of ${total}` };
}

function computeEndedDay(promise: PromiseRecord): number | undefined {
  if (promise.brokenAt === undefined) return undefined;
  const brokenAt = new Date(promise.brokenAt);
  if (Number.isNaN(brokenAt.getTime())) return undefined;
  const brokenLogicalDate = getLogicalDate(brokenAt);
  const day = computeDayNumber(promise.startDate, brokenLogicalDate);
  return day > 0 ? day : undefined;
}

function NotesSection({
  promiseId,
  notes,
  onChange,
  readOnly,
}: {
  promiseId: string;
  notes: readonly Note[];
  onChange: (next: Note[]) => void;
  readOnly: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <section className={styles.notesSection} aria-label="Notes">
      <p className={styles.eyebrow}>Notes</p>

      {!readOnly && !addingNew && editingId === null ? (
        <div className={styles.addNoteRow}>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => setAddingNew(true)}
          >
            Add a note.
          </button>
        </div>
      ) : null}

      {addingNew ? (
        <NoteEditor
          initialText=""
          onSave={async (text) => {
            const service = new NoteService();
            const created = await service.createNote(promiseId, text);
            onChange([...notes, created]);
            setAddingNew(false);
          }}
          onCancel={() => setAddingNew(false)}
          onDelete={undefined}
        />
      ) : null}

      {notes.length > 0 ? (
        <ul className={styles.notesList}>
          {notes.map((note) => {
            if (editingId === note.id) {
              return (
                <li key={note.id} className={styles.noteItem}>
                  <NoteEditor
                    initialText={note.text}
                    onSave={async (text) => {
                      const service = new NoteService();
                      const updated = await service.updateNote(note.id, text);
                      onChange(
                        notes.map((n) => (n.id === note.id ? updated : n)),
                      );
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                    onDelete={async () => {
                      const service = new NoteService();
                      await service.deleteNote(note.id);
                      onChange(notes.filter((n) => n.id !== note.id));
                      setEditingId(null);
                    }}
                  />
                </li>
              );
            }
            return (
              <li key={note.id} className={styles.noteItem}>
                <p className={styles.noteText}>{note.text}</p>
                <p className={styles.noteMeta}>
                  {humanDateTime(note.updatedAt)}
                </p>
                {!readOnly ? (
                  <div className={styles.noteActions}>
                    <button
                      type="button"
                      className={styles.noteMiniLink}
                      onClick={() => setEditingId(note.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`${styles.noteMiniLink} ${styles.noteMiniLinkWarning}`}
                      onClick={() => setDeletingId(note.id)}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
                {deletingId === note.id ? (
                  <DeleteNoteConfirm
                    onConfirm={async () => {
                      const service = new NoteService();
                      await service.deleteNote(note.id);
                      onChange(notes.filter((n) => n.id !== note.id));
                      setDeletingId(null);
                    }}
                    onCancel={() => setDeletingId(null)}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function NoteEditor({
  initialText,
  onSave,
  onCancel,
  onDelete,
}: {
  initialText: string;
  onSave: (text: string) => Promise<void>;
  onCancel: () => void;
  onDelete: (() => Promise<void>) | undefined;
}) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string>('');
  const saveGuard = useSubmitOnce();
  const deleteGuard = useSubmitOnce();

  const overLimit = text.trim().length > NOTE_MAX_LENGTH;
  const empty = text.trim().length === 0;
  const showCounter = text.length >= NOTE_COUNTER_THRESHOLD;

  const handleSave = async () => {
    setError('');
    try {
      await saveGuard.submit(() => onSave(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setError('');
    try {
      await deleteGuard.submit(() => onDelete());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
    }
  };

  return (
    <div className={styles.editor}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Note text"
        className={styles.textarea}
      />
      {showCounter ? (
        <p
          className={
            overLimit
              ? `${styles.counter} ${styles.counterOver}`
              : styles.counter
          }
          aria-live="polite"
        >
          {text.trim().length} / {NOTE_MAX_LENGTH}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.editorActions}>
        {onDelete ? (
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => {
              void handleDelete();
            }}
            disabled={saveGuard.pending || deleteGuard.pending}
          >
            Delete
          </button>
        ) : null}
        <button
          type="button"
          className={styles.secondary}
          onClick={onCancel}
          disabled={saveGuard.pending || deleteGuard.pending}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => {
            void handleSave();
          }}
          disabled={saveGuard.pending || deleteGuard.pending || empty || overLimit}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function DeleteNoteConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const guard = useSubmitOnce();
  const [error, setError] = useState<string>('');

  const handleConfirm = async () => {
    setError('');
    try {
      await guard.submit(() => onConfirm());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
    }
  };

  return (
    <div className={styles.deleteConfirm}>
      <p className={styles.deleteConfirmText}>Delete this note?</p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.deleteConfirmActions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={onCancel}
          disabled={guard.pending}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => {
            void handleConfirm();
          }}
          disabled={guard.pending}
        >
          Delete note.
        </button>
      </div>
    </div>
  );
}
