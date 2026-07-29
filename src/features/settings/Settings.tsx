import { TrashSection } from './TrashSection';
import { AboutSection } from './AboutSection';
import { BackupSection } from './BackupSection';
import { ResetSection } from './ResetSection';
import { StorageCard } from './StorageCard';
import { ShortcutsCard } from './ShortcutsCard';
import styles from './Settings.module.css';

/**
 * Top-level Settings surface. Three editorial sections in reading order:
 *   YOUR DATA     — Trash, Backup & Restore, Storage
 *   APPLICATION   — About, Keyboard shortcuts
 *   DANGER ZONE   — Reset
 *
 * All visual language inherits from Today: warm palette, serif greeting,
 * section-divider eyebrow, standard card. No new patterns.
 */
export function Settings() {
  return (
    <section className={styles.page} aria-labelledby="settings-heading">
      <div className={styles.greeting}>
        <span className={styles.kicker}>Personal OS · v{__APP_VERSION__}</span>
        <h1 id="settings-heading" className={styles.title}>
          Settings<span className={styles.titlePunct}>.</span>
        </h1>
        <p className={styles.greetingSub}>Your data lives here. Nothing leaves this device.</p>
      </div>

      <div className={styles.divider} aria-hidden="true">
        <span>Your data</span>
      </div>
      <TrashSection />
      <BackupSection />
      <StorageCard />

      <div className={styles.divider} aria-hidden="true">
        <span>Application</span>
      </div>
      <AboutSection />
      <ShortcutsCard />

      <div className={styles.divider} aria-hidden="true">
        <span>Danger zone</span>
      </div>
      <ResetSection />
    </section>
  );
}
