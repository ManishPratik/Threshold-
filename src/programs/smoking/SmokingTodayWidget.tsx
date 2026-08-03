import { useEffect, useState } from 'react';
import type { TodayWidgetProps } from '@features/programs';
import { CravingSOSOverlay } from './CravingSOSOverlay';
import { SmokingScienceWidget } from './SmokingScienceWidget';
import { fetchSurfedCount } from './state';
import styles from './SmokingTodayWidget.module.css';

/**
 * Smoking Cessation Today widget. Renders the Craving-SOS floating
 * action button with a compact surfed counter, and hosts the overlay
 * itself. The FAB shape and behaviour are ported from the Threshold
 * markup at ac4b193~1:index.html lines 2399-2404 ("Craving SOS
 * floating action button") and the counter comes from
 * ac4b193~1:index.html line 5482 `updateCravingCount`.
 *
 * The widget is rendered by TodayProgramWidgets at
 * personal-os/src/features/programs/TodayProgramWidgets.tsx line 45
 * (verified in a same-session Read) only when the user has enabled
 * the Smoking program in Settings. Personal OS remains unaware of any
 * smoking specifics: this file owns the copy, the CSS, the state, and
 * the persistence.
 */
export function SmokingTodayWidget(_props: TodayWidgetProps) {
  const [open, setOpen] = useState(false);
  const [surfed, setSurfed] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const n = await fetchSurfedCount();
      if (!cancelled) setSurfed(n);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SmokingScienceWidget />
      <div className={styles.fabRow}>
        <button
          type="button"
          className={styles.fab}
          onClick={() => setOpen(true)}
          aria-label="Craving SOS — start a 3-minute pause"
        >
          <span className={styles.fabLabel}>Craving SOS</span>
          <span className={styles.fabCount} aria-label={`${surfed} surfed`}>
            {surfed}
          </span>
        </button>
      </div>
      {open ? (
        <CravingSOSOverlay
          onClose={() => setOpen(false)}
          onLogChanged={(log) => {
            const count = log.filter((e) => e.type === 'surfed').length;
            setSurfed(count);
          }}
        />
      ) : null}
    </>
  );
}
