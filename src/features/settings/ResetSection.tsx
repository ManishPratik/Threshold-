import { useState } from 'react';
import { Button, Card, Heading, Text } from '@shared/ui';
import { resetAllData } from '@data/db/reset';
import styles from './ResetSection.module.css';

/**
 * Danger zone: wipe the entire IndexedDB store. Two-step confirmation.
 * On completion, the page is reloaded so the app boots against a fresh DB
 * (bootstrap seed re-runs, per ADR 0006).
 */
export function ResetSection() {
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const doReset = () => {
    setRunning(true);
    setError(undefined);
    void (async () => {
      try {
        await resetAllData();
        // Force a clean boot so getDb() re-opens and the seed re-runs.
        window.location.reload();
      } catch (e) {
        setRunning(false);
        setError(e instanceof Error ? e.message : 'Reset failed.');
      }
    })();
  };

  return (
    <section className={styles.section} aria-labelledby="reset-heading">
      <div className={styles.header}>
        <Heading level={2} visualLevel={3} id="reset-heading" className={styles.title}>
          Danger zone
        </Heading>
      </div>

      <Card padding="md" className={styles.card} as="article">
        <Text variant="secondary" className={styles.body}>
          Reset all data removes every mission, routine, note, day log, promise
          event, snapshot, and review on this device. The app returns to its
          fresh-install state. This cannot be undone.
        </Text>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          {confirming ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirming(false)}
                disabled={running}
              >
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={doReset} disabled={running}>
                {running ? 'Resetting…' : 'Yes, delete everything'}
              </Button>
            </>
          ) : (
            <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
              Reset all data
            </Button>
          )}
        </div>
      </Card>
    </section>
  );
}
