import { useState } from 'react';
import { EraseDataDialog } from './EraseDataDialog';
import styles from './FrozenSettingsPage.module.css';

export interface FrozenSettingsPageProps {
  appName?: string;
  appVersion?: string;
  /** Fires after Erase Data commits. Parent routes to Today. */
  onErased: (() => void) | undefined;
}

/**
 * Frozen Settings page. Two shelves the frozen spec allows: About
 * (name + version) and Data (warning-ink Erase text link that opens
 * the EraseDataDialog). No user preferences, no toggles, no
 * notifications settings.
 */
export function FrozenSettingsPage({
  appName = 'Personal OS',
  appVersion = 'V1',
  onErased,
}: FrozenSettingsPageProps) {
  const [eraseOpen, setEraseOpen] = useState(false);

  return (
    <div className={styles.column}>
      <p className={styles.eyebrow}>Settings</p>

      <section className={styles.section} aria-label="About">
        <p className={styles.sectionEyebrow}>About</p>
        <p className={styles.appName}>{appName}</p>
        <p className={styles.appVersion}>{appVersion}</p>
      </section>

      <section className={styles.section} aria-label="Data">
        <p className={styles.sectionEyebrow}>Data</p>
        <p className={styles.dataParagraph}>
          Personal OS keeps every Promise, every declaration, and every note
          on this device. Erase clears them all.
        </p>
        <button
          type="button"
          className={styles.warningTextLink}
          onClick={() => setEraseOpen(true)}
        >
          Erase all data.
        </button>
      </section>

      <EraseDataDialog
        open={eraseOpen}
        onErased={() => {
          setEraseOpen(false);
          if (onErased) onErased();
        }}
        onCancel={() => setEraseOpen(false)}
      />
    </div>
  );
}
