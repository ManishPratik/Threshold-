import { Card, Heading, Text } from '@shared/ui';
import type { TodayProgress } from './getCurrentBlock';
import styles from './CurrentFocusCard.module.css';

export interface CurrentFocusCardProps {
  progress: TodayProgress;
}

/**
 * Passive hero surface showing "what to do next" on Today. Adapted from tag
 * v1.0.0 (routine-engine folder) which paired the hero with a Start/Pause/
 * Complete FSM. The FSM (focusReducer at
 * personal-os/src/features/routine-engine/focusState.ts) remains available;
 * its interactive rendering is deferred so this surface does not compete
 * with the existing RoutineStrip toggle at
 * personal-os/src/routes/frozen/today/FrozenTodayPage.tsx lines 271-327.
 *
 * When every block is complete the copy is preserved verbatim from v1.0.0:
 * "You're done for today. Come back tomorrow — one day closer."
 */
export function CurrentFocusCard({ progress }: CurrentFocusCardProps) {
  const { currentBlock } = progress;

  if (!currentBlock) {
    return (
      <Card
        padding="lg"
        className={`${styles.card} ${styles.doneCard}`}
        aria-labelledby="focus-heading"
      >
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
    <Card
      padding="lg"
      className={styles.card}
      aria-labelledby="focus-heading"
    >
      <div className={styles.hero}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            Now
          </span>
        </div>
        <Heading level={2} id="focus-heading" className={styles.title}>
          {currentBlock.name}
        </Heading>
        <Text variant="secondary" className={styles.meta}>
          {currentBlock.durationMinutes} min · {currentBlock.type}
        </Text>
      </div>
    </Card>
  );
}
