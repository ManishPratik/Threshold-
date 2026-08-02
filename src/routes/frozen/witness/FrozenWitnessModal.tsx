import { useState } from 'react';
import type { Principle } from '@data/types/Principle';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import { humanDate, type ISODate, type ISODateTime } from '@shared/lib/date';
import {
  CeremonialFade,
  ModalShell,
  PromiseService,
  useSubmitOnce,
} from '@features/frozen';
import styles from './FrozenWitnessModal.module.css';

export interface WitnessDraft {
  title: string;
  why: string;
  stake: string;
  principles: Principle[];
  honour?: string;
  startDate: ISODate;
  endDate: ISODate;
  /** Exact moment the user pressed "Make this Promise." */
  promisedAt: ISODateTime;
}

export interface FrozenWitnessModalProps {
  open: boolean;
  draft: WitnessDraft;
  onWitnessed: ((created: PromiseRecord) => void) | undefined;
  onGoBack: (() => void) | undefined;
}

/**
 * Frozen Witness Ritual modal. Terminal step of promise-creation.
 * Renders a read-only echo of every authored field, plus two actions:
 * primary "Make this Promise." commits the Promise + AppState pointer
 * inside a single atomic transaction via PromiseService; secondary
 * "Revise." text link returns to the promise-creation flow.
 */
export function FrozenWitnessModal({
  open,
  draft,
  onWitnessed,
  onGoBack,
}: FrozenWitnessModalProps) {
  const [service] = useState(() => new PromiseService());
  const [error, setError] = useState<string>('');
  const guard = useSubmitOnce();

  const handleCommit = async () => {
    setError('');
    try {
      const created = await guard.submit(() =>
        service.createPromise({
          title: draft.title,
          why: draft.why,
          stake: draft.stake,
          principles: draft.principles,
          startDate: draft.startDate,
          endDate: draft.endDate,
          promisedAt: draft.promisedAt,
          ...(draft.honour !== undefined ? { honour: draft.honour } : {}),
        }),
      );
      if (created && onWitnessed) onWitnessed(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not make promise.');
    }
  };

  return (
    <ModalShell open={open} label="Witness">
      <CeremonialFade visible={open}>
        <div className={styles.stack}>
          <h1 className={styles.title}>{draft.title}</h1>

          <section className={styles.section} aria-label="Why now">
            <p className={styles.eyebrow}>Why now</p>
            <p className={styles.reading}>{draft.why}</p>
          </section>

          <section className={styles.section} aria-label="What you refuse to lose">
            <p className={styles.eyebrow}>What you refuse to lose</p>
            <p className={styles.reading}>{draft.stake}</p>
          </section>

          {draft.principles.length > 0 ? (
            <section className={styles.section} aria-label="Principles">
              <p className={styles.eyebrow}>Principles</p>
              <ul className={styles.principlesList}>
                {draft.principles.map((p) => (
                  <li key={p.id}>{p.text}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {draft.honour !== undefined ? (
            <section className={styles.section} aria-label="Your honour on keeping this">
              <p className={styles.eyebrow}>Your honour on keeping this</p>
              <p className={styles.reading}>{draft.honour}</p>
            </section>
          ) : null}

          <section className={styles.section} aria-label="Dates">
            <p className={styles.eyebrow}>Dates</p>
            <p className={styles.dates}>
              {humanDate(draft.startDate)} – {humanDate(draft.endDate)}
            </p>
          </section>

          <div className={styles.ceremonyGap} aria-hidden="true" />

          {error ? <p className={styles.error} role="alert">{error}</p> : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => { void handleCommit(); }}
              disabled={guard.pending}
            >
              Make this Promise.
            </button>
            <button
              type="button"
              className={styles.textLink}
              onClick={() => { if (onGoBack) onGoBack(); }}
              disabled={guard.pending}
            >
              Revise.
            </button>
          </div>
        </div>
      </CeremonialFade>
    </ModalShell>
  );
}
