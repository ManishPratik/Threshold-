import { afterEach, describe, it, expect } from 'vitest';
import type { LifeProgram, ProgramSurface } from './types';
import {
  clearRegistry,
  getProgram,
  getProgramSurfaces,
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

// Minimal placeholder component — never rendered, only referenced by
// identity so the surface-alias test can assert component reuse.
const DummyWidget = () => null;
const DummyHero = () => null;

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

describe('getProgramSurfaces (ADR 0009 §3 legacy alias)', () => {
  it('returns an empty list when the program has neither surfaces nor todayWidget', () => {
    const p = makeProgram();
    expect(getProgramSurfaces(p)).toEqual([]);
  });

  it('exposes a legacy todayWidget as one ambient surface with weight 0', () => {
    const p = makeProgram({ todayWidget: DummyWidget });
    const surfaces = getProgramSurfaces(p);
    expect(surfaces).toHaveLength(1);
    expect(surfaces[0].slot).toBe('ambient');
    expect(surfaces[0].component).toBe(DummyWidget);
    expect(surfaces[0].weight).toBe(0);
  });

  it('returns the explicit surfaces list verbatim when provided', () => {
    const surfaces: readonly ProgramSurface[] = [
      { slot: 'hero', component: DummyHero, weight: 10 },
      { slot: 'ambient', component: DummyWidget, weight: 5 },
    ];
    const p = makeProgram({ surfaces });
    expect(getProgramSurfaces(p)).toBe(surfaces);
  });

  it('skips the todayWidget alias when explicit surfaces are also declared (no duplicate rendering)', () => {
    const surfaces: readonly ProgramSurface[] = [
      { slot: 'ambient', component: DummyHero, weight: 1 },
    ];
    const p = makeProgram({ todayWidget: DummyWidget, surfaces });
    const out = getProgramSurfaces(p);
    expect(out).toBe(surfaces);
    expect(out).toHaveLength(1);
    expect(out[0].component).toBe(DummyHero);
  });
});
