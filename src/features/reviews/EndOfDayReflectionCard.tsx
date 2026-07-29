import { useEffect, useState } from 'react';
import { Button, Card, Text } from '@shared/ui';
import { defaultTimeProvider } from '@shared/lib/time';
import { ReviewEditor } from './ReviewEditor';
import { reviewsService } from './reviewsService';
import styles from './EndOfDayReflectionCard.module.css';

/**
 * Daily review surface on the Today screen. Retains the "End of day
 * reflection" label from the original Milestone-1 placeholder for continuity
 * with the Today mental model; the underlying entity is a `daily` Review.
 *
 * Collapsed by default. Tapping Reflect expands the shared ReviewEditor
 * inline. Save collapses back and the subtitle switches to "Reflected today".
 */
export function EndOfDayReflectionCard() {
  const [today] = useState(() => defaultTimeProvider.currentLogicalDate());
  const [expanded, setExpanded] = useState(false);
  const [submittedToday, setSubmittedToday] = useState<boolean | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const existing = await reviewsService.getReviewForPeriod('daily', today);
      if (!cancelled) setSubmittedToday(existing?.submitted ?? false);
    })();
    return () => {
      cancelled = true;
    };
  }, [today, reloadKey]);

  if (expanded) {
    return (
      <Card padding="lg" className={styles.card} as="section" aria-labelledby="eod-heading">
        <ReviewEditor
          kind="daily"
          periodStart={today}
          today={today}
          variant="inline"
          onSaved={() => {
            setExpanded(false);
            setReloadKey((k) => k + 1);
          }}
          onCancel={() => setExpanded(false)}
        />
      </Card>
    );
  }

  const subtitle =
    submittedToday === null
      ? ''
      : submittedToday
        ? 'Reflected today. Amend anytime.'
        : 'Take a moment to reflect on today.';

  return (
    <Card padding="md" className={styles.card} aria-labelledby="eod-heading">
      <div className={styles.row}>
        <div className={styles.textGroup}>
          <Text as="span" size="sm" weight="medium" id="eod-heading">
            End of day reflection
          </Text>
          {subtitle.length > 0 && (
            <Text size="sm" variant="muted" className={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setExpanded(true)}>
          {submittedToday ? 'Amend' : 'Reflect'}
        </Button>
      </div>
    </Card>
  );
}
