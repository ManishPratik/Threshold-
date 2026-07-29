import { useMemo, useState } from 'react';
import { Button, Card, Heading, Text, TextArea, TextField } from '@shared/ui';
import {
  DURATION_PRESETS,
  MISSION_TITLE_MAX,
  MISSION_WHY_MAX,
  validateDraft,
  type MissionDraft,
} from './missionContractService';
import styles from './CreateMissionForm.module.css';

export interface CreateMissionFormProps {
  initialDraft?: Partial<MissionDraft> | undefined;
  onCancel?: (() => void) | undefined;
  onSubmit: (draft: MissionDraft) => void;
}

const DEFAULT_DURATION = 40;
const CUSTOM_SENTINEL = -1;

export function CreateMissionForm({ initialDraft, onCancel, onSubmit }: CreateMissionFormProps) {
  const [title, setTitle] = useState(initialDraft?.title ?? '');
  const [why, setWhy] = useState(initialDraft?.why ?? '');
  const [durationChoice, setDurationChoice] = useState<number>(() => {
    const initial = initialDraft?.durationDays;
    if (typeof initial === 'number') {
      return (DURATION_PRESETS as readonly number[]).includes(initial) ? initial : CUSTOM_SENTINEL;
    }
    return DEFAULT_DURATION;
  });
  const [customDuration, setCustomDuration] = useState<string>(() => {
    const initial = initialDraft?.durationDays;
    if (typeof initial === 'number' && !(DURATION_PRESETS as readonly number[]).includes(initial)) {
      return String(initial);
    }
    return '';
  });
  const [touched, setTouched] = useState(false);

  const durationDays =
    durationChoice === CUSTOM_SENTINEL ? Number.parseInt(customDuration, 10) : durationChoice;

  const draft: MissionDraft = useMemo(
    () => ({ title, why, durationDays: Number.isFinite(durationDays) ? durationDays : 0 }),
    [title, why, durationDays],
  );

  const errors = validateDraft(draft);
  const errorByField = Object.fromEntries(errors.map((e) => [e.field, e.message]));

  const canSubmit = errors.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (canSubmit) onSubmit(draft);
  };

  return (
    <Card padding="lg" className={styles.card} as="section" aria-labelledby="create-heading">
      <Heading level={1} id="create-heading" className={styles.heading}>
        Your mission
      </Heading>
      <Text variant="secondary" className={styles.subheading}>
        A promise, not a to-do. You will see this every day.
      </Text>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <TextField
          label="Mission"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MISSION_TITLE_MAX}
          autoComplete="off"
          errorText={touched ? errorByField.title : undefined}
          placeholder="e.g. 40-Day Discipline"
        />

        <TextArea
          label="Why this matters"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          maxLength={MISSION_WHY_MAX}
          rows={4}
          errorText={touched ? errorByField.why : undefined}
          helperText="You will read this every morning. Write it for future-you."
        />

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Duration</legend>
          <div className={styles.durationGrid}>
            {DURATION_PRESETS.map((d) => (
              <label key={d} className={styles.chip}>
                <input
                  type="radio"
                  name="duration"
                  value={d}
                  checked={durationChoice === d}
                  onChange={() => setDurationChoice(d)}
                />
                <span>{d} days</span>
              </label>
            ))}
            <label className={styles.chip}>
              <input
                type="radio"
                name="duration"
                value="custom"
                checked={durationChoice === CUSTOM_SENTINEL}
                onChange={() => setDurationChoice(CUSTOM_SENTINEL)}
              />
              <span>Custom</span>
            </label>
          </div>

          {durationChoice === CUSTOM_SENTINEL && (
            <TextField
              label="Custom duration (days)"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              step={1}
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              errorText={touched ? errorByField.durationDays : undefined}
              className={styles.customInput}
            />
          )}
        </fieldset>

        <div className={styles.actions}>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" size="lg" disabled={touched && !canSubmit}>
            Review contract
          </Button>
        </div>
      </form>
    </Card>
  );
}
