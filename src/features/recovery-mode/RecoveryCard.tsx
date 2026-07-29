import { Button, Card, Heading, Text } from '@shared/ui';
import styles from './RecoveryCard.module.css';

export interface RecoveryCardProps {
  /** Invoked when the user taps "Begin today". Wire to the routine engine's start. */
  onBegin: () => void;
}

/**
 * Recovery Card. Acknowledges the missed day and invites re-entry.
 *
 * Copy is deliberately flat — no motivational quotes, no streak language,
 * no percentages, no shame. Recovery is meant to feel like resuming, not
 * restarting.
 */
export function RecoveryCard({ onBegin }: RecoveryCardProps) {
  return (
    <Card padding="lg" className={styles.card} as="section" aria-labelledby="recovery-heading">
      <Heading level={2} id="recovery-heading" className={styles.title}>
        You missed yesterday.
      </Heading>
      <Text variant="secondary" className={styles.body}>
        Recovery is part of the process. Start with the first block today.
      </Text>
      <div className={styles.actions}>
        <Button type="button" variant="primary" size="lg" onClick={onBegin}>
          Begin today
        </Button>
      </div>
    </Card>
  );
}
