import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Focus-trap for ceremonial dialog surfaces. When `active` is true the
 * hook:
 *   1. records the previously focused element,
 *   2. moves focus to the first focusable descendant of the ref target,
 *   3. installs a keydown listener that cycles Tab / Shift+Tab within
 *      the ref target only,
 *   4. on cleanup, restores focus to the recorded element if it is still
 *      connected to the DOM.
 *
 * Escape-key handling is intentionally omitted — the frozen ritual
 * protocol forbids dismiss-on-Escape (Engineering Foundations §5).
 * Callers dismiss modals only via their explicit primary or secondary
 * action.
 *
 * Consumers: ModalShell, DialogShell.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    // Move focus into the dialog on open. If nothing is focusable yet
    // (e.g. every action is held-disabled) the trap still catches Tab
    // and prevents escape via the keydown listener below.
    const initial = getFocusable()[0];
    if (initial && !root.contains(document.activeElement)) {
      initial.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (!firstEl || !lastEl) return;
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (activeEl === firstEl || !root.contains(activeEl)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (activeEl === lastEl || !root.contains(activeEl)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (
        previouslyFocused &&
        previouslyFocused.isConnected &&
        typeof previouslyFocused.focus === 'function'
      ) {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return ref;
}
