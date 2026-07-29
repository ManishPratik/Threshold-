import { Button, Text } from '@shared/ui';
import styles from './UpdatePrompt.module.css';

export interface UpdatePromptProps {
  visible: boolean;
  updating: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

/**
 * Calm bar at the bottom of the app shell when a new SW version is waiting.
 * Renders nothing when hidden — no offscreen DOM. Two actions: dismiss for
 * this update, or reload to activate. No motion, no gradient, no icons —
 * the affordance is the words.
 */
export function UpdatePrompt({ visible, updating, onUpdate, onDismiss }: UpdatePromptProps) {
  if (!visible) return null;
  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <Text as="span" size="sm" className={styles.text}>
        A new version is available.
      </Text>
      <div className={styles.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss} disabled={updating}>
          Not now
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onUpdate} disabled={updating}>
          {updating ? 'Updating…' : 'Update'}
        </Button>
      </div>
    </div>
  );
}
