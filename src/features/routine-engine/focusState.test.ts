import { describe, it, expect } from 'vitest';
import { focusReducer, type FocusState } from './focusState';

describe('focusReducer — idle transitions', () => {
  it('START advances idle to in_progress', () => {
    expect(focusReducer('idle', 'START')).toBe('in_progress');
  });

  it('idle ignores PAUSE, RESUME, COMPLETE', () => {
    expect(focusReducer('idle', 'PAUSE')).toBe('idle');
    expect(focusReducer('idle', 'RESUME')).toBe('idle');
    expect(focusReducer('idle', 'COMPLETE')).toBe('idle');
  });
});

describe('focusReducer — in_progress transitions', () => {
  it('PAUSE moves in_progress to paused', () => {
    expect(focusReducer('in_progress', 'PAUSE')).toBe('paused');
  });

  it('COMPLETE moves in_progress to completed', () => {
    expect(focusReducer('in_progress', 'COMPLETE')).toBe('completed');
  });

  it('in_progress ignores START and RESUME', () => {
    expect(focusReducer('in_progress', 'START')).toBe('in_progress');
    expect(focusReducer('in_progress', 'RESUME')).toBe('in_progress');
  });
});

describe('focusReducer — paused transitions', () => {
  it('RESUME moves paused to in_progress', () => {
    expect(focusReducer('paused', 'RESUME')).toBe('in_progress');
  });

  it('COMPLETE moves paused to completed', () => {
    expect(focusReducer('paused', 'COMPLETE')).toBe('completed');
  });

  it('paused ignores START and PAUSE', () => {
    expect(focusReducer('paused', 'START')).toBe('paused');
    expect(focusReducer('paused', 'PAUSE')).toBe('paused');
  });
});

describe('focusReducer — completed transitions', () => {
  it('completed ignores every action other than RESET', () => {
    expect(focusReducer('completed', 'START')).toBe('completed');
    expect(focusReducer('completed', 'PAUSE')).toBe('completed');
    expect(focusReducer('completed', 'RESUME')).toBe('completed');
    expect(focusReducer('completed', 'COMPLETE')).toBe('completed');
  });
});

describe('focusReducer — RESET is universal', () => {
  const allStates: FocusState[] = [
    'idle',
    'in_progress',
    'paused',
    'completed',
  ];
  it.each(allStates)('RESET returns idle from %s', (s) => {
    expect(focusReducer(s, 'RESET')).toBe('idle');
  });
});
