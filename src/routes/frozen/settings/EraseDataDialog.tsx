import { useEffect, useState } from 'react';
import { deleteDb } from '@data/db/client';
import {
  CeremonialFade,
  DialogShell,
  useSubmitOnce,
} from '@features/frozen';
import styles from './EraseDataDialog.module.css';

const HELD_DISABLED_MS = 600;

export interface EraseDataDialogProps {
  open: boolean;
  /** Fires after IndexedDB has been deleted. Parent routes to Today. */
  onErased: (() => void) | undefined;
  onCancel: (() => void) | undefined;
}

/**
 * Frozen Erase Data dialog. Full-viewport takeover via DialogShell.
 * Primary "Erase." runs `deleteDb()` inside a `useSubmitOnce` guard.
 * Secondary "Cancel." dismisses. Held-disabled beat is longer than the
 * other destructive dialogs — this is the most irreversible action in
 * the product.
 */
export function EraseDataDialog({
  open,
  onErased,
  onCancel,
}: EraseDataDialogProps) {
  const [error, setError] = useState<string>('');
  const [heldOpen, setHeldOpen] = useState(true);
  const guard = useSubmitOnce();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeldOpen(true);
    setError('');
    const t = window.setTimeout(() => setHeldOpen(false), HELD_DISABLED_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  const handleConfirm = async () => {
    setError('');
    try {
      await guard.submit(() => deleteDb());
      if (onErased) onErased();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not erase data.');
    }
  };

  return (
    <DialogShell open={open} label="Erase Data">
      <CeremonialFade visible={open}>
        <div className={styles.stack}>
          <h1 className={styles.title}>Erase all data?</h1>
          <p className={styles.body}>
            Every Promise, every declaration, every note will be gone. This
            cannot be undone.
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
              Erase.
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
