import type { ReactNode } from 'react';
import styles from './DialogShell.module.css';
import { useFocusTrap } from './useFocusTrap';

export interface DialogShellProps {
  open: boolean;
  /** Screen-reader label for the alertdialog element. */
  label: string;
  children: ReactNode;
}

/**
 * Frozen-architecture DialogShell — full-viewport alertdialog surface
 * for destructive confirmations. `role="alertdialog"` signals the
 * elevated-attention nature of the surface to assistive tech.
 *
 * Focus is trapped inside the dialog via `useFocusTrap` — Tab and
 * Shift+Tab cycle only within the ceremonial column, and the previously
 * focused element is restored on close. On dialogs with a held-disabled
 * destructive primary, the trap skips the disabled button and defaults
 * focus to Cancel until the beat elapses.
 *
 * No destructive behaviour lives here — the caller wires the confirm
 * button to its own service call. This shell only frames the content.
 */
export function DialogShell({ open, label, children }: DialogShellProps) {
  const ref = useFocusTrap<HTMLDivElement>(open);
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="alertdialog"
      aria-modal="true"
      aria-label={label}
      className={styles.overlay}
    >
      <div className={styles.column}>{children}</div>
    </div>
  );
}
