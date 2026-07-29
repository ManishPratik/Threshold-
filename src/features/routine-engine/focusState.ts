/**
 * Focus session state — a small finite state machine for the currently
 * visible block on the Today screen.
 *
 * Intentionally metadata-free (no timestamps, no elapsed counters). "No timers"
 * is a locked Milestone-1 decision; every timestamp we omit here is one fewer
 * thing to reconcile with persistent state later.
 *
 *   idle ── START ──▶ in_progress ── PAUSE ──▶ paused
 *                          │             │
 *                          │             └── RESUME ──▶ in_progress
 *                          │
 *                          └── COMPLETE ──▶ completed ── RESET ──▶ idle
 *                          paused ── COMPLETE ──▶ completed
 *                          any ── RESET ──▶ idle
 */

export type FocusState = 'idle' | 'in_progress' | 'paused' | 'completed';
export type FocusAction = 'START' | 'PAUSE' | 'RESUME' | 'COMPLETE' | 'RESET';

export function focusReducer(state: FocusState, action: FocusAction): FocusState {
  if (action === 'RESET') return 'idle';

  switch (state) {
    case 'idle':
      return action === 'START' ? 'in_progress' : state;
    case 'in_progress':
      if (action === 'PAUSE') return 'paused';
      if (action === 'COMPLETE') return 'completed';
      return state;
    case 'paused':
      if (action === 'RESUME') return 'in_progress';
      if (action === 'COMPLETE') return 'completed';
      return state;
    case 'completed':
      return state; // only RESET (handled above) leaves 'completed'
  }
}
