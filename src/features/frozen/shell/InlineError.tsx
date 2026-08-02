export interface InlineErrorProps {
  message: string;
}

/**
 * Frozen-architecture InlineError — presentation primitive. Renders one
 * `role="alert"` paragraph with `aria-live="polite"` so screen readers
 * announce the message when it appears. Renders nothing when the
 * message is empty.
 *
 * No retry behaviour. The caller wires the retry affordance.
 *
 * Not wired into any production code in this slice.
 */
export function InlineError({ message }: InlineErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" aria-live="polite">
      {message}
    </p>
  );
}
