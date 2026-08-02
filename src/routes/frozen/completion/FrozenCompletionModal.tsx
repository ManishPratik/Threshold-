import type { PromiseRecord } from '@data/types/PromiseRecord';
import { totalDaysBetween } from '@shared/lib/date';
import { CeremonialFade, ModalShell } from '@features/frozen';
import styles from './FrozenCompletionModal.module.css';

export interface FrozenCompletionModalProps {
  open: boolean;
  promise: PromiseRecord;
  onContinue: (() => void) | undefined;
}

/**
 * Frozen Completion Recognition modal. Full-viewport takeover after
 * Reflection Screen B commits the endDate kept declaration. Displays the
 * promise title, a single fact line, and one Continue action. A subtle
 * radial bloom sits behind the title — the only visual accent this
 * ceremonial surface admits.
 */
export function FrozenCompletionModal({
  open,
  promise,
  onContinue,
}: FrozenCompletionModalProps) {
  const total = totalDaysBetween(promise.startDate, promise.endDate);

  return (
    <ModalShell open={open} label="Completion">
      <CeremonialFade visible={open}>
        <div className={styles.stack}>
          <div className={styles.bloom} aria-hidden="true" />
          <h1 className={styles.title}>{promise.title}</h1>
          <p className={styles.fact}>
            Kept through — Day {total} of {total}.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => { if (onContinue) onContinue(); }}
            >
              Continue.
            </button>
          </div>
        </div>
      </CeremonialFade>
    </ModalShell>
  );
}
