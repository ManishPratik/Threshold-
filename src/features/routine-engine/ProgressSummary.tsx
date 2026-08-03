import { Card, ProgressBar, Text } from '@shared/ui';
import type { TodayProgress } from './getCurrentBlock';
import styles from './ProgressSummary.module.css';

export interface ProgressSummaryProps {
  progress: TodayProgress;
}

/**
 * Compact routine-progress card. Restored from tag v1.0.0 (routine-engine
 * folder) and adapted to the current TodayProgress shape at
 * personal-os/src/features/routine-engine/getCurrentBlock.ts lines 22-28
 * (no `skippedBlocks` field). The v1.0.0 label/copy is preserved verbatim.
 */
export function ProgressSummary({ progress }: ProgressSummaryProps) {
  const { totalBlocks, completedBlocks, remainingBlocks } = progress;
  const ratio = totalBlocks === 0 ? 0 : completedBlocks / totalBlocks;

  return (
    <Card
      padding="md"
      className={styles.card}
      aria-labelledby="progress-heading"
    >
      <div className={styles.row}>
        <Text
          as="span"
          size="sm"
          weight="medium"
          id="progress-heading"
          className={styles.label}
        >
          Today&rsquo;s progress
        </Text>
        <Text as="span" size="sm" variant="secondary">
          {completedBlocks} done · {remainingBlocks} remaining
        </Text>
      </div>
      <ProgressBar
        value={ratio}
        label={`${completedBlocks} of ${totalBlocks} activities complete`}
        className={styles.bar}
      />
    </Card>
  );
}
