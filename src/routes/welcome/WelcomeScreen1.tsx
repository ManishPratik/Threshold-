import { Link } from 'react-router-dom';
import styles from './WelcomeScreen1.module.css';

/**
 * Screen 1 — Mirror. One sentence, alone. The recognition line was removed
 * per the UX writing pass: naming the reader's internal nod ("You already
 * know this.") shortcuts the moment the reader would create themselves. The
 * headline breathes alone; the CTA appears only after the sentence has landed.
 */
export function WelcomeScreen1() {
  return (
    <section className={styles.screen} aria-labelledby="mirror-heading">
      <h1 id="mirror-heading" className={styles.headline}>
        The hardest promises to keep are the ones you make to yourself.
      </h1>
      <Link to="/welcome/reframe" className={styles.next}>
        <span>Continue</span>
        <span aria-hidden="true" className={styles.arrow}>
          →
        </span>
      </Link>
    </section>
  );
}
