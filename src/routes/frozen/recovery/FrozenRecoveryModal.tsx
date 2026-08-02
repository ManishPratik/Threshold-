import type { PromiseRecord } from '@data/types/PromiseRecord';
import { CeremonialFade, ModalShell } from '@features/frozen';
import styles from './FrozenRecoveryModal.module.css';

export interface FrozenRecoveryModalProps {
  open: boolean;
  promise: PromiseRecord;
  onContinue: (() => void) | undefined;
}

/**
 * Frozen Recovery modal. Full-viewport takeover between the broken
 * declaration on Reflection Screen C and returning to Today. Displays
 * the promise title and one factual line, plus a single Continue action.
 */
export function FrozenRecoveryModal({
  open,
  promise,
  onContinue,
}: FrozenRecoveryModalProps) {
  return (
    <ModalShell open={open} label="Recovery">
      <CeremonialFade visible={open}>
        <div className={styles.stack}>
          <h1 className={styles.title}>{promise.title}</h1>
          <p className={styles.fact}>
            Broken today. The Promise remains.
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
