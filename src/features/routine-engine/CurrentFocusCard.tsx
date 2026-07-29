import { useEffect } from 'react';
import { Button, Card, Heading, Text, ArrowRightGlyph, PlayGlyph, PauseGlyph, CheckGlyph } from '@shared/ui';
import type { RoutineBlock } from '@data/types/Routine';
import type { FocusState } from './focusState';
import styles from './CurrentFocusCard.module.css';

export interface CurrentFocusCardProps {
  block: RoutineBlock | null;
  focus: FocusState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
}

const EYEBROW: Record<FocusState, string> = {
  idle: 'Ready when you are',
  in_progress: 'In progress',
  paused: 'Paused',
  completed: 'Completed',
};

/** CTA label per block type — matches the noun the user is starting. */
function startVerb(type: RoutineBlock['type']): string {
  if (type === 'focus') return 'Start focus';
  if (type === 'break') return 'Start break';
  return 'Begin ritual';
}

/**
 * The hero surface on Today. Renders one dominant action at a time — either
 * Start (idle), Pause+Complete (in_progress), or Resume+Complete (paused).
 * Empty state (no current block) renders a calm "You're done for today" line.
 *
 * Keyboard shortcut: Space triggers the primary action for the current focus
 * state (Start when idle, Resume when paused). Ignored when the user is typing
 * in an input / textarea / contenteditable so we never steal a real keystroke.
 */
export function CurrentFocusCard({
  block,
  focus,
  onStart,
  onPause,
  onResume,
  onComplete,
}: CurrentFocusCardProps) {
  useEffect(() => {
    if (!block) return;
    if (focus !== 'idle' && focus !== 'paused') return;
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }
      e.preventDefault();
      if (focus === 'idle') onStart();
      else onResume();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [block, focus, onStart, onResume]);

  if (!block) {
    return (
      <Card padding="lg" className={`${styles.card} ${styles.doneCard}`} aria-labelledby="focus-heading">
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Today</span>
          <Heading level={2} id="focus-heading" className={styles.title}>
            You&rsquo;re done for today.
          </Heading>
          <Text variant="secondary" className={styles.subline}>
            Come back tomorrow — one day closer.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" className={styles.card} aria-labelledby="focus-heading">
      <div className={styles.hero}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {EYEBROW[focus]}
          </span>
        </div>
        <Heading level={2} id="focus-heading" className={styles.title}>
          {block.label}
        </Heading>
        <Text variant="secondary" className={styles.meta}>
          <span>{block.durationMinutes} min</span>
          <span className={styles.metaDot} aria-hidden="true" />
          <span className={styles.metaType}>{prettyType(block.type)}</span>
          {block.expectedStart ? (
            <>
              <span className={styles.metaDot} aria-hidden="true" />
              <span>Scheduled {block.expectedStart}</span>
            </>
          ) : null}
        </Text>

        <div className={styles.actions}>
          {focus === 'idle' && (
            <>
              <Button size="lg" variant="primary" onClick={onStart} className={styles.ctaPrimary}>
                <PlayGlyph size="sm" decorative />
                {startVerb(block.type)}
                <ArrowRightGlyph size="sm" decorative />
              </Button>
              <span className={styles.kbdHint} aria-hidden="true">
                <span className={styles.kbd}>Space</span>
                to start
              </span>
            </>
          )}
          {focus === 'in_progress' && (
            <>
              <Button size="lg" variant="secondary" onClick={onPause} className={styles.ctaSecondary}>
                <PauseGlyph size="sm" decorative />
                Pause
              </Button>
              <Button size="lg" variant="primary" onClick={onComplete} className={styles.ctaPrimary}>
                <CheckGlyph size="sm" decorative />
                Complete
              </Button>
            </>
          )}
          {focus === 'paused' && (
            <>
              <Button size="lg" variant="secondary" onClick={onResume} className={styles.ctaSecondary}>
                <PlayGlyph size="sm" decorative />
                Resume
              </Button>
              <Button size="lg" variant="primary" onClick={onComplete} className={styles.ctaPrimary}>
                <CheckGlyph size="sm" decorative />
                Complete
              </Button>
              <span className={styles.kbdHint} aria-hidden="true">
                <span className={styles.kbd}>Space</span>
                to resume
              </span>
            </>
          )}
          {focus === 'completed' && (
            <Text variant="secondary" className={styles.doneLine}>
              Completed. Advancing…
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
}

function prettyType(t: RoutineBlock['type']): string {
  if (t === 'focus') return 'Focus block';
  if (t === 'break') return 'Break';
  return 'Ritual';
}
