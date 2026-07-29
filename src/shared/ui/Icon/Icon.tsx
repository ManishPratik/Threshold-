import { forwardRef, type SVGAttributes, type ReactNode } from 'react';
import styles from './Icon.module.css';

export type IconSize = 'sm' | 'md' | 'lg';

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  /** Accessible label. Required unless decorative. */
  label?: string;
  /** Mark decorative icons so screen readers skip them. */
  decorative?: boolean;
  size?: IconSize;
  children: ReactNode;
}

// Thin wrapper around inline SVG. Enforces the accessibility contract:
// either provide a label OR mark it decorative — never both, never neither.
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { label, decorative = false, size = 'md', className, children, viewBox = '0 0 24 24', ...rest },
  ref,
) {
  if (!decorative && !label) {
    throw new Error('Icon requires either a `label` prop or `decorative` set to true.');
  }

  const classes = [styles.icon, styles[`size-${size}`], className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      ref={ref}
      className={classes}
      viewBox={viewBox}
      role={decorative ? 'presentation' : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      focusable={false}
      {...rest}
    >
      {children}
    </svg>
  );
});
