import { useMemo, useState } from 'react';
import { Button, Card, Heading, Text, TextField } from '@shared/ui';
import type { Routine } from '@data/types/Routine';
import { BlockEditor } from './BlockEditor';
import {
  ROUTINE_NAME_MAX,
  RoutineServiceError,
  newBlockDraft,
  routineToDraft,
  saveRoutineForActiveMission,
  validateRoutineDraft,
  type BlockDraft,
  type DraftValidationError,
  type RoutineDraft,
} from './routineService';
import styles from './RoutineBuilder.module.css';

export interface RoutineBuilderProps {
  /** Existing routine to edit — omit to build a fresh one. */
  existing?: Routine | null | undefined;
  /** Called after a successful save so callers can refresh Today. */
  onSaved: (routine: Routine) => void;
  /** Called when the user cancels; omit to force the user to save (no way out). */
  onCancel?: (() => void) | undefined;
}

/**
 * Owns the RoutineDraft, mediates add / delete / reorder / edit, and commits
 * via saveRoutineForActiveMission. No modals — every field is inline.
 *
 * Move Up / Move Down (per spec) instead of drag-and-drop; simpler code, works
 * on keyboard, works on touch, and the routine block count is small enough
 * that direct reordering is not painful.
 */
export function RoutineBuilder({ existing, onSaved, onCancel }: RoutineBuilderProps) {
  const initial: RoutineDraft = useMemo(
    () =>
      existing
        ? routineToDraft(existing)
        : { name: 'Daily routine', blocks: [newBlockDraft()] },
    [existing],
  );

  const [name, setName] = useState(initial.name);
  const [blocks, setBlocks] = useState<BlockDraft[]>(initial.blocks);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const draft: RoutineDraft = { name, blocks };
  const errors = validateRoutineDraft(draft);
  const errorByPath = errorsByPath(errors);
  const nameError = touched ? errorByPath['name'] : undefined;
  const blocksError = touched ? errorByPath['blocks'] : undefined;
  const canSave = errors.length === 0 && !saving;

  const updateBlock = (index: number, updates: Partial<BlockDraft>) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...updates } : b)),
    );
  };

  const addBlock = () => {
    setBlocks((prev) => [...prev, newBlockDraft()]);
  };

  const deleteBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, delta: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const a = next[index];
      const b = next[target];
      if (!a || !b) return prev;
      next[index] = b;
      next[target] = a;
      return next;
    });
  };

  const handleSave = () => {
    setTouched(true);
    setServerError(undefined);
    if (!canSave) return;
    setSaving(true);
    void (async () => {
      try {
        const saved = await saveRoutineForActiveMission(draft, {
          replacingRoutineId: existing?.id,
        });
        setSaving(false);
        onSaved(saved);
      } catch (e) {
        setSaving(false);
        setServerError(
          e instanceof RoutineServiceError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Save failed.',
        );
      }
    })();
  };

  return (
    <Card padding="lg" className={styles.card} as="section" aria-labelledby="builder-heading">
      <Heading level={1} id="builder-heading" className={styles.heading}>
        {existing ? 'Edit your routine' : 'Build your routine'}
      </Heading>
      <Text variant="secondary" className={styles.subheading}>
        Arrange your day. You can rearrange or edit any block later.
      </Text>

      <TextField
        label="Routine name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={ROUTINE_NAME_MAX}
        errorText={nameError}
        className={styles.nameField}
      />

      <div className={styles.blocksHeader}>
        <span className={styles.blocksLabel}>Blocks</span>
        {blocksError && (
          <span className={styles.blocksError} role="alert">
            {blocksError}
          </span>
        )}
      </div>

      <div className={styles.blocksList}>
        {blocks.map((b, i) => {
          const blockErrors = touched ? blockErrorsFor(errors, i) : undefined;
          return (
            <BlockEditor
              key={b.id ?? i}
              block={b}
              index={i}
              canMoveUp={i > 0}
              canMoveDown={i < blocks.length - 1}
              onChange={(updates) => updateBlock(i, updates)}
              onMoveUp={() => moveBlock(i, -1)}
              onMoveDown={() => moveBlock(i, 1)}
              onDelete={() => deleteBlock(i)}
              errors={blockErrors}
            />
          );
        })}
      </div>

      <div className={styles.addRow}>
        <Button type="button" variant="secondary" onClick={addBlock}>
          + Add block
        </Button>
      </div>

      {serverError && (
        <Text variant="secondary" role="alert" className={styles.serverError}>
          {serverError}
        </Text>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={touched && !canSave}
        >
          {saving ? 'Saving…' : existing ? 'Save routine' : 'Activate routine'}
        </Button>
      </div>
    </Card>
  );
}

function errorsByPath(errors: DraftValidationError[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of errors) {
    if (map[e.field] === undefined) map[e.field] = e.message;
  }
  return map;
}

function blockErrorsFor(errors: DraftValidationError[], index: number): Record<string, string> {
  const prefix = `blocks.${index}.`;
  const map: Record<string, string> = {};
  for (const e of errors) {
    if (e.field.startsWith(prefix)) {
      const key = e.field.slice(prefix.length);
      if (map[key] === undefined) map[key] = e.message;
    }
  }
  return map;
}
