import { useState } from 'react';
import { Button, Card, Text } from '@shared/ui';
import { resetAllData } from '@data/db/reset';
import styles from './ResetSection.module.css';

/**
 * Danger zone: wipe the entire IndexedDB store. Two-step confirmation.
 * The card stays visually quiet by default (warm dashed border) and only
 * escalates its styling when the user opts into the confirmation step,
 * per the "no bright red everywhere" rule in the Settings brief.
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
        window.location.reload();
      } catch (e) {
        setRunning(false);
        setError(e instanceof Error ? e.message : 'Reset failed.');
      }
    })();
  };

  return (
    <Card
      padding="md"
      className={styles.card}
      as="article"
      aria-labelledby="reset-heading"
      data-confirming={confirming || undefined}
    >
      <p className={styles.kicker} id="reset-heading">
        Reset all data
      </p>
      <Text variant="secondary" className={styles.body}>
        This removes every mission, routine, note, day log, promise event, snapshot,
        and review on this device. The app returns to its fresh-install state. It
        cannot be undone.
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
          <Button type="button" variant="secondary" onClick={() => setConfirming(true)}>
            Reset all data
          </Button>
        )}
      </div>
    </Card>
  );
}
