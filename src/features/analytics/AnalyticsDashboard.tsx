import { useEffect, useState } from 'react';
import { Card, ProgressBar } from '@shared/ui';
import { analyticsService, type AnalyticsView } from './analyticsService';
import styles from './AnalyticsDashboard.module.css';

/**
 * Analytics surface — reflection, not dashboard. The page answers three
 * questions in order:
 *   1. Am I becoming more trustworthy to myself?  (Self-Trust hero)
 *   2. Am I progressing?                           (Mission progress)
 *   3. What deserves attention?                    (Reviews strip — rendered
 *      as the sibling PeriodicReviewsSection on AnalyticsPage.tsx)
 *
 * Secondary metrics (consistency + knowledge) sit at the bottom, deliberately
 * quieter. Coach voice throughout — no chart clutter, no bare tables.
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
      <Greeting windowDays={view.windowDays} />

      <SelfTrustHero view={view} />

      <div className={styles.eyebrow} aria-hidden="true">
        <span>What you&rsquo;re building</span>
      </div>

      <MissionCard view={view} />

      <div className={styles.quietGrid}>
        <ConsistencyCard view={view} />
        <KnowledgeCard view={view} />
      </div>
    </section>
  );
}

/* ─────────────── Greeting ─────────────── */

function Greeting({ windowDays }: { windowDays: number }) {
  return (
    <div className={styles.greeting}>
      <span className={styles.kicker}>Last {windowDays} days</span>
      <h1 id="analytics-heading" className={styles.title}>
        How you&rsquo;re doing<span className={styles.titlePunct}>.</span>
      </h1>
      <p className={styles.greetingSub}>A quiet look at your promises to yourself.</p>
    </div>
  );
}

/* ─────────────── Self-Trust hero (Question 1) ─────────────── */

function SelfTrustHero({ view }: { view: AnalyticsView }) {
  const { currentScore, deltaOverWindow, windowDays } = view.selfTrust;
  const trajectory =
    deltaOverWindow > 0 ? 'rising' : deltaOverWindow < 0 ? 'settling' : 'flat';
  const eyebrow =
    trajectory === 'rising'
      ? 'Trust is building'
      : trajectory === 'settling'
        ? 'Recalibrating'
        : 'Steady';
  const coachLine =
    trajectory === 'rising'
      ? `You are ${Math.abs(deltaOverWindow)} more trustworthy to yourself than you were ${windowDays} days ago. Keep the streak simple.`
      : trajectory === 'settling'
        ? `The last ${windowDays} days were quieter. That is data, not judgement — start with the next block.`
        : `A calm ${windowDays} days. Not every stretch has to be dramatic — showing up is enough.`;
  const deltaSign = deltaOverWindow > 0 ? '+' : deltaOverWindow < 0 ? '' : '±';

  return (
    <Card padding="lg" className={styles.hero} as="article" aria-labelledby="st-heading">
      <div className={styles.heroInner}>
        <div className={styles.heroTop}>
          <span className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {eyebrow}
          </span>
          <span className={styles.heroMeta}>Self-Trust · last {windowDays} days</span>
        </div>
        <div className={styles.heroValueRow}>
          <span className={styles.heroValue} id="st-heading">
            {currentScore}
          </span>
          <span className={styles.heroDelta} data-trajectory={trajectory}>
            {deltaSign}
            {deltaOverWindow}
          </span>
        </div>
        <p className={styles.heroCoach}>{coachLine}</p>
      </div>
    </Card>
  );
}

/* ─────────────── Mission progress (Question 2) ─────────────── */

function MissionCard({ view }: { view: AnalyticsView }) {
  const { present, title, currentDay, totalDays, ratio } = view.mission;

  if (!present) {
    return (
      <Card padding="md" className={styles.missionCard} as="article" aria-labelledby="mission-heading">
        <p className={styles.missionKicker} id="mission-heading">
          Mission
        </p>
        <p className={styles.missionEmpty}>
          No active mission yet. Set one on Today when you&rsquo;re ready.
        </p>
      </Card>
    );
  }

  const daysToGo =
    totalDays !== null ? Math.max(0, totalDays - currentDay) : null;
  const coachLine =
    totalDays === null
      ? `Day ${currentDay}. Keep going.`
      : daysToGo === 0
        ? `Day ${currentDay} of ${totalDays}. You made it. Reflect and choose what&rsquo;s next.`
        : `Day ${currentDay} of ${totalDays} · ${daysToGo} ${daysToGo === 1 ? 'day' : 'days'} to go.`;

  return (
    <Card padding="md" className={styles.missionCard} as="article" aria-labelledby="mission-heading">
      <p className={styles.missionKicker}>Mission</p>
      <h2 id="mission-heading" className={styles.missionTitle}>
        {title}
      </h2>
      <p className={styles.missionMeta}>{coachLine}</p>
      {ratio !== null && (
        <ProgressBar
          value={ratio}
          label={`Mission progress: ${currentDay} of ${totalDays} days`}
          className={styles.missionBar}
        />
      )}
    </Card>
  );
}

/* ─────────────── Quiet secondary metrics ─────────────── */

function ConsistencyCard({ view }: { view: AnalyticsView }) {
  const { keptCount, brokenCount, deferredCount, windowDays } = view.consistency;
  const coachLine =
    keptCount === 0 && brokenCount === 0 && deferredCount === 0
      ? `Nothing recorded in the last ${windowDays} days yet.`
      : brokenCount === 0 && deferredCount === 0
        ? `${keptCount} ${keptCount === 1 ? 'promise' : 'promises'} kept. None broken, nothing drifting.`
        : `${keptCount} kept · ${brokenCount} broken · ${deferredCount} deferred.`;
  return (
    <Card padding="md" className={styles.quietCard} as="article" aria-labelledby="consistency-heading">
      <p className={styles.quietKicker} id="consistency-heading">
        Consistency
      </p>
      <p className={styles.quietCoach}>{coachLine}</p>
    </Card>
  );
}

function KnowledgeCard({ view }: { view: AnalyticsView }) {
  const { totalActive, totalTrashed } = view.knowledge;
  const coachLine =
    totalActive === 0 && totalTrashed === 0
      ? 'The vault is empty. Capture the first thing worth remembering.'
      : totalActive === 0
        ? `Vault is empty. ${totalTrashed} in trash.`
        : totalTrashed > 0
          ? `${totalActive} ${totalActive === 1 ? 'note' : 'notes'} in the vault · ${totalTrashed} in trash.`
          : `${totalActive} ${totalActive === 1 ? 'note' : 'notes'} in the vault.`;
  return (
    <Card padding="md" className={styles.quietCard} as="article" aria-labelledby="knowledge-heading">
      <p className={styles.quietKicker} id="knowledge-heading">
        Vault
      </p>
      <p className={styles.quietCoach}>{coachLine}</p>
    </Card>
  );
}
