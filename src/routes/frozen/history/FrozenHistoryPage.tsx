import { useEffect, useState } from 'react';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import {
  computeDayNumber,
  humanDate,
  totalDaysBetween,
  type ISODate,
} from '@shared/lib/date';
import {
  currentLogicalDate,
  getLogicalDate,
} from '@shared/lib/dayBoundary';
import { PromiseService } from '@features/frozen';
import styles from './FrozenHistoryPage.module.css';

export interface FrozenHistoryPageProps {
  /** Fires when the user taps a PromiseCard. */
  onPromiseTap: ((promiseId: string) => void) | undefined;
}

type OutcomeKind = 'kept' | 'broken' | 'active';

interface OutcomeDescriptor {
  kind: OutcomeKind;
  text: string;
}

/**
 * Frozen History page. Renders every Promise the user has ever made, in
 * reverse-chronological order by `activatedAt` (most recent first).
 * Each card carries attempt number, title, humanised dates, and an
 * outcome line tinted by outcome (accent / warning / ink-primary).
 * The empty state renders a single centred sentence.
 */
export function FrozenHistoryPage({ onPromiseTap }: FrozenHistoryPageProps) {
  const [loading, setLoading] = useState(true);
  const [promises, setPromises] = useState<PromiseRecord[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const service = new PromiseService();
    let cancelled = false;

    (async () => {
      try {
        const all = await service.listPromises();
        if (cancelled) return;
        setPromises([...all].sort(byActivatedAtDesc));
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load History.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className={styles.loading}>Loading.</p>;
  }

  if (promises.length === 0) {
    return (
      <div className={styles.column}>
        <p className={styles.emptyLine}>
          You haven&apos;t made a promise yet.
        </p>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const today = currentLogicalDate();

  return (
    <div className={styles.column}>
      <p className={styles.eyebrow}>Your promises</p>
      <ul className={styles.list}>
        {promises.map((promise) => (
          <li key={promise.id} className={styles.item}>
            <PromiseCard
              promise={promise}
              today={today}
              onTap={onPromiseTap}
            />
          </li>
        ))}
      </ul>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PromiseCard({
  promise,
  today,
  onTap,
}: {
  promise: PromiseRecord;
  today: ISODate;
  onTap: ((promiseId: string) => void) | undefined;
}) {
  const outcome = safeDescribeOutcome(promise, today);
  const outcomeClass =
    outcome.kind === 'kept'
      ? `${styles.outcome} ${styles.outcomeKept}`
      : outcome.kind === 'broken'
        ? `${styles.outcome} ${styles.outcomeBroken}`
        : `${styles.outcome} ${styles.outcomeActive}`;

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => {
        if (onTap) onTap(promise.id);
      }}
      aria-label={`Attempt ${promise.attemptNumber}, ${promise.title}`}
      title={promise.title}
    >
      <p className={styles.attempt}>Attempt {promise.attemptNumber}</p>
      <p className={styles.title}>{promise.title}</p>
      <p className={styles.dates}>
        {safeHumanDate(promise.startDate)} – {safeHumanDate(promise.endDate)}
      </p>
      <p className={outcomeClass}>{outcome.text}</p>
    </button>
  );
}

/**
 * Never-throw wrapper around `humanDate`. Guards against legacy or
 * hand-injected Promise rows where `startDate` / `endDate` is missing,
 * null, or otherwise not a valid ISO string per `personal-os/src/shared/lib/date.ts:138-150`.
 * Returns an em-dash for any input the formatter cannot render.
 */
function safeHumanDate(iso: ISODate | null | undefined): string {
  if (typeof iso !== 'string' || iso.length === 0) return '—';
  try {
    return humanDate(iso);
  } catch {
    return '—';
  }
}

/**
 * Never-throw wrapper around `describeOutcome`. Guards downstream date
 * math at `personal-os/src/shared/lib/date.ts:66-101` from throwing on
 * legacy rows missing `startDate` or `endDate`. On failure returns an
 * inert active-status descriptor so History renders the row without
 * crashing the entire list.
 */
function safeDescribeOutcome(
  promise: PromiseRecord,
  today: ISODate,
): OutcomeDescriptor {
  try {
    return describeOutcome(promise, today);
  } catch {
    return { kind: 'active', text: '—' };
  }
}

function byActivatedAtDesc(a: PromiseRecord, b: PromiseRecord): number {
  if (a.activatedAt === b.activatedAt) return 0;
  return a.activatedAt < b.activatedAt ? 1 : -1;
}

function describeOutcome(
  promise: PromiseRecord,
  today: ISODate,
): OutcomeDescriptor {
  if (promise.completedAt !== undefined) {
    const total = totalDaysBetween(promise.startDate, promise.endDate);
    return {
      kind: 'kept',
      text: `Kept through — Day ${total} of ${total}`,
    };
  }
  if (promise.brokenAt !== undefined) {
    const endedDay = computeEndedDay(promise);
    const suffix = endedDay !== undefined ? ` on Day ${endedDay}` : '';
    if (promise.brokenKind === 'broken-by-choice') {
      return { kind: 'broken', text: `Broken by choice${suffix}` };
    }
    return { kind: 'broken', text: `Broken${suffix}` };
  }
  const total = totalDaysBetween(promise.startDate, promise.endDate);
  const dayN = computeDayNumber(promise.startDate, today);
  return {
    kind: 'active',
    text: `Day ${Math.min(Math.max(dayN, 0), total)} of ${total}`,
  };
}

function computeEndedDay(promise: PromiseRecord): number | undefined {
  if (promise.brokenAt === undefined) return undefined;
  const brokenAt = new Date(promise.brokenAt);
  if (Number.isNaN(brokenAt.getTime())) return undefined;
  const brokenLogicalDate = getLogicalDate(brokenAt);
  const day = computeDayNumber(promise.startDate, brokenLogicalDate);
  return day > 0 ? day : undefined;
}
