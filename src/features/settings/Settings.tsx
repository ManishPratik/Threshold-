import { Heading } from '@shared/ui';
import { TrashSection } from './TrashSection';
import { AboutSection } from './AboutSection';
import { BackupSection } from './BackupSection';
import { ResetSection } from './ResetSection';
import styles from './Settings.module.css';

/**
 * Top-level Settings surface. Four sections in order: Trash (Knowledge Vault
 * soft-deletes), Backup & Restore (Import / Export), About (app + storage
 * stats), Danger zone (destructive reset). No user preferences are persisted
 * in V1 — the day-boundary hour is fixed at 04:00 per
 * src/shared/lib/dayBoundary.ts. Notifications are out of scope.
 */
export function Settings() {
  return (
    <section className={styles.page} aria-labelledby="settings-heading">
      <Heading level={1} id="settings-heading" className={styles.title}>
        Settings
      </Heading>

      <TrashSection />
      <BackupSection />
      <AboutSection />
      <ResetSection />
    </section>
  );
}
