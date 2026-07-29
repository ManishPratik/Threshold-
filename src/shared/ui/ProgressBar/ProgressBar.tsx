import { forwardRef, type HTMLAttributes } from 'react';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** 0..1. Clamped. */
  value: number;
  /** Accessible label describing what is progressing. Required. */
  label: string;
}

// Slim horizontal bar. Uses role="progressbar" with ARIA values for screen readers.
// No text or numeric readout — that lives in the surrounding component.
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
  { value, label, className, ...rest },
  ref,
) {
  const clamped = Math.min(1, Math.max(0, value));
  const percent = Math.round(clamped * 100);

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={`${styles.track} ${className ?? ''}`}
      {...rest}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
});
