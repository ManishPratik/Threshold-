import { describe, it, expect } from 'vitest';
import { focusReducer, type FocusState } from './focusState';

describe('focusReducer', () => {
  it('starts from idle → in_progress on START', () => {
    expect(focusReducer('idle', 'START')).toBe('in_progress');
  });

  it('ignores unrelated actions while idle', () => {
    expect(focusReducer('idle', 'PAUSE')).toBe('idle');
    expect(focusReducer('idle', 'RESUME')).toBe('idle');
    expect(focusReducer('idle', 'COMPLETE')).toBe('idle');
  });

  it('in_progress → paused on PAUSE, → completed on COMPLETE', () => {
    expect(focusReducer('in_progress', 'PAUSE')).toBe('paused');
    expect(focusReducer('in_progress', 'COMPLETE')).toBe('completed');
    expect(focusReducer('in_progress', 'START')).toBe('in_progress');
  });

  it('paused → in_progress on RESUME, → completed on COMPLETE', () => {
    expect(focusReducer('paused', 'RESUME')).toBe('in_progress');
    expect(focusReducer('paused', 'COMPLETE')).toBe('completed');
    expect(focusReducer('paused', 'PAUSE')).toBe('paused');
  });

  it('completed is terminal until RESET', () => {
    expect(focusReducer('completed', 'START')).toBe('completed');
    expect(focusReducer('completed', 'PAUSE')).toBe('completed');
    expect(focusReducer('completed', 'RESUME')).toBe('completed');
    expect(focusReducer('completed', 'COMPLETE')).toBe('completed');
    expect(focusReducer('completed', 'RESET')).toBe('idle');
  });

  it('RESET returns idle from any state', () => {
    const states: FocusState[] = ['idle', 'in_progress', 'paused', 'completed'];
    for (const s of states) {
      expect(focusReducer(s, 'RESET')).toBe('idle');
    }
  });
});
