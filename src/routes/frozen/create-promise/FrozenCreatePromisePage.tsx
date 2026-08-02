import { useEffect, useState } from 'react';
import type { Principle } from '@data/types/Principle';
import type { ISODate } from '@shared/lib/date';
import { nowIso } from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import { PromiseService } from '@features/frozen';
import { FrozenWitnessModal, type WitnessDraft } from '../witness';
import styles from './FrozenCreatePromisePage.module.css';

const MAX_PRINCIPLES = 5;

export interface FrozenCreatePromisePageProps {
  onCreated: ((promiseId: string) => void) | undefined;
  onCancel: (() => void) | undefined;
}

/**
 * Frozen Create Promise flow. Local form for the user to author every
 * Promise field, then a "Read it back." action that opens the
 * FrozenWitnessModal with the composed draft. Witness commits via
 * PromiseService; the parent's `onCreated` fires with the new Promise id.
 */
export function FrozenCreatePromisePage({
  onCreated,
  onCancel,
}: FrozenCreatePromisePageProps) {
  // Default start/end date == the app's logical day (04:00 boundary),
  // NOT the wall-clock calendar day. Using todayLocal() here would let a
  // 02:00 user land on a startDate one day ahead of the rest of the
  // app's "today", producing a transient Day 0 until 04:00 flips.
  const today = currentLogicalDate();
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [stake, setStake] = useState('');
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [honour, setHonour] = useState('');
  const [startDate, setStartDate] = useState<ISODate>(today);
  const [endDate, setEndDate] = useState<ISODate>(today);
  const [witnessOpen, setWitnessOpen] = useState(false);
  const [witnessDraft, setWitnessDraft] = useState<WitnessDraft | null>(null);
  const [error, setError] = useState<string>('');
  const [isFirstEver, setIsFirstEver] = useState<boolean>(true);

  useEffect(() => {
    const service = new PromiseService();
    let cancelled = false;
    (async () => {
      const all = await service.listPromises();
      if (cancelled) return;
      setIsFirstEver(all.length === 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmed = {
    title: title.trim(),
    why: why.trim(),
    stake: stake.trim(),
    honour: honour.trim(),
  };
  const validationError = validateDraft({
    title: trimmed.title,
    why: trimmed.why,
    stake: trimmed.stake,
    startDate,
    endDate,
  });
  const canContinue = validationError === null;

  const handleAddPrinciple = () => {
    if (principles.length >= MAX_PRINCIPLES) return;
    setPrinciples([...principles, { id: crypto.randomUUID(), text: '' }]);
  };

  const handleUpdatePrinciple = (id: string, text: string) => {
    setPrinciples(principles.map((p) => (p.id === id ? { ...p, text } : p)));
  };

  const handleRemovePrinciple = (id: string) => {
    setPrinciples(principles.filter((p) => p.id !== id));
  };

  const handleContinue = () => {
    setError('');
    if (validationError !== null) {
      setError(validationError);
      return;
    }
    const cleanedPrinciples = principles
      .map((p) => ({ id: p.id, text: p.text.trim() }))
      .filter((p) => p.text.length > 0);
    const draft: WitnessDraft = {
      title: trimmed.title,
      why: trimmed.why,
      stake: trimmed.stake,
      principles: cleanedPrinciples,
      startDate,
      endDate,
      promisedAt: nowIso(),
      ...(trimmed.honour.length > 0 ? { honour: trimmed.honour } : {}),
    };
    setWitnessDraft(draft);
    setWitnessOpen(true);
  };

  return (
    <div className={styles.column}>
      <h1 className={styles.hero}>
        {isFirstEver ? 'Your first promise.' : 'A new promise.'}
      </h1>
      {isFirstEver ? (
        <p className={styles.subtitle}>
          Make a promise to yourself. Every day for the length of it, you
          declare kept or broken. The record stays.
        </p>
      ) : null}

      <div className={styles.field}>
        <label className={styles.eyebrow} htmlFor="cp-title">
          The promise
        </label>
        <input
          id="cp-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.eyebrow} htmlFor="cp-why">
          Why now
        </label>
        <textarea
          id="cp-why"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          className={styles.textarea}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.eyebrow} htmlFor="cp-stake">
          What you refuse to lose
        </label>
        <textarea
          id="cp-stake"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          className={styles.textarea}
        />
      </div>

      <div className={styles.field}>
        <p className={styles.eyebrow}>Principles</p>
        <ul className={styles.principlesList}>
          {principles.map((p) => (
            <li key={p.id} className={styles.principleRow}>
              <input
                type="text"
                value={p.text}
                onChange={(e) => handleUpdatePrinciple(p.id, e.target.value)}
                aria-label="Principle text"
                className={styles.input}
              />
              <button
                type="button"
                className={`${styles.miniLink} ${styles.miniLinkWarning}`}
                onClick={() => handleRemovePrinciple(p.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.addPrincipleRow}>
          <button
            type="button"
            className={styles.miniLink}
            onClick={handleAddPrinciple}
            disabled={principles.length >= MAX_PRINCIPLES}
          >
            Add principle.
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.eyebrow} htmlFor="cp-honour">
          Your honour on keeping this (optional)
        </label>
        <input
          id="cp-honour"
          type="text"
          value={honour}
          onChange={(e) => setHonour(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.datesRow}>
        <div className={styles.field}>
          <label className={styles.eyebrow} htmlFor="cp-start">
            Start date
          </label>
          <input
            id="cp-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.eyebrow} htmlFor="cp-end">
            End date
          </label>
          <input
            id="cp-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Read it back.
        </button>
        <button
          type="button"
          className={styles.textLink}
          onClick={() => {
            if (onCancel) onCancel();
          }}
        >
          Cancel.
        </button>
      </div>

      {witnessDraft !== null ? (
        <FrozenWitnessModal
          open={witnessOpen}
          draft={witnessDraft}
          onWitnessed={(created) => {
            setWitnessOpen(false);
            if (onCreated) onCreated(created.id);
          }}
          onGoBack={() => setWitnessOpen(false)}
        />
      ) : null}
    </div>
  );
}

function validateDraft(input: {
  title: string;
  why: string;
  stake: string;
  startDate: ISODate;
  endDate: ISODate;
}): string | null {
  if (input.title.length === 0) return 'Title is required.';
  if (input.why.length === 0) return 'Why is required.';
  if (input.stake.length === 0) return "What's at stake is required.";
  if (input.startDate.length === 0) return 'Start date is required.';
  if (input.endDate.length === 0) return 'End date is required.';
  if (input.endDate < input.startDate) {
    return 'End date must be on or after start date.';
  }
  return null;
}
