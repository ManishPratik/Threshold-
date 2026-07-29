import { useState } from 'react';
import { defaultTimeProvider } from '@shared/lib/time';
import { AnalyticsDashboard } from '@features/analytics';
import { PeriodicReviewsSection, ReviewEditor } from '@features/reviews';
import type { ReviewKind } from '@data/types/Review';
import type { ISODate } from '@shared/lib/date';

/**
 * Analytics page composes the analytics dashboard with the periodic-reviews
 * strip below it. Opening a review swaps the whole page into the shared
 * ReviewEditor — same mode-swap pattern used elsewhere.
 */
export function AnalyticsPage() {
  const [today] = useState(() => defaultTimeProvider.currentLogicalDate());
  const [editing, setEditing] = useState<{ kind: ReviewKind; periodStart: ISODate } | null>(null);

  if (editing) {
    return (
      <ReviewEditor
        kind={editing.kind}
        periodStart={editing.periodStart}
        today={today}
        onSaved={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <>
      <AnalyticsDashboard />
      <PeriodicReviewsSection
        today={today}
        onOpen={(kind, periodStart) => setEditing({ kind, periodStart })}
      />
    </>
  );
}
