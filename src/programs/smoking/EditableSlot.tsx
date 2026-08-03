import { useEffect, useState } from 'react';
import { Button, TextArea } from '@shared/ui';
import { editableSlotByKey } from './editableSlots';
import { readEditableSlot, setEditableSlot } from './state';
import styles from './EditableSlot.module.css';

export interface EditableSlotProps {
  /** Slot key from EDITABLE_SLOTS. Determines default text, title, hint. */
  slotKey: string;
  /** Optional wrapper element name so the slot can render inline in a
   *  larger card layout. Defaults to a div. */
  as?: 'div' | 'span';
}

// Reusable inline editable text slot. Renders the current stored value
// with a pencil affordance; tapping opens an inline editor with the
// slot's title + hint + Save / Reset / Cancel. Persistence goes
// through personal-os/src/programs/smoking/state.ts editable-slot
// helpers.
export function EditableSlot({ slotKey, as = 'div' }: EditableSlotProps) {
  const config = editableSlotByKey(slotKey);
  const [value, setValue] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    (async () => {
      const stored = await readEditableSlot(config.key);
      if (cancelled) return;
      setValue(stored ?? config.def);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [config]);

  if (!config) return null;

  const handleOpen = () => {
    setDraft(value);
    setEditing(true);
  };
  const handleCancel = () => setEditing(false);
  const handleSave = async () => {
    setSaving(true);
    await setEditableSlot(config.key, draft);
    setValue(draft);
    setEditing(false);
    setSaving(false);
  };
  const handleReset = () => {
    setDraft(config.def);
  };

  if (!loaded) return null;
  const Wrapper = as;

  if (editing) {
    return (
      <div className={styles.editor}>
        <p className={styles.editorHint}>{config.hint}</p>
        <TextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className={styles.editorTextarea}
          label={config.title}
        />
        <div className={styles.editorActions}>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
          >
            Save
          </Button>
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Wrapper className={styles.slot}>
      <span className={styles.slotText}>{value}</span>
      <button
        type="button"
        onClick={handleOpen}
        className={styles.pencil}
        aria-label={`Edit ${config.title}`}
      >
        ✎
      </button>
    </Wrapper>
  );
}
