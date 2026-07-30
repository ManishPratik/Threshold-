import { formatWitnessTimestamp } from '@shared/lib/date';
import styles from './WitnessRitual.module.css';

export interface WitnessRitualProps {
  missionTitle: string;
  durationDays: number;
  /**
   * ISO timestamp of the exact press moment. Persisted separately from the
   * mission's activatedAt so the ritual anchors on the *user's* moment of
   * intent, not the DB write time (which is a few ms later).
   */
  committedIso: string;
  /** Fired when the user presses "Begin today". Caller marks onboarding
   *  completed and navigates to /today. */
  onBeginToday: () => void;
}

/**
 * The witness ritual. Renders frames 2-6 of the approved storyboard as a
 * single, continuous CSS-driven sequence on the warm ivory canvas. No JS
 * timers, no state machine — the pacing lives entirely in the module CSS
 * as animation-delay values. The component mounts once (when Screen 5's
 * ritual begins) and the DOM stays stable through the entire sequence.
 *
 *   0.  Card interior + chrome recede         (fade to background — the
 *       user is left alone with their sentence).
 *   1.  Stillness                             (nothing moves — silence
 *       creates weight).
 *   2.  Ink absorbs                           (terracotta saturates the
 *       user's sentence, left to right, one word at a time).
 *   3.  Isolation                             (mission title + unlabelled
 *       timestamp stand alone on the ivory canvas — the emotional peak;
 *       held long enough for the user to read their own words a second
 *       time).
 *   4.  Crossfade                             (title + timestamp fade out
 *       as "You said yes to yourself." fades in on the same canvas — one
 *       thought becoming another).
 *   5.  Pause beats + Begin today             (the app's exhale — never
 *       a success message).
 *
 * The keepsake (Frame 7) is not owned here — it lives on Today, where the
 * MissionSummaryCard renders the same unlabelled timestamp beneath the
 * mission title for every day of the mission.
 */
export function WitnessRitual({
  missionTitle,
  durationDays,
  committedIso,
  onBeginToday,
}: WitnessRitualProps) {
  const timestamp = formatWitnessTimestamp(committedIso);

  return (
    <div className={styles.canvas} aria-live="polite">
      {/* Frame 2-5 layer — the user's own words. */}
      <div className={styles.promiseLayer}>
        <h1 className={styles.promise}>
          <span aria-hidden="true" className={styles.ghost}>
            {missionTitle}
          </span>
          <span className={styles.ink}>{missionTitle}</span>
        </h1>
        <span className={styles.timestamp}>{timestamp}</span>
      </div>

      {/* Frame 6 layer — the app's exhale. */}
      <div className={styles.pauseLayer}>
        <div className={styles.beat1}>You said yes to yourself.</div>
        <div className={styles.beat2}>
          For the next {durationDays} days, all that matters is today.
        </div>
        <div className={styles.beat3}>
          <p>Not perfect. Not productive.</p>
          <p>Just — today&rsquo;s promise, kept.</p>
          <p>Tomorrow can wait.</p>
        </div>
        <button
          type="button"
          className={styles.beginCta}
          onClick={onBeginToday}
        >
          <span>Begin today</span>
          <span aria-hidden="true" className={styles.arrow}>
            →
          </span>
        </button>
      </div>
    </div>
  );
}
