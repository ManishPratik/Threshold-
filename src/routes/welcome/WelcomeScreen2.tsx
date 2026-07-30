import { Link } from 'react-router-dom';
import styles from './WelcomeScreen2.module.css';

/**
 * Screen 2 — Reframe. Renames the user's problem from "discipline" to "trust".
 * Kept: the headline (the ONE sentence to remember) plus a single supporting
 * metaphor that concretises what trust means. Removed in the UX writing pass:
 * the accrual paragraph (redundant once the friend metaphor lands) and the
 * product-name paragraph (silence about the product is stronger than naming it
 * — the product introduces itself through use).
 */
export function WelcomeScreen2() {
  return (
    <section className={styles.screen} aria-labelledby="reframe-heading">
      <h1 id="reframe-heading" className={styles.headline}>
        <span className={styles.headlineLine1}>It&rsquo;s not discipline you need.</span>
        <span className={styles.headlineLine2}>It&rsquo;s trust.</span>
      </h1>

      <p className={styles.metaphor}>
        The way you trust a friend who always shows up — that&rsquo;s how you can
        learn to trust yourself.
      </p>

      <Link to="/welcome/promise" className={styles.next}>
        <span>I want to try</span>
        <span aria-hidden="true" className={styles.arrow}>
          →
        </span>
      </Link>
    </section>
  );
}
