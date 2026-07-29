import { useMemo, useState } from 'react';
import { Button, Card, Heading, TextArea, TextField } from '@shared/ui';
import type { Note } from '@data/types/Note';
import {
  KnowledgeServiceError,
  NOTE_BODY_MAX,
  NOTE_TITLE_MAX,
  parseTagsInput,
  saveNote,
  validateNoteDraft,
  type NoteDraft,
} from './knowledgeService';
import styles from './NoteEditor.module.css';

export interface NoteEditorProps {
  existing?: Note | null | undefined;
  onSaved: (note: Note) => void;
  onCancel: () => void;
}

/**
 * Create + edit share one form. Same UX pattern as the mission and routine
 * flows: inline validation on Save attempt, service-side re-validation ensures
 * the domain rule is enforced regardless of what the form allowed through.
 */
export function NoteEditor({ existing, onSaved, onCancel }: NoteEditorProps) {
  const initialTags = useMemo(() => (existing?.tags ?? []).join(', '), [existing]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [tagsInput, setTagsInput] = useState(initialTags);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const draft: NoteDraft = { title, body, tags: parseTagsInput(tagsInput) };
  const errors = validateNoteDraft(draft);
  const errorByField = Object.fromEntries(errors.map((e) => [e.field, e.message]));
  const canSave = errors.length === 0 && !saving;

  const handleSave = () => {
    setTouched(true);
    setServerError(undefined);
    if (!canSave) return;
    setSaving(true);
    void (async () => {
      try {
        const saved = await saveNote(draft, { replacingNoteId: existing?.id });
        setSaving(false);
        onSaved(saved);
      } catch (e) {
        setSaving(false);
        setServerError(
          e instanceof KnowledgeServiceError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Save failed.',
        );
      }
    })();
  };

  return (
    <Card padding="lg" className={styles.card} as="section" aria-labelledby="editor-heading">
      <Heading level={1} id="editor-heading" className={styles.heading}>
        {existing ? 'Edit note' : 'New note'}
      </Heading>

      <div className={styles.form}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={NOTE_TITLE_MAX}
          errorText={touched ? errorByField['title'] : undefined}
          placeholder="e.g. Read Deep Work"
        />

        <TextArea
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={NOTE_BODY_MAX}
          rows={10}
          errorText={touched ? errorByField['body'] : undefined}
          helperText="Optional. Long-form thinking lives here."
        />

        <TextField
          label="Tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          errorText={touched ? errorByField['tags'] : undefined}
          helperText="Comma-separated. Case doesn't matter."
          placeholder="reading, focus"
        />

        {serverError && (
          <p className={styles.serverError} role="alert">
            {serverError}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={touched && !canSave}
          >
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Create note'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
