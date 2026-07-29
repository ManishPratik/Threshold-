import { Card } from '@shared/ui';
import styles from './ShortcutsCard.module.css';

/**
 * Keyboard shortcuts surfaced under the "Application" section.
 * Currently ships one shortcut — the hero Space key on Today. Documenting
 * shortcuts here (rather than a hidden legend) keeps the surface honest.
 */
export function ShortcutsCard() {
  return (
    <Card padding="md" className={styles.card} as="article" aria-labelledby="shortcuts-heading">
      <p className={styles.kicker} id="shortcuts-heading">
        Keyboard shortcuts
      </p>
      <ul className={styles.list}>
        <li className={styles.row}>
          <span className={styles.desc}>Start or resume the current focus on Today</span>
          <span className={styles.kbd}>Space</span>
        </li>
      </ul>
    </Card>
  );
}
