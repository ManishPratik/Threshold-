import { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Card, TextArea, TextField } from '@shared/ui';
import {
  DURATION_PRESETS,
  MISSION_TITLE_MAX,
  MISSION_WHY_MAX,
  MISSION_REFUSE_MAX,
  MISSION_REWARD_MAX,
  validateDraft,
  type MissionDraft,
} from './missionContractService';
import { InspirationSection } from './InspirationSection';
import styles from './CreateMissionForm.module.css';

export interface CreateMissionFormProps {
  initialDraft?: Partial<MissionDraft> | undefined;
  onCancel?: (() => void) | undefined;
  onSubmit: (draft: MissionDraft) => void;
  /**
   * When true, the internal editorial header (kicker + serif title + subline)
   * is not rendered — used by callers (e.g. the /welcome/promise route) that
   * provide their own screen-level header and want to avoid duplicate chrome.
   * Defaults to false so existing callers keep their headers.
   */
  hideHeader?: boolean;
}

const DEFAULT_DURATION = 40;
const CUSTOM_SENTINEL = -1;

// Hand-authored seed lines shown only when the user opens "Need inspiration?".
// Never AI-generated. Selecting a line copies it into the field — the user is
// expected to edit; the app does not write the contract for them.
const PROMISE_EXAMPLES = [
  'I will not smoke.',
  'I will write for 20 minutes before opening anything else.',
  'I will walk for 30 minutes every morning.',
  'I will meditate for 15 minutes.',
  'I will read before bed.',
] as const;

const WHY_NOW_EXAMPLES = [
  "I'm tired of starting over.",
  "I don't want cigarettes deciding my day anymore.",
  'I’ve spent years saying “tomorrow.”',
  'I want to become someone I respect.',
  "I've had enough.",
] as const;

const REFUSE_EXAMPLES = [
  'My health.',
  'My freedom.',
  'My self-respect.',
  'My family.',
  'My confidence.',
  "The future I'm building.",
] as const;

const HONOUR_EXAMPLES = [
  "I'll take a weekend trip.",
  "I'll buy the book I've wanted.",
  "I'll spend the day with my family.",
  "I'll frame this promise.",
  "I'll donate to a cause I care about.",
] as const;

export function CreateMissionForm({ initialDraft, onCancel, onSubmit, hideHeader = false }: CreateMissionFormProps) {
  const [title, setTitle] = useState(initialDraft?.title ?? '');
  const [why, setWhy] = useState(initialDraft?.why ?? '');
  const [refuseToLose, setRefuseToLose] = useState(initialDraft?.refuseToLose ?? '');
  const [reward, setReward] = useState(initialDraft?.reward ?? '');

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

  // Strict accordion: at most one inspiration panel expanded at a time across
  // the whole form. Passing setOpenInspiration down means opening any panel
  // implicitly closes the previously open one.
  const [openInspiration, setOpenInspiration] = useState<string | null>(null);

  // Refs so selecting an inspiration example can return keyboard focus to the
  // linked input, place the cursor at the end, and scroll the field back into
  // comfortable view on mobile (Phase 2, refinement #4 + #8).
  const promiseRef = useRef<HTMLInputElement>(null);
  const whyRef = useRef<HTMLTextAreaElement>(null);
  const refuseRef = useRef<HTMLInputElement>(null);
  const honourRef = useRef<HTMLInputElement>(null);

  const returnFocusAndCursor = useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement | null) => {
      if (!el) return;
      // Defer to the next frame so React has flushed the new value into the
      // DOM before we read length + set selection.
      requestAnimationFrame(() => {
        el.focus({ preventScroll: true });
        const len = el.value.length;
        try { el.setSelectionRange(len, len); } catch { /* number/email inputs reject */ }
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    },
    [],
  );

  const handlePromiseSelect = useCallback(
    (ex: string) => { setTitle(ex); returnFocusAndCursor(promiseRef.current); },
    [returnFocusAndCursor],
  );
  const handleWhySelect = useCallback(
    (ex: string) => { setWhy(ex); returnFocusAndCursor(whyRef.current); },
    [returnFocusAndCursor],
  );
  const handleRefuseSelect = useCallback(
    (ex: string) => { setRefuseToLose(ex); returnFocusAndCursor(refuseRef.current); },
    [returnFocusAndCursor],
  );
  const handleHonourSelect = useCallback(
    (ex: string) => { setReward(ex); returnFocusAndCursor(honourRef.current); },
    [returnFocusAndCursor],
  );

  const durationDays =
    durationChoice === CUSTOM_SENTINEL ? Number.parseInt(customDuration, 10) : durationChoice;

  const draft: MissionDraft = useMemo(
    () => ({
      title,
      why,
      refuseToLose,
      reward: reward.trim() === '' ? undefined : reward,
      durationDays: Number.isFinite(durationDays) ? durationDays : 0,
    }),
    [title, why, refuseToLose, reward, durationDays],
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
    <Card padding="lg" className={styles.card} as="section" {...(hideHeader ? {} : { 'aria-labelledby': 'create-heading' })}>
      {!hideHeader && (
        <div className={styles.header}>
          <p className={styles.kicker}>The contract</p>
          <h1 id="create-heading" className={styles.heading}>
            Your mission<span className={styles.punct}>.</span>
          </h1>
          <p className={styles.subheading}>
            A promise, not a to-do. You will see this every day.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* 1. Promise — the immutable core of the contract. */}
        <div className={styles.section}>
          <TextField
            ref={promiseRef}
            label="What promise are you making?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MISSION_TITLE_MAX}
            autoComplete="off"
            errorText={touched ? errorByField.title : undefined}
            placeholder="I will..."
            helperText="Small enough to keep on your worst day. Meaningful enough to matter on your best."
          />
          <InspirationSection
            panelId="promise"
            openId={openInspiration}
            onToggle={setOpenInspiration}
            examples={PROMISE_EXAMPLES}
            onSelect={handlePromiseSelect}
          />
        </div>

        {/* 2. Why now — the change moment behind the promise. */}
        <div className={styles.section}>
          <TextArea
            ref={whyRef}
            label="Why now?"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            maxLength={MISSION_WHY_MAX}
            rows={4}
            errorText={touched ? errorByField.why : undefined}
            placeholder="Today I'm choosing this because..."
            helperText="What changed? Why is today different from every other day?"
          />
          <InspirationSection
            panelId="why"
            openId={openInspiration}
            onToggle={setOpenInspiration}
            examples={WHY_NOW_EXAMPLES}
            onSelect={handleWhySelect}
          />
        </div>

        {/* 3. Refusing to lose — the anchor for hard days. */}
        <div className={styles.section}>
          <TextField
            ref={refuseRef}
            label="What are you refusing to lose?"
            value={refuseToLose}
            onChange={(e) => setRefuseToLose(e.target.value)}
            maxLength={MISSION_REFUSE_MAX}
            autoComplete="off"
            errorText={touched ? errorByField.refuseToLose : undefined}
            placeholder="I refuse to lose..."
            helperText="When this becomes difficult, this is what you're protecting."
          />
          <InspirationSection
            panelId="refuse"
            openId={openInspiration}
            onToggle={setOpenInspiration}
            examples={REFUSE_EXAMPLES}
            onSelect={handleRefuseSelect}
          />
        </div>

        {/* 4. Duration — kept intact from V1. */}
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

        {/* 5. Honour — celebration, not commitment. Visually detached below
             the four contract sections so it reads as an addendum, not part
             of what the user is promising. */}
        <div className={styles.optionalBlock}>
          <div className={styles.optionalHeader}>
            <span className={styles.optionalDivider} aria-hidden="true" />
            <span className={styles.optionalLabel}>Optional</span>
            <span className={styles.optionalDivider} aria-hidden="true" />
          </div>
          <div className={styles.section}>
            <TextField
              ref={honourRef}
              label="How will you honour yourself when this promise is complete?"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              maxLength={MISSION_REWARD_MAX}
              autoComplete="off"
              errorText={touched ? errorByField.reward : undefined}
              placeholder="When I complete this..."
              helperText="This isn't a bribe. It's how you'll celebrate becoming the person you wanted to become."
            />
            <InspirationSection
              panelId="honour"
              openId={openInspiration}
              onToggle={setOpenInspiration}
              examples={HONOUR_EXAMPLES}
              onSelect={handleHonourSelect}
            />
          </div>
        </div>

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
