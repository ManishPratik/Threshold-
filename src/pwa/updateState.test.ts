import { describe, it, expect } from 'vitest';
import {
  initialUpdateState,
  shouldShowUpdatePrompt,
  updateReducer,
} from './updateState';

describe('updateReducer', () => {
  it('starts hidden', () => {
    expect(shouldShowUpdatePrompt(initialUpdateState)).toBe(false);
  });

  it('DETECTED flips needsRefresh to true and clears dismissed + updating', () => {
    const s = updateReducer(
      { needsRefresh: false, dismissed: true, updating: true },
      'DETECTED',
    );
    expect(s).toEqual({ needsRefresh: true, dismissed: false, updating: false });
  });

  it('DISMISS sets dismissed without touching needsRefresh', () => {
    const s = updateReducer(
      { needsRefresh: true, dismissed: false, updating: false },
      'DISMISS',
    );
    expect(s).toEqual({ needsRefresh: true, dismissed: true, updating: false });
  });

  it('UPDATE_STARTED sets updating', () => {
    const s = updateReducer(
      { needsRefresh: true, dismissed: false, updating: false },
      'UPDATE_STARTED',
    );
    expect(s.updating).toBe(true);
  });

  it('UPDATE_FAILED clears updating (recover from a failed reload)', () => {
    const s = updateReducer(
      { needsRefresh: true, dismissed: false, updating: true },
      'UPDATE_FAILED',
    );
    expect(s.updating).toBe(false);
  });

  it('a fresh DETECTED after DISMISS re-shows the prompt', () => {
    let s = updateReducer(initialUpdateState, 'DETECTED');
    s = updateReducer(s, 'DISMISS');
    expect(shouldShowUpdatePrompt(s)).toBe(false);
    s = updateReducer(s, 'DETECTED');
    expect(shouldShowUpdatePrompt(s)).toBe(true);
  });
});

describe('shouldShowUpdatePrompt', () => {
  it('true only when needsRefresh AND not dismissed', () => {
    expect(shouldShowUpdatePrompt({ needsRefresh: true, dismissed: false, updating: false })).toBe(true);
    expect(shouldShowUpdatePrompt({ needsRefresh: true, dismissed: true, updating: false })).toBe(false);
    expect(shouldShowUpdatePrompt({ needsRefresh: false, dismissed: false, updating: false })).toBe(false);
    // Updating flag does not gate visibility — the prompt stays while the
    // reload is in flight so the user sees the "Updating…" affordance.
    expect(shouldShowUpdatePrompt({ needsRefresh: true, dismissed: false, updating: true })).toBe(true);
  });
});
