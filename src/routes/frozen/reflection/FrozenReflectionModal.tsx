import { useState } from 'react';
import type { Declaration } from '@data/types/frozen/Declaration';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import {
  computeDayNumber,
  totalDaysBetween,
  type ISODate,
} from '@shared/lib/date';
import {
  CeremonialFade,
  DeclarationService,
  ModalShell,
  useSubmitOnce,
} from '@features/frozen';
import styles from './FrozenReflectionModal.module.css';

export type FrozenReflectionVariant =
  | 'question'
  | 'kept'
  | 'broken'
  | 'read-only';

export interface FrozenReflectionModalProps {
  open: boolean;
  variant: FrozenReflectionVariant;
  promise: PromiseRecord;
  /** Logical-day target for the declaration (per Engineering Foundations §8). */
  date: ISODate;
  /** Existing declaration, required for the read-only variant. */
  existingDeclaration?: Declaration | null;
  onKeptDeclared?: (declaration: Declaration) => void;
  onBrokenDeclared?: (declaration: Declaration) => void;
  onDismiss?: () => void;
}

/**
 * Frozen Reflection modal. Four variants, one shell — the caller passes
 * `variant` to select the surface. Only the `question` variant writes
 * (via DeclarationService). The `kept`, `broken`, and `read-only`
 * variants render facts and dismiss actions only.
 */
export function FrozenReflectionModal(props: FrozenReflectionModalProps) {
  return (
    <ModalShell open={props.open} label="Reflection">
      <CeremonialFade visible={props.open}>
        {props.variant === 'question' ? (
          <QuestionVariant
            promise={props.promise}
            date={props.date}
            onKeptDeclared={props.onKeptDeclared}
            onBrokenDeclared={props.onBrokenDeclared}
          />
        ) : null}
        {props.variant === 'kept' ? (
          <KeptVariant
            promise={props.promise}
            date={props.date}
            onDismiss={props.onDismiss}
          />
        ) : null}
        {props.variant === 'broken' ? (
          <BrokenVariant
            promise={props.promise}
            date={props.date}
            onDismiss={props.onDismiss}
          />
        ) : null}
        {props.variant === 'read-only' ? (
          <ReadOnlyVariant
            promise={props.promise}
            date={props.date}
            declaration={props.existingDeclaration ?? null}
            onDismiss={props.onDismiss}
          />
        ) : null}
      </CeremonialFade>
    </ModalShell>
  );
}

function formatDeclaredAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return iso;
  }
}

function QuestionVariant({
  promise,
  date,
  onKeptDeclared,
  onBrokenDeclared,
}: {
  promise: PromiseRecord;
  date: ISODate;
  onKeptDeclared: ((declaration: Declaration) => void) | undefined;
  onBrokenDeclared: ((declaration: Declaration) => void) | undefined;
}) {
  const [service] = useState(() => new DeclarationService());
  const [error, setError] = useState<string>('');
  const keptGuard = useSubmitOnce();
  const brokenGuard = useSubmitOnce();

  const handleKept = async () => {
    setError('');
    try {
      const declaration = await keptGuard.submit(() =>
        service.declareKept(promise.id, date),
      );
      if (declaration && onKeptDeclared) onKeptDeclared(declaration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  };

  const handleBroken = async () => {
    setError('');
    try {
      const declaration = await brokenGuard.submit(() =>
        service.declareBroken(promise.id, date),
      );
      if (declaration && onBrokenDeclared) onBrokenDeclared(declaration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  };

  return (
    <div className={styles.stack}>
      <h1 className={styles.title}>{promise.title}</h1>
      <p className={styles.question}>Did you keep your promise today?</p>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => { void handleKept(); }}
          disabled={keptGuard.pending || brokenGuard.pending}
        >
          Yes, I kept it.
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => { void handleBroken(); }}
          disabled={keptGuard.pending || brokenGuard.pending}
        >
          No, I broke it.
        </button>
      </div>
    </div>
  );
}

function dayCounter(promise: PromiseRecord, date: ISODate): {
  dayN: number;
  totalM: number;
} {
  const totalM = totalDaysBetween(promise.startDate, promise.endDate);
  const dayN = Math.min(
    Math.max(computeDayNumber(promise.startDate, date), 1),
    totalM,
  );
  return { dayN, totalM };
}

function KeptVariant({
  promise,
  date,
  onDismiss,
}: {
  promise: PromiseRecord;
  date: ISODate;
  onDismiss: (() => void) | undefined;
}) {
  const { dayN, totalM } = dayCounter(promise, date);
  const isEndDate = date === promise.endDate;
  const fact = isEndDate
    ? `Kept through — Day ${totalM} of ${totalM}.`
    : `Day ${dayN} of ${totalM}.`;
  return (
    <div className={styles.stack}>
      <h1 className={styles.title}>{promise.title}</h1>
      <p className={styles.fact}>{fact}</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => { if (onDismiss) onDismiss(); }}
        >
          Rest well.
        </button>
      </div>
    </div>
  );
}

function BrokenVariant({
  promise,
  date,
  onDismiss,
}: {
  promise: PromiseRecord;
  date: ISODate;
  onDismiss: (() => void) | undefined;
}) {
  const { dayN } = dayCounter(promise, date);
  return (
    <div className={styles.stack}>
      <h1 className={styles.title}>{promise.title}</h1>
      <p className={styles.fact}>Broken on Day {dayN}.</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => { if (onDismiss) onDismiss(); }}
        >
          Continue.
        </button>
      </div>
    </div>
  );
}

function ReadOnlyVariant({
  promise,
  date,
  declaration,
  onDismiss,
}: {
  promise: PromiseRecord;
  date: ISODate;
  declaration: Declaration | null;
  onDismiss: (() => void) | undefined;
}) {
  const { dayN, totalM } = dayCounter(promise, date);
  const factText = (() => {
    if (!declaration) return 'No declaration recorded.';
    if (declaration.verdict === 'kept') {
      return date === promise.endDate
        ? `Kept through — Day ${totalM} of ${totalM}.`
        : `Day ${dayN} of ${totalM}.`;
    }
    return `Broken on Day ${dayN}.`;
  })();
  return (
    <div className={styles.stack}>
      <h1 className={styles.title}>{promise.title}</h1>
      <p className={styles.fact}>{factText}</p>
      {declaration ? (
        <p className={styles.meta}>
          Declared at {formatDeclaredAt(declaration.declaredAt)}
        </p>
      ) : null}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => { if (onDismiss) onDismiss(); }}
        >
          Close.
        </button>
      </div>
    </div>
  );
}
