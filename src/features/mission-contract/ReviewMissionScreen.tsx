import { useState } from 'react';
import { Button, Card, Text } from '@shared/ui';
import { formatShortDate } from '@shared/lib/date';
import { projectDraft, type MissionDraft } from './missionContractService';
import styles from './ReviewMissionScreen.module.css';

export interface ReviewMissionScreenProps {
  draft: MissionDraft;
  submitting?: boolean | undefined;
  errorMessage?: string | undefined;
  onBack: () => void;
  onCommit: () => void;
  /**
   * When true, the internal editorial header (kicker + serif title) is not
   * rendered — used by the /welcome/commit route which provides its own
   * screen-level header. Defaults to false so existing callers keep theirs.
   */
  hideHeader?: boolean;
}

export function ReviewMissionScreen({
  draft,
  submitting = false,
  errorMessage,
  onBack,
  onCommit,
  hideHeader = false,
}: ReviewMissionScreenProps) {
  const projection = projectDraft(draft);
  const [confirming, setConfirming] = useState(false);

  return (
    <Card padding="lg" className={styles.card} as="section" {...(hideHeader ? {} : { 'aria-labelledby': 'review-heading' })}>
      {!hideHeader && (
        <div className={styles.header}>
          <p className={styles.kicker}>Review your contract</p>
          <h1 id="review-heading" className={styles.heading}>
            {draft.title.trim()}
          </h1>
        </div>
      )}

      <dl className={styles.list}>
        <div className={styles.row}>
          <dt className={styles.term}>Why now</dt>
          <dd className={styles.def}>{draft.why.trim()}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Refusing to lose</dt>
          <dd className={styles.def}>{draft.refuseToLose.trim()}</dd>
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
        {draft.reward && draft.reward.trim() !== '' && (
          <div className={styles.row}>
            <dt className={styles.term}>Honour</dt>
            <dd className={styles.def}>{draft.reward.trim()}</dd>
          </div>
        )}
      </dl>

      <Text variant="secondary" className={styles.warning}>
        Once you commit, only Notes, Reward, and what you're refusing to lose can be changed. Everything else is locked.
      </Text>

      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
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
          {submitting ? 'Making the promise…' : 'I promise.'}
        </Button>
      </div>
    </Card>
  );
}
