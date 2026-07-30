import type { ReactNode } from 'react';
import styles from './WelcomeFormShell.module.css';

export interface WelcomeFormShellProps {
  kicker: string;
  /** Headline text. The last character is rendered in terracotta as the accent. */
  headline: string;
  /** Optional italic subline beneath the headline. */
  sub?: string;
  /** aria-labelledby target for the section landmark. */
  headingId: string;
  children: ReactNode;
}

/**
 * Shared editorial shell for /welcome/promise, /welcome/routine, /welcome/commit.
 * Renders the kicker + serif headline (with terracotta accent on the last char)
 * + optional italic sub, then the form card beneath in a fade-lift sequence.
 * Reused by all three form screens so voice and spacing are identical.
 */
export function WelcomeFormShell({
  kicker,
  headline,
  sub,
  headingId,
  children,
}: WelcomeFormShellProps) {
  const trimmed = headline.trim();
  const last = trimmed.slice(-1);
  const head = trimmed.slice(0, -1);
  const shouldAccentLast = /[.?!]/.test(last);

  return (
    <section className={styles.screen} aria-labelledby={headingId}>
      <header className={styles.header}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 id={headingId} className={styles.headline}>
          {shouldAccentLast ? (
            <>
              {head}
              <span className={styles.punct}>{last}</span>
            </>
          ) : (
            trimmed
          )}
        </h1>
        {sub ? <p className={styles.sub}>{sub}</p> : null}
      </header>
      <div className={styles.formSlot}>{children}</div>
    </section>
  );
}
