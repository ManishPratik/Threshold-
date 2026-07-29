import { createElement, forwardRef, type HTMLAttributes } from 'react';
import styles from './Typography.module.css';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg';
export type TextVariant = 'primary' | 'secondary' | 'muted';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  size?: TextSize;
  variant?: TextVariant;
  weight?: TextWeight;
  as?: 'p' | 'span' | 'div' | 'label';
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { size = 'md', variant = 'primary', weight = 'regular', as = 'p', className, ...rest },
  ref,
) {
  const classes = [
    styles.text,
    styles[`size-${size}`],
    styles[`variant-${variant}`],
    styles[`weight-${weight}`],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return createElement(as, { ref, className: classes, ...rest });
});
