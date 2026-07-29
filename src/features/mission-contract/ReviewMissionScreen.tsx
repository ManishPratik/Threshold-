import { useState } from 'react';
import { Button, Card, Heading, Text } from '@shared/ui';
import { formatShortDate } from '@shared/lib/date';
import { projectDraft, type MissionDraft } from './missionContractService';
import styles from './ReviewMissionScreen.module.css';

export interface ReviewMissionScreenProps {
  draft: MissionDraft;
  submitting?: boolean | undefined;
  errorMessage?: string | undefined;
  onBack: () => void;
  onCommit: () => void;
}

export function ReviewMissionScreen({
  draft,
  submitting = false,
  errorMessage,
  onBack,
  onCommit,
}: ReviewMissionScreenProps) {
  const projection = projectDraft(draft);
  const [confirming, setConfirming] = useState(false);

  return (
    <Card padding="lg" className={styles.card} as="section" aria-labelledby="review-heading">
      <Text size="sm" variant="muted" className={styles.eyebrow}>
        Review your contract
      </Text>
      <Heading level={1} id="review-heading" className={styles.heading}>
        {draft.title.trim()}
      </Heading>

      <dl className={styles.list}>
        <div className={styles.row}>
          <dt className={styles.term}>Why</dt>
          <dd className={styles.def}>{draft.why.trim()}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Duration</dt>
          <dd className={styles.def}>
            {projection.totalDays} day{projection.totalDays === 1 ? '' : 's'}
          </dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Start</dt>
          <dd className={styles.def}>{formatShortDate(projection.startDate)}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>End</dt>
          <dd className={styles.def}>{formatShortDate(projection.endDate)}</dd>
        </div>
      </dl>

      <Text variant="secondary" className={styles.warning}>
        Once you commit, only Notes and Reward can be changed. Everything else is locked.
      </Text>

      {errorMessage && (
        <Text variant="secondary" role="alert" className={styles.error}>
          {errorMessage}
        </Text>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => {
            setConfirming(true);
            onCommit();
          }}
          disabled={submitting || confirming}
        >
          {submitting ? 'Committing…' : 'I commit'}
        </Button>
      </div>
    </Card>
  );
}
