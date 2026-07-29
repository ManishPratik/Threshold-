import { useEffect, useState } from 'react';
import { Button, Card, Heading, Text } from '@shared/ui';
import type { ReviewKind, Review } from '@data/types/Review';
import type { ISODate } from '@shared/lib/date';
import { formatPeriodLabel } from './periods';
import { reviewsService } from './reviewsService';
import styles from './PeriodicReviewsSection.module.css';

export interface PeriodicReviewsSectionProps {
  today: ISODate;
  onOpen: (kind: ReviewKind, periodStart: ISODate) => void;
}

interface Row {
  kind: 'weekly' | 'monthly';
  periodStart: ISODate;
  existing: Review | undefined;
}

const KIND_LABEL: Record<Row['kind'], string> = {
  weekly: 'Weekly review',
  monthly: 'Monthly review',
};

/**
 * The Reviews strip embedded below the Analytics dashboard. Shows the
 * current-period status of Weekly and Monthly reviews only — Daily lives on
 * the Today screen per the Phase-A brief.
 */
export function PeriodicReviewsSection({ today, onOpen }: PeriodicReviewsSectionProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const weeklyStart = reviewsService.currentPeriod('weekly');
      const monthlyStart = reviewsService.currentPeriod('monthly');
      const [weekly, monthly] = await Promise.all([
        reviewsService.getReviewForPeriod('weekly', weeklyStart),
        reviewsService.getReviewForPeriod('monthly', monthlyStart),
      ]);
      if (cancelled) return;
      setRows([
        { kind: 'weekly', periodStart: weeklyStart, existing: weekly },
        { kind: 'monthly', periodStart: monthlyStart, existing: monthly },
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (rows === null) return null;

  return (
    <section className={styles.section} aria-labelledby="reviews-heading">
      <Heading level={2} visualLevel={3} id="reviews-heading" className={styles.heading}>
        Reviews
      </Heading>
      <div className={styles.grid}>
        {rows.map((row) => (
          <ReviewRowCard
            key={row.kind}
            row={row}
            today={today}
            onOpen={() => onOpen(row.kind, row.periodStart)}
            onSignalRefresh={() => setReloadKey((k) => k + 1)}
          />
        ))}
      </div>
    </section>
  );
}

interface CardProps {
  row: Row;
  today: ISODate;
  onOpen: () => void;
  onSignalRefresh: () => void;
}

function ReviewRowCard({ row, today, onOpen, onSignalRefresh }: CardProps) {
  const status =
    row.existing === undefined
      ? 'not-started'
      : row.existing.submitted
        ? 'submitted'
        : 'in-progress';
  const buttonLabel =
    status === 'not-started' ? 'Start' : status === 'submitted' ? 'Amend' : 'Continue';
  const statusText =
    status === 'not-started'
      ? 'Not started'
      : status === 'submitted'
        ? 'Submitted'
        : 'In progress';

  return (
    <Card padding="md" className={styles.card} as="article" aria-labelledby={`review-${row.kind}-heading`}>
      <div className={styles.top}>
        <div>
          <Text size="xs" variant="muted" className={styles.eyebrow}>
            {formatPeriodLabel(row.kind, row.periodStart, today)}
          </Text>
          <Heading level={3} visualLevel={4} id={`review-${row.kind}-heading`} className={styles.rowTitle}>
            {KIND_LABEL[row.kind]}
          </Heading>
        </div>
        <span className={`${styles.pill} ${styles[`pill-${status}`]}`}>{statusText}</span>
      </div>
      <div className={styles.actions}>
        <Button
          type="button"
          variant={status === 'not-started' ? 'primary' : 'secondary'}
          onClick={() => {
            onSignalRefresh();
            onOpen();
          }}
        >
          {buttonLabel}
        </Button>
      </div>
    </Card>
  );
}
