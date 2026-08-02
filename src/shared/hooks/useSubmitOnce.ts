import { useCallback, useRef, useState } from 'react';

/**
 * Return shape of {@link useSubmitOnce}.
 *
 * - `pending`: true while a submission is in flight; drives the disabled
 *   state on the button or form the caller renders.
 * - `submit`: wraps an async function. Only one submission runs at a time;
 *   concurrent invocations while `pending` is true short-circuit and
 *   resolve to `undefined` without invoking the wrapped function.
 * - `reset`: manual clear of the pending flag. Not needed on happy paths
 *   (success and failure both auto-clear); exists as a safety valve for
 *   the rare cases where a caller wants to abandon a wrapped call.
 */
export interface UseSubmitOnceResult {
  pending: boolean;
  submit: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Duplicate-submission guard for every write-triggering button and form in
 * the frozen architecture (Engineering Foundations §11). Generic and
 * domain-agnostic — no Promise, Declaration, repository, IndexedDB,
 * routing, modal, or UI-component knowledge.
 *
 * Behaviour:
 * - Prevents duplicate concurrent submissions. A synchronous ref catches
 *   taps that arrive before React has re-rendered the disabled state.
 * - Exposes `pending` so the caller renders the button/form as disabled.
 * - Exposes a wrapped async `submit` that runs the caller's function.
 * - Automatically clears `pending` on success or failure via `finally`.
 * - Preserves thrown errors — the wrapped function's exceptions bubble
 *   to the caller's `await submit(...)`.
 */
export function useSubmitOnce(): UseSubmitOnceResult {
  const [pending, setPending] = useState(false);
  const inFlightRef = useRef(false);

  const submit = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (inFlightRef.current) return undefined;
      inFlightRef.current = true;
      setPending(true);
      try {
        return await fn();
      } finally {
        inFlightRef.current = false;
        setPending(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    inFlightRef.current = false;
    setPending(false);
  }, []);

  return { pending, submit, reset };
}
