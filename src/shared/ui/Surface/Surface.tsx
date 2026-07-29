import { forwardRef, type HTMLAttributes } from 'react';
import styles from './Surface.module.css';

export type SurfaceTone = 'base' | 'subtle' | 'inset';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  as?: 'div' | 'section' | 'article' | 'aside';
}

// A layout primitive for grouping content on a coloured background.
// Unlike Card, Surface has no border/shadow by default and no padding token.
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { tone = 'base', as: Tag = 'div', className, ...rest },
  ref,
) {
  const classes = [styles.surface, styles[`tone-${tone}`], className ?? '']
    .filter(Boolean)
    .join(' ');
  return <Tag ref={ref} className={classes} {...rest} />;
});
