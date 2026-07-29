import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Text, TextArea } from '@shared/ui';
import type { ReviewKind, ReviewAnswer } from '@data/types/Review';
import type { ISODate } from '@shared/lib/date';
import { promptsFor } from './prompts';
import { formatPeriodLabel } from './periods';
import {
  ANSWER_MAX_LENGTH,
  ReviewsServiceError,
  reviewsService,
} from './reviewsService';
import styles from './ReviewEditor.module.css';

export interface ReviewEditorProps {
  kind: ReviewKind;
  periodStart: ISODate;
  today: ISODate;
  onSaved: () => void;
  onCancel: () => void;
  /** Rendering variant: 'card' for standalone use, 'inline' for embedding inside another card (e.g. Daily on Today). */
  variant?: 'card' | 'inline';
}

const KIND_HEADING: Record<ReviewKind, string> = {
  daily: 'Daily review',
  weekly: 'Weekly review',
  monthly: 'Monthly review',
};

/**
 * Shared form for all three review kinds. Loads any existing review for the
 * (kind, periodStart) pair on mount so users see their prior answers when
 * amending. Save submits (the service treats submit=true as idempotent).
 */
export function ReviewEditor({
  kind,
  periodStart,
  today,
  onSaved,
  onCancel,
  variant = 'card',
}: ReviewEditorProps) {
  const prompts = useMemo(() => promptsFor(kind), [kind]);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const p of prompts) initial[p.id] = '';
    return initial;
  });
  const [loading, setLoading] = useState(true);
  const [submittedAlready, setSubmittedAlready] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const existing = await reviewsService.getReviewForPeriod(kind, periodStart);
        if (cancelled) return;
        if (existing) {
          const map: Record<string, string> = {};
          for (const p of prompts) map[p.id] = '';
          for (const a of existing.answers) {
            if (map[a.promptId] !== undefined) map[a.promptId] = a.answer;
          }
          setAnswers(map);
          setSubmittedAlready(existing.submitted);
        }
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load review.');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, periodStart, prompts]);

  const handleSave = () => {
    setError(undefined);
    setSaving(true);
    const payload: ReviewAnswer[] = prompts.map((p) => ({
      promptId: p.id,
      answer: answers[p.id] ?? '',
    }));
    void (async () => {
      try {
        await reviewsService.saveReview({
          kind,
          periodStart,
          answers: payload,
          submit: true,
        });
        setSaving(false);
        onSaved();
      } catch (e) {
        setSaving(false);
        setError(
          e instanceof ReviewsServiceError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Save failed.',
        );
      }
    })();
  };

  const label = formatPeriodLabel(kind, periodStart, today);

  const HeadingTag = variant === 'card' ? 'h1' : 'h2';

  const body = (
    <>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{label}</p>
        <HeadingTag className={styles.title}>{KIND_HEADING[kind]}</HeadingTag>
        {submittedAlready && (
          <Text size="sm" variant="secondary" className={styles.submittedFlag}>
            Previously submitted — amending is fine.
          </Text>
        )}
      </header>

      <div className={styles.form}>
        {loading ? (
          <p className={styles.loading}>Loading…</p>
        ) : (
          prompts.map((p) => (
            <TextArea
              key={p.id}
              label={p.text}
              value={answers[p.id] ?? ''}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [p.id]: e.target.value }))
              }
              maxLength={ANSWER_MAX_LENGTH}
              rows={4}
            />
          ))
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Saving…' : submittedAlready ? 'Save changes' : 'Save review'}
          </Button>
        </div>
      </div>
    </>
  );

  if (variant === 'card') {
    return (
      <Card padding="lg" className={styles.card} as="section">
        {body}
      </Card>
    );
  }
  return <div className={styles.inline}>{body}</div>;
}
