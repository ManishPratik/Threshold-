import { useEffect, useState } from 'react';
import {
  readDailyAnalytics,
  type DailyAnalytics,
  type DailyAnalyticsRow,
} from '@features/daily-flow-engine';
import styles from './FrozenDailyFlowAnalyticsPage.module.css';

/**
 * User-facing Daily Flow Analytics screen. Reached via Settings.
 *
 * Reads only the existing ack log at
 * personal-os/src/features/daily-flow-engine/ackLog.ts (reused
 * legacy `settings` v1 store per ADR 0009 §6). No new database, no
 * DB_VERSION bump — records outside the 30-day retention window are
 * purged by the boot sweep at
 * personal-os/src/app/frozen/boot.ts.
 *
 * Copy stays supportive: totals frame engagement, not shortcomings.
 * When no ack records exist, the screen renders a single empty-state
 * line — no charts, no placeholder skeletons.
 */
export function FrozenDailyFlowAnalyticsPage() {
  const [data, setData] = useState<DailyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const analytics = await readDailyAnalytics();
        if (cancelled) return;
        setData(analytics);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load analytics.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.column}>
        <p className={styles.eyebrow}>Daily Flow</p>
        <p className={styles.loadingLine}>Loading.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.column}>
        <p className={styles.eyebrow}>Daily Flow</p>
        <p role="alert" className={styles.summaryMuted}>
          {error}
        </p>
      </div>
    );
  }

  const analytics = data ?? {
    totalSeen: 0,
    totalAcked: 0,
    totalDismissed: 0,
    overallAckRate: 0,
    overallDismissRate: 0,
    rows: [],
  };

  if (analytics.totalSeen === 0) {
    return (
      <div className={styles.column}>
        <p className={styles.eyebrow}>Daily Flow</p>
        <h1 className={styles.heading}>Daily Flow Analytics</h1>
        <p className={styles.emptyLine}>
          Your Daily Flow history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.column}>
      <p className={styles.eyebrow}>Daily Flow</p>
      <h1 className={styles.heading}>Daily Flow Analytics</h1>

      <SummarySection analytics={analytics} />
      <TimelineSection rows={analytics.rows} />
    </div>
  );
}

function SummarySection({ analytics }: { analytics: DailyAnalytics }) {
  const ackPct = Math.round(analytics.overallAckRate * 100);
  const dismissPct = Math.round(analytics.overallDismissRate * 100);
  const acknowledgedLine =
    analytics.totalAcked === 0
      ? 'No interventions acknowledged yet.'
      : `You acknowledged ${ackPct}% of guidance in the last ${analytics.rows.length === 1 ? 'day' : `${analytics.rows.length} days`}.`;
  const dismissLine =
    analytics.totalDismissed === 0
      ? 'You have not dismissed any interventions.'
      : `You dismissed ${analytics.totalDismissed} ${
          analytics.totalDismissed === 1 ? 'intervention' : 'interventions'
        }.`;
  return (
    <section className={styles.summarySection} aria-label="Summary">
      <p className={styles.summaryLine}>{acknowledgedLine}</p>
      <p className={styles.summaryLine}>{dismissLine}</p>
      <p className={styles.summaryMuted}>
        {analytics.totalSeen} seen · {analytics.totalAcked} acknowledged (
        {ackPct}%) · {analytics.totalDismissed} dismissed ({dismissPct}%)
      </p>
    </section>
  );
}

function TimelineSection({ rows }: { rows: readonly DailyAnalyticsRow[] }) {
  return (
    <section className={styles.timelineSection} aria-label="Daily timeline">
      <p className={styles.timelineHeading}>Daily timeline</p>
      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.date} className={styles.row}>
            <p className={styles.rowDate}>{row.date}</p>
            <p className={styles.rowMeta}>
              {row.acked} ack
            </p>
            <p className={styles.rowMeta}>
              {row.dismissed} dismiss
            </p>
            <p className={styles.rowRate}>{Math.round(row.ackRate * 100)}%</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
