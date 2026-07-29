import { forwardRef, type HTMLAttributes } from 'react';
import styles from './Card.module.css';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  bordered?: boolean;
  elevated?: boolean;
  as?: 'div' | 'article' | 'section';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'md', bordered = true, elevated = false, as: Tag = 'div', className, ...rest },
  ref,
) {
  const classes = [
    styles.card,
    styles[`padding-${padding}`],
    bordered ? styles.bordered : '',
    elevated ? styles.elevated : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag ref={ref} className={classes} {...rest} />;
});
