import { useEffect, useState } from 'react';
import type { Declaration } from '@data/types/frozen/Declaration';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import { addDays, computeDayNumber, humanDate, type ISODate } from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import { DeclarationService, PromiseService } from '@features/frozen';
import styles from './FrozenChainPage.module.css';

export type DayRowStatus = 'awaiting' | 'kept' | 'broken';

export interface FrozenChainPageProps {
  promiseId: string;
  onDayTap: ((date: ISODate) => void) | undefined;
}

/**
 * Frozen Chain page. Renders the full arc of a Promise as one DayRow per
 * logical day between `startDate` and `endDate` inclusive. Status glyph
 * is derived from the day's Declaration (kept, broken) or the absence of
 * one (awaiting). Future rows are disabled — the caller only routes on
 * past and today rows.
 */
export function FrozenChainPage({ promiseId, onDayTap }: FrozenChainPageProps) {
  const [loading, setLoading] = useState(true);
  const [promise, setPromise] = useState<PromiseRecord | null>(null);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const promiseService = new PromiseService();
    const declarationService = new DeclarationService();
    let cancelled = false;

    (async () => {
      try {
        const [p, decls] = await Promise.all([
          promiseService.getPromiseById(promiseId),
          declarationService.listDeclarationsForPromise(promiseId),
        ]);
        if (cancelled) return;
        setPromise(p ?? null);
        setDeclarations(decls);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load Chain.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [promiseId]);

  if (loading) {
    return <p className={styles.loading}>Loading.</p>;
  }
  if (!promise) {
    return (
      <div className={styles.column}>
        <p className={styles.notFound}>Promise not found.</p>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const today = currentLogicalDate();
  const days = buildDayList(promise);
  const declMap = new Map(declarations.map((d) => [d.date, d]));
  const header = describeHeader(promise, today, days.length);

  return (
    <div className={styles.column}>
      <h1 className={styles.title}>{promise.title}</h1>
      <p className={styles.header}>{header}</p>
      <ul className={styles.list}>
        {days.map((day, idx) => {
          const declaration = declMap.get(day);
          const status: DayRowStatus = declaration
            ? declaration.verdict
            : 'awaiting';
          const isFuture = day > today;
          const isToday = day === today;
          const dayNumber = idx + 1;
          const label = `Day ${dayNumber}, ${humanDate(day)}, ${status}`;
          const glyphClass =
            status === 'kept'
              ? `${styles.glyph} ${styles.glyphKept}`
              : status === 'broken'
                ? `${styles.glyph} ${styles.glyphBroken}`
                : styles.glyph;
          const dayLabelClass = isToday
            ? `${styles.dayLabel} ${styles.dayLabelToday}`
            : styles.dayLabel;
          return (
            <li key={day} className={styles.item}>
              <button
                type="button"
                className={styles.row}
                onClick={() => {
                  if (isFuture) return;
                  if (onDayTap) onDayTap(day);
                }}
                disabled={isFuture}
                aria-label={label}
              >
                <span className={glyphClass} aria-hidden="true">
                  {status === 'broken' ? '✕' : ''}
                </span>
                <span className={dayLabelClass}>Day {dayNumber}</span>
                <span className={styles.date}>{humanDate(day)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Build the ordered list of logical dates from `startDate` through
 * `endDate` inclusive. Bounded internally by a large safety cap so a
 * malformed promise cannot produce an infinite loop.
 */
function buildDayList(promise: PromiseRecord): ISODate[] {
  const list: ISODate[] = [];
  let cursor = promise.startDate;
  const bound = promise.endDate;
  let safety = 0;
  while (cursor <= bound && safety < 10000) {
    list.push(cursor);
    cursor = addDays(cursor, 1);
    safety += 1;
  }
  return list;
}

function describeHeader(
  promise: PromiseRecord,
  today: ISODate,
  totalDays: number,
): string {
  if (promise.completedAt !== undefined) {
    return `Kept through — Day ${totalDays} of ${totalDays}`;
  }
  if (promise.brokenAt !== undefined) {
    const kind =
      promise.brokenKind === 'broken-by-choice'
        ? 'broken by choice'
        : 'broken';
    return `Ended — ${kind}`;
  }
  const dayN = computeDayNumber(promise.startDate, today);
  const clamped = Math.min(Math.max(dayN, 0), totalDays);
  return `Day ${clamped} of ${totalDays}`;
}
