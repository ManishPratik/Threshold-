import { useEffect, useState } from 'react';
import { Card, Heading, ProgressBar, Text } from '@shared/ui';
import { analyticsService, type AnalyticsView } from './analyticsService';
import styles from './AnalyticsDashboard.module.css';

/**
 * Analytics surface. Text-first V1: no chart library, no trend arrows,
 * no charts full stop. Every number here is reproducible from the
 * repositories by re-invoking analyticsService.getAnalyticsView.
 */
export function AnalyticsDashboard() {
  const [view, setView] = useState<AnalyticsView | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const fresh = await analyticsService.getAnalyticsView();
      if (!cancelled) setView(fresh);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (view === null) return null;

  return (
    <section className={styles.page} aria-labelledby="analytics-heading">
      <header className={styles.header}>
        <Heading level={1} id="analytics-heading" className={styles.title}>
          Analytics
        </Heading>
        <Text size="sm" variant="secondary">
          Last {view.windowDays} days
        </Text>
      </header>

      <div className={styles.grid}>
        <SelfTrustCard view={view} />
        <MissionCard view={view} />
        <ConsistencyCard view={view} />
        <KnowledgeCard view={view} />
      </div>
    </section>
  );
}

function SelfTrustCard({ view }: { view: AnalyticsView }) {
  const { currentScore, deltaOverWindow, windowDays } = view.selfTrust;
  const deltaSign = deltaOverWindow > 0 ? '+' : '';
  return (
    <Card padding="md" className={styles.card} as="article" aria-labelledby="st-heading">
      <Text size="xs" variant="muted" className={styles.eyebrow}>
        Self-Trust
      </Text>
      <Heading level={2} visualLevel={3} id="st-heading" className={styles.value}>
        {currentScore}
      </Heading>
      <Text size="sm" variant="secondary">
        {deltaSign}
        {deltaOverWindow} over the last {windowDays} days
      </Text>
    </Card>
  );
}

function MissionCard({ view }: { view: AnalyticsView }) {
  const { present, title, currentDay, totalDays, ratio } = view.mission;
  return (
    <Card padding="md" className={styles.card} as="article" aria-labelledby="mission-heading">
      <Text size="xs" variant="muted" className={styles.eyebrow}>
        Mission progress
      </Text>
      {!present ? (
        <Text variant="secondary">No active mission.</Text>
      ) : (
        <>
          <Heading level={2} visualLevel={4} id="mission-heading" className={styles.subValue}>
            {title}
          </Heading>
          <Text size="sm" variant="secondary" className={styles.metaLine}>
            {totalDays !== null ? `Day ${currentDay} of ${totalDays}` : `Day ${currentDay}`}
          </Text>
          {ratio !== null && (
            <ProgressBar
              value={ratio}
              label={`Mission progress: ${currentDay} of ${totalDays} days`}
              className={styles.bar}
            />
          )}
        </>
      )}
    </Card>
  );
}

function ConsistencyCard({ view }: { view: AnalyticsView }) {
  const { keptCount, brokenCount, deferredCount, totalEvents, windowDays } = view.consistency;
  return (
    <Card padding="md" className={styles.card} as="article" aria-labelledby="consistency-heading">
      <Text size="xs" variant="muted" className={styles.eyebrow}>
        Consistency
      </Text>
      <Heading level={2} visualLevel={3} id="consistency-heading" className={styles.value}>
        {totalEvents}
      </Heading>
      <Text size="sm" variant="secondary">
        {keptCount} kept · {brokenCount} broken · {deferredCount} deferred
      </Text>
      <Text size="xs" variant="muted" className={styles.metaLine}>
        Across the last {windowDays} days
      </Text>
    </Card>
  );
}

function KnowledgeCard({ view }: { view: AnalyticsView }) {
  const { totalActive, totalTrashed, topTags } = view.knowledge;
  return (
    <Card padding="md" className={styles.card} as="article" aria-labelledby="knowledge-heading">
      <Text size="xs" variant="muted" className={styles.eyebrow}>
        Knowledge
      </Text>
      <Heading level={2} visualLevel={3} id="knowledge-heading" className={styles.value}>
        {totalActive}
      </Heading>
      <Text size="sm" variant="secondary">
        {totalActive === 1 ? 'active note' : 'active notes'}
        {totalTrashed > 0 ? ` · ${totalTrashed} in trash` : ''}
      </Text>
      {topTags.length > 0 && (
        <ul className={styles.tags}>
          {topTags.map(({ tag, count }) => (
            <li key={tag} className={styles.tag}>
              {tag} · {count}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
