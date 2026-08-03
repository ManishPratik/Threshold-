import { afterEach, describe, it, expect } from 'vitest';
import type { LifeProgram } from './types';
import {
  clearRegistry,
  getProgram,
  listPrograms,
  registerProgram,
} from './registry';

function makeProgram(overrides: Partial<LifeProgram> = {}): LifeProgram {
  return {
    id: 'test-program',
    displayName: 'Test Program',
    description: 'Testing.',
    ...overrides,
  };
}

describe('program registry', () => {
  afterEach(() => {
    clearRegistry();
  });

  it('starts empty', () => {
    expect(listPrograms()).toEqual([]);
  });

  it('registers and retrieves a program by id', () => {
    const p = makeProgram();
    registerProgram(p);
    expect(getProgram('test-program')).toBe(p);
    expect(listPrograms()).toEqual([p]);
  });

  it('returns undefined for an unregistered id', () => {
    expect(getProgram('nope')).toBeUndefined();
  });

  it('preserves insertion order across multiple registrations', () => {
    const a = makeProgram({ id: 'a', displayName: 'A' });
    const b = makeProgram({ id: 'b', displayName: 'B' });
    const c = makeProgram({ id: 'c', displayName: 'C' });
    registerProgram(a);
    registerProgram(b);
    registerProgram(c);
    expect(listPrograms().map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('re-registration replaces the record without reordering', () => {
    const a1 = makeProgram({ id: 'a', displayName: 'First' });
    const b = makeProgram({ id: 'b', displayName: 'B' });
    const a2 = makeProgram({ id: 'a', displayName: 'Second' });
    registerProgram(a1);
    registerProgram(b);
    registerProgram(a2);
    expect(listPrograms().map((p) => p.displayName)).toEqual([
      'Second',
      'B',
    ]);
  });

  it('clearRegistry empties the store', () => {
    registerProgram(makeProgram({ id: 'a' }));
    registerProgram(makeProgram({ id: 'b' }));
    clearRegistry();
    expect(listPrograms()).toEqual([]);
    expect(getProgram('a')).toBeUndefined();
  });
});
