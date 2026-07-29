import { Button, Card, Heading, Text } from '@shared/ui';
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

/**
 * The hero surface on Today. Renders one dominant action at a time — either
 * Start (idle), Pause+Complete (in_progress), or Resume+Complete (paused).
 * Empty state (no current block) renders a calm "You're done for today" line.
 */
export function CurrentFocusCard({
  block,
  focus,
  onStart,
  onPause,
  onResume,
  onComplete,
}: CurrentFocusCardProps) {
  if (!block) {
    return (
      <Card padding="lg" className={styles.card} aria-labelledby="focus-heading">
        <Text size="sm" variant="muted" className={styles.eyebrow}>
          Today
        </Text>
        <Heading level={2} id="focus-heading" className={styles.title}>
          You&rsquo;re done for today.
        </Heading>
        <Text variant="secondary">Come back tomorrow — one day closer.</Text>
      </Card>
    );
  }

  return (
    <Card padding="lg" className={styles.card} aria-labelledby="focus-heading">
      <Text size="sm" variant="muted" className={styles.eyebrow}>
        Current focus
      </Text>
      <Heading level={2} id="focus-heading" className={styles.title}>
        {block.label}
      </Heading>
      <Text variant="secondary" className={styles.duration}>
        {block.durationMinutes} min
        {block.expectedStart ? ` · ${block.expectedStart}` : ''}
      </Text>

      <div className={styles.actions}>
        {focus === 'idle' && (
          <Button size="lg" variant="primary" fullWidth onClick={onStart}>
            Start
          </Button>
        )}
        {focus === 'in_progress' && (
          <>
            <Button size="lg" variant="secondary" onClick={onPause}>
              Pause
            </Button>
            <Button size="lg" variant="primary" onClick={onComplete}>
              Complete
            </Button>
          </>
        )}
        {focus === 'paused' && (
          <>
            <Button size="lg" variant="secondary" onClick={onResume}>
              Resume
            </Button>
            <Button size="lg" variant="primary" onClick={onComplete}>
              Complete
            </Button>
          </>
        )}
        {focus === 'completed' && (
          <Text variant="secondary" className={styles.doneLine}>
            Completed. Advancing…
          </Text>
        )}
      </div>
    </Card>
  );
}
