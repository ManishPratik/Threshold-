/**
 * Pure state model for the PWA "update available" prompt.
 *
 * Keeps the transitions testable in isolation from the service-worker plumbing
 * (which is inherently side-effectful and covered by manual QA on a real
 * install). The reducer + selector are the only logic surface the UI actually
 * observes; the hook wires SW callbacks into `DETECTED` events.
 *
 * Repetition guard: DETECTED resets `dismissed` back to false, so a fresh
 * update event after a prior dismissal re-presents the prompt. This is the
 * intended behaviour — dismissal is scoped to the current update, not
 * "forever".
 */

export interface UpdateState {
  /** The service worker has reported that a new version is waiting. */
  needsRefresh: boolean;
  /** The user tapped "Not now" for the current update. */
  dismissed: boolean;
  /** The user tapped "Update" and the reload is in flight. */
  updating: boolean;
}

export type UpdateEvent = 'DETECTED' | 'DISMISS' | 'UPDATE_STARTED' | 'UPDATE_FAILED';

export const initialUpdateState: UpdateState = {
  needsRefresh: false,
  dismissed: false,
  updating: false,
};

export function updateReducer(state: UpdateState, event: UpdateEvent): UpdateState {
  switch (event) {
    case 'DETECTED':
      return { needsRefresh: true, dismissed: false, updating: false };
    case 'DISMISS':
      return { ...state, dismissed: true };
    case 'UPDATE_STARTED':
      return { ...state, updating: true };
    case 'UPDATE_FAILED':
      return { ...state, updating: false };
  }
}

/**
 * Selector for "should the prompt be visible?". Kept out of the reducer so
 * new state transitions do not accidentally invert visibility.
 */
export function shouldShowUpdatePrompt(state: UpdateState): boolean {
  return state.needsRefresh && !state.dismissed;
}
