/**
 * Frozen-architecture modal state manager. Memory-only singleton that
 * tracks the single active modal (if any) plus an opaque payload the
 * caller supplies. Notifies subscribers on every state change.
 *
 * Engineering Foundations §5 universal rule: exactly one active modal
 * at any time. Opening a new modal while one is already open replaces
 * the previous one — the modal shell itself is responsible for policing
 * dismiss semantics (browser back, ESC, outside click) per its variant.
 *
 * No React dependency. No router awareness. No persistence. No IndexedDB.
 * No repository or service access. The payload is stored as `unknown` and
 * never interpreted by this module.
 *
 * Not wired into any production code in this slice.
 */

/**
 * Modal types managed by the modal-state singleton. The frozen product
 * routes `reflection`, `recovery`, and `completion` through here because
 * they participate in cross-page transitions (Question → Kept/Broken,
 * broken-day → Recovery, endDate-kept → Completion). Destructive-
 * confirmation dialogs (Break Promise, Delete Routine, Delete Block,
 * Erase Data) and the promise-creation Witness modal remain mounted
 * inline within their owning pages — those flows are scoped to a single
 * page and do not survive navigation. Two mount surfaces coexist by
 * design; the union here is intentionally minimal.
 */
export type FrozenModalType = 'reflection' | 'recovery' | 'completion';

export interface FrozenModalState {
  type: FrozenModalType;
  payload: unknown;
}

export type ModalListener = (state: FrozenModalState | null) => void;

let currentState: FrozenModalState | null = null;
const listeners = new Set<ModalListener>();

function notify(): void {
  for (const listener of listeners) {
    listener(currentState);
  }
}

/**
 * Open a modal. Any currently open modal is replaced. Notifies every
 * subscriber with the new state after the change.
 */
export function openModal(type: FrozenModalType, payload?: unknown): void {
  currentState = { type, payload };
  notify();
}

/**
 * Close the currently open modal, if any. No-op when no modal is open.
 * Notifies subscribers only on an observable state change.
 */
export function closeModal(): void {
  if (currentState === null) return;
  currentState = null;
  notify();
}

/**
 * Replace the currently open modal with a new one. Semantically identical
 * to `openModal` — both establish the exactly-one-modal invariant by
 * overwriting the current state.
 */
export function replaceModal(type: FrozenModalType, payload?: unknown): void {
  openModal(type, payload);
}

/** Return the current modal state, or null when no modal is open. */
export function getModalState(): FrozenModalState | null {
  return currentState;
}

/** Register a listener. Idempotent — adding the same listener twice keeps one. */
export function subscribe(listener: ModalListener): void {
  listeners.add(listener);
}

/** Remove a listener. Safe when the listener was never registered. */
export function unsubscribe(listener: ModalListener): void {
  listeners.delete(listener);
}
