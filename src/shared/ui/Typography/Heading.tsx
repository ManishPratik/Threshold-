import { createElement, forwardRef, type HTMLAttributes } from 'react';
import styles from './Typography.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  /** Optionally render at a different visual size than the semantic level. */
  visualLevel?: HeadingLevel;
}

// Semantic level is required — one <h1> per page. Visual style can be overridden
// via visualLevel without breaking the document outline.
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level, visualLevel, className, ...rest },
  ref,
) {
  const tag = `h${level}` as const;
  const size = visualLevel ?? level;
  const classes = [styles.heading, styles[`h${size}`], className ?? '']
    .filter(Boolean)
    .join(' ');
  return createElement(tag, { ref, className: classes, ...rest });
});
