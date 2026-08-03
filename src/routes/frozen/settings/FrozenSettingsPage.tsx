import { useEffect, useState } from 'react';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { listPrograms, type LifeProgram } from '@features/programs';
import { EraseDataDialog } from './EraseDataDialog';
import styles from './FrozenSettingsPage.module.css';

export interface FrozenSettingsPageProps {
  appName?: string;
  appVersion?: string;
  /** Fires after Erase Data commits. Parent routes to Today. */
  onErased: (() => void) | undefined;
  /** Fires when the user opens the Daily Flow Analytics screen. */
  onOpenDailyFlowAnalytics?: () => void;
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
  onOpenDailyFlowAnalytics,
}: FrozenSettingsPageProps) {
  const [eraseOpen, setEraseOpen] = useState(false);
  const [programs] = useState<readonly LifeProgram[]>(() => listPrograms());
  const [enabledIds, setEnabledIds] = useState<readonly string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const repo = new AppStateRepository();
      const ids = await repo.getEnabledProgramIds();
      if (cancelled) return;
      setEnabledIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleProgram = async (id: string) => {
    const current = enabledIds ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    const repo = new AppStateRepository();
    await repo.setEnabledProgramIds(next);
    setEnabledIds(next);
  };

  return (
    <div className={styles.column}>
      <p className={styles.eyebrow}>Settings</p>

      <section className={styles.section} aria-label="About">
        <p className={styles.sectionEyebrow}>About</p>
        <p className={styles.appName}>{appName}</p>
        <p className={styles.appVersion}>{appVersion}</p>
      </section>

      {programs.length > 0 ? (
        <section className={styles.section} aria-label="Life Programs">
          <p className={styles.sectionEyebrow}>Life Programs</p>
          <p className={styles.dataParagraph}>
            Optional add-ons that layer on top of Personal OS. Enable one to
            surface its widgets on Today. Nothing changes when none are enabled.
          </p>
          {programs.map((program) => {
            const enabled =
              enabledIds !== null && enabledIds.includes(program.id);
            return (
              <div key={program.id} className={styles.section}>
                <p className={styles.appName}>{program.displayName}</p>
                <p className={styles.appVersion}>{program.description}</p>
                <button
                  type="button"
                  className={styles.warningTextLink}
                  onClick={() => {
                    void toggleProgram(program.id);
                  }}
                  aria-pressed={enabled}
                >
                  {enabled
                    ? `Disable ${program.displayName}.`
                    : `Enable ${program.displayName}.`}
                </button>
              </div>
            );
          })}
        </section>
      ) : null}

      {onOpenDailyFlowAnalytics ? (
        <section className={styles.section} aria-label="Daily Flow Analytics">
          <p className={styles.sectionEyebrow}>Daily Flow</p>
          <p className={styles.dataParagraph}>
            See how consistently you have engaged with today&apos;s guidance.
          </p>
          <button
            type="button"
            className={styles.warningTextLink}
            onClick={onOpenDailyFlowAnalytics}
          >
            Open Daily Flow Analytics.
          </button>
        </section>
      ) : null}

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
