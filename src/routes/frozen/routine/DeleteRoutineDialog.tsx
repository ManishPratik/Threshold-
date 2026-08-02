import { useEffect, useState } from 'react';
import {
  CeremonialFade,
  DialogShell,
  RoutineService,
  useSubmitOnce,
} from '@features/frozen';
import styles from './DeleteRoutineDialog.module.css';

const HELD_DISABLED_MS = 400;

export interface DeleteRoutineDialogProps {
  open: boolean;
  promiseId: string;
  onDeleted: (() => void) | undefined;
  onCancel: (() => void) | undefined;
}

/**
 * Frozen Delete Routine dialog. Full-viewport takeover via DialogShell.
 * Primary "Delete routine." runs `RoutineService.deleteRoutine(promiseId)`
 * inside a `useSubmitOnce` guard — the service cascades to
 * BlockCompletions inside a single atomic transaction. Secondary
 * "Cancel." dismisses. Held-disabled beat on open guards the primary
 * against accidental confirm.
 */
export function DeleteRoutineDialog({
  open,
  promiseId,
  onDeleted,
  onCancel,
}: DeleteRoutineDialogProps) {
  const [service] = useState(() => new RoutineService());
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
      await guard.submit(() => service.deleteRoutine(promiseId));
      if (onDeleted) onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete routine.');
    }
  };

  return (
    <DialogShell open={open} label="Delete Routine">
      <CeremonialFade visible={open}>
        <div className={styles.stack}>
          <h1 className={styles.title}>Delete routine?</h1>
          <p className={styles.body}>
            Blocks will be removed. Today&apos;s declarations are not affected.
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
              Delete routine.
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
