import { Card } from '@shared/ui';
import styles from './AboutSection.module.css';

/**
 * About card — version only. Deliberately quiet; low visual weight per the
 * "Application" section of the Settings brief. Storage lives in its own
 * card under "Your data".
 */
export function AboutSection() {
  return (
    <Card padding="md" className={styles.card} as="article" aria-labelledby="about-heading">
      <div className={styles.row}>
        <div className={styles.text}>
          <p className={styles.kicker} id="about-heading">
            About
          </p>
          <p className={styles.line}>
            Personal OS · v{__APP_VERSION__}
          </p>
          <p className={styles.body}>
            A calm, local-first PWA for keeping promises to yourself.
          </p>
        </div>
      </div>
    </Card>
  );
}
