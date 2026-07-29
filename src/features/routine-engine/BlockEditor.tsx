import { Button, Card, TextField } from '@shared/ui';
import type { RoutineBlockType } from '@data/types/Routine';
import {
  BLOCK_DURATION_MAX,
  BLOCK_DURATION_MIN,
  BLOCK_NAME_MAX,
  BLOCK_TYPES,
  type BlockDraft,
} from './routineService';
import styles from './BlockEditor.module.css';

export interface BlockEditorProps {
  block: BlockDraft;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (updates: Partial<BlockDraft>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  errors?: Record<string, string> | undefined;
}

const TYPE_LABEL: Record<RoutineBlockType, string> = {
  focus: 'Focus',
  break: 'Break',
  ritual: 'Ritual',
};

/**
 * A single-block inline editor. Fields are updated as the user types via
 * onChange — the parent owns the draft array and persists on Save.
 */
export function BlockEditor({
  block,
  index,
  canMoveUp,
  canMoveDown,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  errors,
}: BlockEditorProps) {
  const durationValue = Number.isFinite(block.durationMinutes)
    ? String(block.durationMinutes)
    : '';

  return (
    <Card padding="md" className={styles.card} as="article" aria-label={`Block ${index + 1}`}>
      <div className={styles.header}>
        <span className={styles.index}>Block {index + 1}</span>
        <div className={styles.reorder}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move block ${index + 1} up`}
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move block ${index + 1} down`}
            title="Move down"
          >
            ↓
          </button>
        </div>
      </div>

      <TextField
        label="Name"
        value={block.label}
        onChange={(e) => onChange({ label: e.target.value })}
        maxLength={BLOCK_NAME_MAX}
        errorText={errors?.label}
        placeholder="e.g. Deep focus"
      />

      <fieldset className={styles.typeFieldset}>
        <legend className={styles.typeLegend}>Type</legend>
        <div className={styles.typeChips}>
          {BLOCK_TYPES.map((t) => (
            <label key={t} className={styles.chip}>
              <input
                type="radio"
                name={`type-${block.id ?? index}`}
                value={t}
                checked={block.type === t}
                onChange={() => onChange({ type: t })}
              />
              <span>{TYPE_LABEL[t]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.numericRow}>
        <TextField
          label="Duration (min)"
          type="number"
          inputMode="numeric"
          min={BLOCK_DURATION_MIN}
          max={BLOCK_DURATION_MAX}
          step={1}
          value={durationValue}
          onChange={(e) => {
            const parsed = Number.parseInt(e.target.value, 10);
            onChange({ durationMinutes: Number.isFinite(parsed) ? parsed : Number.NaN });
          }}
          errorText={errors?.durationMinutes}
          className={styles.duration}
        />

        <TextField
          label="Preferred time (optional)"
          type="time"
          value={block.expectedStart ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ expectedStart: v.length > 0 ? v : null });
          }}
          errorText={errors?.expectedStart}
          className={styles.time}
        />
      </div>

      <div className={styles.footer}>
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
          Delete block
        </Button>
      </div>
    </Card>
  );
}
