import type { ReactNode } from 'react';
import styles from './ModalShell.module.css';
import { useFocusTrap } from './useFocusTrap';

export interface ModalShellProps {
  open: boolean;
  /** Screen-reader label for the dialog element. */
  label: string;
  children: ReactNode;
}

/**
 * Frozen-architecture ModalShell — full-viewport ceremonial overlay.
 * Renders a `role="dialog"` container with `aria-modal="true"` and the
 * caller's label when `open` is true; renders nothing when `open` is
 * false. Applies the paper vignette, centred content column, scroll,
 * and fade-in via the co-located module stylesheet.
 *
 * Focus is trapped inside the dialog via `useFocusTrap`: Tab and
 * Shift+Tab cycle only within the ceremonial column, and the previously
 * focused element is restored on close. Escape does NOT dismiss —
 * modal dismiss belongs to the caller per Engineering Foundations §5.
 */
export function ModalShell({ open, label, children }: ModalShellProps) {
  const ref = useFocusTrap<HTMLDivElement>(open);
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={styles.overlay}
    >
      <div className={styles.column}>{children}</div>
    </div>
  );
}
