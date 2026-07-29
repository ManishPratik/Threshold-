import { useEffect, useState } from 'react';
import { Card, Heading, Text } from '@shared/ui';
import { getStorageStats, type StorageStats } from '@data/db/stats';
import styles from './AboutSection.module.css';

/**
 * About + storage overview. Numbers come from src/data/db/stats.ts —
 * cross-store record counts, no domain concerns.
 */
export function AboutSection() {
  const [stats, setStats] = useState<StorageStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const fresh = await getStorageStats();
      if (!cancelled) setStats(fresh);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.section} aria-labelledby="about-heading">
      <div className={styles.header}>
        <Heading level={2} visualLevel={3} id="about-heading" className={styles.title}>
          About
        </Heading>
      </div>

      <Card padding="md" className={styles.card} as="article">
        <div className={styles.row}>
          <Text as="span" size="sm" variant="secondary" className={styles.rowLabel}>
            App
          </Text>
          <Text as="span" size="sm" className={styles.rowValue}>
            Personal OS · v{__APP_VERSION__}
          </Text>
        </div>
        <div className={styles.row}>
          <Text as="span" size="sm" variant="secondary" className={styles.rowLabel}>
            Storage
          </Text>
          <Text as="span" size="sm" className={styles.rowValue}>
            {stats === null ? '—' : `${stats.total} records on this device`}
          </Text>
        </div>
        {stats !== null && (
          <div className={styles.breakdown} aria-label="Per-store record counts">
            <StatChip label="Notes" value={stats.notes} />
            <StatChip label="Missions" value={stats.missions} />
            <StatChip label="Routines" value={stats.routines} />
            <StatChip label="Day logs" value={stats.dayLogs} />
            <StatChip label="Promise events" value={stats.promiseEvents} />
            <StatChip label="Score snapshots" value={stats.snapshots} />
            <StatChip label="Reviews" value={stats.reviews} />
          </div>
        )}
      </Card>
    </section>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <span className={styles.chip}>
      <span className={styles.chipLabel}>{label}</span>
      <span className={styles.chipValue}>{value}</span>
    </span>
  );
}
