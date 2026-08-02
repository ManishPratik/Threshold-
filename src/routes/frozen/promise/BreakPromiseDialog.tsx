import { useEffect, useState } from 'react';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import {
  CeremonialFade,
  DialogShell,
  PromiseService,
  useSubmitOnce,
} from '@features/frozen';
import styles from './BreakPromiseDialog.module.css';

const HELD_DISABLED_MS = 400;

export interface BreakPromiseDialogProps {
  open: boolean;
  promise: PromiseRecord;
  onBroken: (() => void) | undefined;
  onCancel: (() => void) | undefined;
}

/**
 * Frozen Break Promise dialog. Full-viewport takeover via DialogShell.
 * The destructive primary is held-disabled for a short beat on open so
 * the user cannot break by accident. Two actions only: primary
 * "Break this Promise." persists via PromiseService; secondary "Cancel."
 * dismisses. Guarded by useSubmitOnce so a duplicate tap on the
 * primary cannot double-write.
 */
export function BreakPromiseDialog({
  open,
  promise,
  onBroken,
  onCancel,
}: BreakPromiseDialogProps) {
  const [service] = useState(() => new PromiseService());
  const [error, setError] = useState<string>('');
  const [heldOpen, setHeldOpen] = useState(true);
  const guard = useSubmitOnce();

  useEffect(() => {
    if (!open) return;
    // Reset the held-disabled beat every time the dialog opens so the
    // destructive primary is never immediately actionable. Bounded by
    // HELD_DISABLED_MS; the cleanup clears the timer on close/unmount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeldOpen(true);
    setError('');
    const t = window.setTimeout(() => setHeldOpen(false), HELD_DISABLED_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  const handleConfirm = async () => {
    setError('');
    try {
      const updated = await guard.submit(() =>
        service.breakPromise(promise.id),
      );
      if (updated && onBroken) onBroken();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not break promise.');
    }
  };

  return (
    <DialogShell open={open} label="Break Promise">
      <CeremonialFade visible={open}>
        <div className={styles.stack}>
          <h1 className={styles.title}>{promise.title}</h1>
          <p className={styles.body}>
            This is a chosen break, not a broken day. It cannot be undone.
          </p>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.warningPrimary}
              onClick={() => {
                void handleConfirm();
              }}
              disabled={guard.pending || heldOpen}
            >
              Break this Promise.
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                if (onCancel) onCancel();
              }}
              disabled={guard.pending}
            >
              Cancel.
            </button>
          </div>
        </div>
      </CeremonialFade>
    </DialogShell>
  );
}
