import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Heading, Text } from '@shared/ui';
import { ModalShell } from '@features/frozen';
import {
  BREATH_CYCLE,
  buildSurfedEntry,
  CARR_LINES,
  countSurfed,
  CRAVING_PAUSE_SECONDS,
  CRAVING_TRIGGERS,
  formatCountdown,
  isKnownTrigger,
  pickCarrLine,
  type CravingEntry,
  type CravingStage,
} from './craving';
import { appendCravingEntry } from './state';
import styles from './CravingSOSOverlay.module.css';

export interface CravingSOSOverlayProps {
  onClose: () => void;
  /** Fires whenever the log changes so a parent counter can refresh
   *  without a re-fetch. Called with the new full log oldest-first. */
  onLogChanged?: (log: CravingEntry[]) => void;
}

// The overlay component mounts only while the FAB is pressed; the
// caller unmounts on onClose so the reset-on-open state is expressed
// as useState defaults rather than a state-reset effect. Constants
// (stages, breath cycle, trigger set, copy) are defined in
// personal-os/src/programs/smoking/craving.ts with file:line
// citations back to the Threshold source.
export function CravingSOSOverlay({
  onClose,
  onLogChanged,
}: CravingSOSOverlayProps) {
  const initialCarr = useMemo(() => pickCarrLine(), []);
  const initialFallback = CARR_LINES[0] ?? '';
  const [stage, setStage] = useState<CravingStage>('idle');
  const [secondsLeft, setSecondsLeft] = useState<number>(
    CRAVING_PAUSE_SECONDS,
  );
  const [cycleIdx, setCycleIdx] = useState<number>(0);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [totalSurfed, setTotalSurfed] = useState<number>(0);
  const [carrLine] = useState<string>(initialCarr || initialFallback);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (stage !== 'timer') {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const step = BREATH_CYCLE[cycleIdx % BREATH_CYCLE.length];
    if (!step) return;
    const stepSeconds = step.ms / 1000;
    timerRef.current = window.setTimeout(() => {
      const nextSeconds = secondsLeft - stepSeconds;
      if (nextSeconds <= 0) {
        setStage('trigger');
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(nextSeconds);
      setCycleIdx((i) => i + 1);
    }, step.ms);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [stage, cycleIdx, secondsLeft]);

  const currentStep = useMemo(
    () => BREATH_CYCLE[cycleIdx % BREATH_CYCLE.length],
    [cycleIdx],
  );

  const canLog = selectedTrigger !== null && isKnownTrigger(selectedTrigger);

  const handleStart = () => {
    setStage('timer');
    setSecondsLeft(CRAVING_PAUSE_SECONDS);
    setCycleIdx(0);
  };
  const handleSkip = () => setStage('trigger');
  const handleAbort = () => setStage('trigger');

  const handleLogIt = async () => {
    if (!selectedTrigger || !isKnownTrigger(selectedTrigger)) return;
    const entry = buildSurfedEntry(selectedTrigger);
    const nextLog = await appendCravingEntry(entry);
    setTotalSurfed(countSurfed(nextLog));
    if (onLogChanged) onLogChanged(nextLog);
    setStage('done');
  };

  return (
    <ModalShell open={true} label="Craving SOS">
      <div className={styles.sheet}>
        <button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close Craving SOS"
        >
          ×
        </button>

        {stage === 'idle' ? (
          <div>
            <Heading level={2} className={styles.title}>
              This is the little monster.
            </Heading>
            <Text variant="secondary" className={styles.sub}>
              {carrLine}
            </Text>
            <div className={styles.vision}>
              <p className={styles.visionLead}>
                Physiological sigh — fastest way down
              </p>
              <p className={styles.visionBody}>
                Double inhale through the nose, long slow exhale through the
                mouth. Repeat for 3 minutes.
              </p>
            </div>
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="lg"
                type="button"
                onClick={handleStart}
              >
                Start 3-minute sigh
              </Button>
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={handleSkip}
              >
                Skip — just log the trigger
              </Button>
            </div>
          </div>
        ) : null}

        {stage === 'timer' ? (
          <div>
            <Heading level={2} className={styles.title}>
              {currentStep?.label ?? 'Breathe.'}
            </Heading>
            <Text variant="secondary" className={styles.sub}>
              {formatCountdown(secondsLeft)}
            </Text>
            <div
              className={`${styles.wave} ${
                currentStep ? styles[`wave_${currentStep.cls}`] : ''
              }`}
              aria-hidden="true"
            />
            <div className={styles.actions}>
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={handleAbort}
              >
                Stop early
              </Button>
            </div>
          </div>
        ) : null}

        {stage === 'trigger' ? (
          <div>
            <Heading level={2} className={styles.title}>
              What set it off?
            </Heading>
            <Text variant="secondary" className={styles.sub}>
              One tap. This is for you — not judgment. Patterns come from data.
            </Text>
            <div className={styles.triggerGrid}>
              {CRAVING_TRIGGERS.map((t) => {
                const selected = selectedTrigger === t.slug;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    className={`${styles.triggerButton} ${
                      selected ? styles.triggerButtonSelected : ''
                    }`}
                    onClick={() => setSelectedTrigger(t.slug)}
                    aria-pressed={selected}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="lg"
                type="button"
                onClick={() => {
                  void handleLogIt();
                }}
                disabled={!canLog}
              >
                Log it
              </Button>
            </div>
          </div>
        ) : null}

        {stage === 'done' ? (
          <div>
            <Heading level={2} className={styles.title}>
              Logged. It passed.
            </Heading>
            <Text variant="secondary" className={styles.sub}>
              Total cravings surfed:{' '}
              <strong className={styles.doneCount}>{totalSurfed}</strong>. Each
              one is a time the little monster asked, and you watched it leave
              without feeding it.
            </Text>
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="lg"
                type="button"
                onClick={onClose}
              >
                Back to Today
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
