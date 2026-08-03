import { Button, Heading, Text } from '@shared/ui';
import { ModalShell } from '@features/frozen';
import type { Hurdle } from './science';
import styles from './Celebrations.module.css';

// Peak-crossed one-time celebration overlay. Copy verbatim from
// ac4b193~1:index.html lines 2533-2551 (pc-eyebrow, pc-mountain,
// pc-title, pc-headline, pc-body, pc-vow-lbl, pc-vow-text, primary
// button label "I understand. I will not go back.").
export function PeakCrossedOverlay({ onAcknowledge }: { onAcknowledge: () => void }) {
  return (
    <ModalShell open={true} label="Peak Crossed">
      <div className={styles.peakSheet}>
        <p className={styles.peakEyebrow}>
          72 HOURS · NICOTINE FULLY CLEARED
        </p>
        <div aria-hidden="true" className={styles.peakMountain}>
          ⛰
        </div>
        <Heading level={2} className={styles.peakTitle}>
          Peak Crossed.
        </Heading>
        <Text variant="secondary" className={styles.peakHeadline}>
          You just did the hardest thing this quit will ever ask of you.
        </Text>
        <p className={styles.peakBody}>
          The parasite is dead. Nicotine — the actual drug — has been fully
          eliminated from your bloodstream. What you feel from here on is{' '}
          <em>habit</em>, not <em>chemistry</em>. Habit can be rewired.
          Chemistry could not be negotiated with — and you just crossed it
          anyway.
        </p>
        <div className={styles.peakVow}>
          <p className={styles.peakVowLabel}>Read this to yourself:</p>
          <p className={styles.peakVowText}>
            &ldquo;If I ever think about smoking again, I remember: I already
            did the hardest thing. Anything after this is smaller than what I
            already crossed.&rdquo;
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          type="button"
          onClick={onAcknowledge}
        >
          I understand. I will not go back.
        </Button>
      </div>
    </ModalShell>
  );
}

// Hurdle-cross celebration overlay. Copy layout matches
// ac4b193~1:index.html lines 2518-2528 (hc-eyebrow "HURDLE CLEARED",
// hc-icon, hc-title-x, hc-headline, hc-body, hc-ratchet, button
// "Locked in. Keep going.").
export function HurdleCrossOverlay({
  hurdle,
  onAcknowledge,
}: {
  hurdle: Hurdle;
  onAcknowledge: () => void;
}) {
  return (
    <ModalShell open={true} label={`Hurdle cleared: ${hurdle.label}`}>
      <div className={styles.hurdleSheet}>
        <p className={styles.hurdleEyebrow}>HURDLE CLEARED</p>
        <div aria-hidden="true" className={styles.hurdleIcon}>
          {hurdle.icon}
        </div>
        <Heading level={2} className={styles.hurdleTitle}>
          {hurdle.label}
        </Heading>
        <p className={styles.hurdleHeadline}>{hurdle.headline}</p>
        <Text variant="secondary" className={styles.hurdleBody}>
          {hurdle.body}
        </Text>
        <p
          className={styles.hurdleRatchet}
          dangerouslySetInnerHTML={{ __html: hurdle.ratchet }}
        />
        <Button
          variant="primary"
          size="lg"
          type="button"
          onClick={onAcknowledge}
        >
          Locked in. Keep going.
        </Button>
      </div>
    </ModalShell>
  );
}

// Slip vs full-relapse choice overlay. Copy verbatim from
// ac4b193~1:index.html lines 2555-2568. Two paths: "Log slip only —
// streak intact" (calls onLogSlip) or "Full relapse — reset streak"
// (calls onFullRelapse). Cancel closes without action.
export function SlipOverlay({
  onLogSlip,
  onFullRelapse,
  onCancel,
}: {
  onLogSlip: () => void;
  onFullRelapse: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalShell open={true} label="Slip response">
      <div className={styles.slipSheet}>
        <Heading level={2} className={styles.slipTitle}>
          A slip is a data point.
        </Heading>
        <Text variant="secondary" className={styles.slipBody}>
          One cigarette does not end your quit. What matters is what you do in
          the next hour. Log it honestly, note what triggered it, and continue.
          Nothing is broken unless you decide it is.
        </Text>
        <div className={styles.slipActions}>
          <Button
            variant="primary"
            size="lg"
            type="button"
            onClick={onLogSlip}
          >
            Log slip only — streak intact
          </Button>
          <Button
            variant="secondary"
            size="lg"
            type="button"
            onClick={onFullRelapse}
          >
            Full relapse — reset streak
          </Button>
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
