import { useEffect, useState } from 'react';
import { Card } from '@shared/ui';
import { getStorageStats, type StorageStats } from '@data/db/stats';
import styles from './StorageCard.module.css';

/**
 * Storage overview under the "Your data" section. Renders the per-store
 * record counts as warm chips. Data source is src/data/db/stats.ts —
 * no domain concerns, no writes.
 */
export function StorageCard() {
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
    <Card padding="md" className={styles.card} as="article" aria-labelledby="storage-heading">
      <p className={styles.kicker} id="storage-heading">
        Storage
      </p>
      <p className={styles.line}>
        {stats === null
          ? 'Counting…'
          : `${stats.total} ${stats.total === 1 ? 'record' : 'records'} on this device`}
      </p>
      {stats !== null && (
        <ul className={styles.chipList} aria-label="Per-store record counts">
          <StatChip label="Notes" value={stats.notes} />
          <StatChip label="Missions" value={stats.missions} />
          <StatChip label="Routines" value={stats.routines} />
          <StatChip label="Day logs" value={stats.dayLogs} />
          <StatChip label="Promise events" value={stats.promiseEvents} />
          <StatChip label="Score snapshots" value={stats.snapshots} />
          <StatChip label="Reviews" value={stats.reviews} />
        </ul>
      )}
    </Card>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <li className={styles.chip}>
      <span className={styles.chipLabel}>{label}</span>
      <span className={styles.chipValue}>{value}</span>
    </li>
  );
}
