import { useState } from 'react';
import { Button, Card, Text, CheckGlyph } from '@shared/ui';
import type { RoutineBlock } from '@data/types/Routine';
import styles from './SecondaryBlockCard.module.css';

export interface SecondaryBlockCardProps {
  block: RoutineBlock;
  /** Marks this specific block complete. Awaits the caller so this component
   *  can disable itself during the write and re-enable on error. */
  onComplete: (blockId: string) => Promise<void>;
}

const TYPE_LABEL: Record<RoutineBlock['type'], string> = {
  focus: 'Focus block',
  break: 'Break',
  ritual: 'Ritual',
};

/**
 * A calm, secondary card for a routine block that lives *below* the hero
 * "Your only focus" surface. Renders label, duration/type meta, and a small
 * "Mark complete" button. No hero styling, no serif title, no auto-advance
 * animation — this is deliberately a quieter surface so the recommended
 * block on the hero remains dominant.
 *
 * The card owns a local `pending` flag that guards against double-taps by
 * disabling the button while its own async write is in flight. The hook
 * additionally guards at the domain level (per-block in-flight Set).
 */
export function SecondaryBlockCard({ block, onComplete }: SecondaryBlockCardProps) {
  const [pending, setPending] = useState(false);

  const handleClick = () => {
    if (pending) return;
    setPending(true);
    void (async () => {
      try {
        await onComplete(block.id);
      } finally {
        // If the component is unmounted mid-write (block leaves the open list
        // after successful completion) React will warn — the caller unmounts
        // us on success, so a short-lived setState after unmount is possible.
        // We accept that trade-off; the alternative (a ref) would still race.
        setPending(false);
      }
    })();
  };

  return (
    <Card padding="md" className={styles.card} as="article" aria-label={block.label}>
      <div className={styles.row}>
        <div className={styles.info}>
          <Text as="span" size="md" weight="semibold" className={styles.label}>
            {block.label}
          </Text>
          <Text as="span" size="sm" variant="secondary" className={styles.meta}>
            <span>{block.durationMinutes} min</span>
            <span className={styles.metaDot} aria-hidden="true" />
            <span>{TYPE_LABEL[block.type]}</span>
            {block.expectedStart ? (
              <>
                <span className={styles.metaDot} aria-hidden="true" />
                <span>Scheduled {block.expectedStart}</span>
              </>
            ) : null}
          </Text>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleClick}
          disabled={pending}
          className={styles.cta}
        >
          <CheckGlyph size="sm" decorative />
          {pending ? 'Marking…' : 'Mark complete'}
        </Button>
      </div>
    </Card>
  );
}
