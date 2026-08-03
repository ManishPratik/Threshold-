import { describe, it, expect } from 'vitest';
import type { LifeProgram, ProgramSurface } from '@features/programs';
import { listSurfaces } from './surfaces';

const AmbientA = () => null;
const AmbientB = () => null;
const HeroA = () => null;
const OverlayA = () => null;
const LegacyWidget = () => null;

function program(overrides: Partial<LifeProgram>): LifeProgram {
  return {
    id: 'p',
    displayName: 'p',
    description: 'p',
    ...overrides,
  };
}

describe('listSurfaces', () => {
  it('returns an empty list when no programs are registered', () => {
    expect(listSurfaces([], 'ambient')).toEqual([]);
  });

  it('returns an empty list when programs have no surfaces or todayWidget', () => {
    const p = program({});
    expect(listSurfaces([p], 'ambient')).toEqual([]);
  });

  it('filters to the requested slot only', () => {
    const surfaces: readonly ProgramSurface[] = [
      { slot: 'ambient', component: AmbientA, weight: 0 },
      { slot: 'hero', component: HeroA, weight: 5 },
      { slot: 'overlay', component: OverlayA, weight: 0 },
    ];
    const p = program({ surfaces });
    expect(listSurfaces([p], 'ambient').map((s) => s.component)).toEqual([
      AmbientA,
    ]);
    expect(listSurfaces([p], 'hero').map((s) => s.component)).toEqual([HeroA]);
    expect(listSurfaces([p], 'overlay').map((s) => s.component)).toEqual([
      OverlayA,
    ]);
  });

  it('preserves program order across multiple programs', () => {
    const a = program({
      id: 'a',
      surfaces: [{ slot: 'ambient', component: AmbientA, weight: 0 }],
    });
    const b = program({
      id: 'b',
      surfaces: [{ slot: 'ambient', component: AmbientB, weight: 0 }],
    });
    expect(listSurfaces([a, b], 'ambient').map((s) => s.component)).toEqual([
      AmbientA,
      AmbientB,
    ]);
    expect(listSurfaces([b, a], 'ambient').map((s) => s.component)).toEqual([
      AmbientB,
      AmbientA,
    ]);
  });

  it('preserves declaration order within a program', () => {
    const p = program({
      surfaces: [
        { slot: 'ambient', component: AmbientA, weight: 0 },
        { slot: 'ambient', component: AmbientB, weight: 0 },
      ],
    });
    expect(listSurfaces([p], 'ambient').map((s) => s.component)).toEqual([
      AmbientA,
      AmbientB,
    ]);
  });

  it('surfaces a legacy todayWidget program as one ambient surface (ADR 0009 §3 alias)', () => {
    const p = program({ todayWidget: LegacyWidget });
    const out = listSurfaces([p], 'ambient');
    expect(out).toHaveLength(1);
    expect(out[0].component).toBe(LegacyWidget);
    expect(out[0].slot).toBe('ambient');
    expect(out[0].weight).toBe(0);
  });

  it('does not expose a legacy todayWidget into the hero or overlay slot', () => {
    const p = program({ todayWidget: LegacyWidget });
    expect(listSurfaces([p], 'hero')).toEqual([]);
    expect(listSurfaces([p], 'overlay')).toEqual([]);
  });

  it('skips todayWidget aliasing when explicit surfaces are declared', () => {
    const surfaces: readonly ProgramSurface[] = [
      { slot: 'ambient', component: AmbientA, weight: 3 },
    ];
    const p = program({ todayWidget: LegacyWidget, surfaces });
    const out = listSurfaces([p], 'ambient');
    expect(out).toHaveLength(1);
    expect(out[0].component).toBe(AmbientA);
  });

  it('mixes legacy and explicit-surface programs correctly', () => {
    const legacy = program({ id: 'legacy', todayWidget: LegacyWidget });
    const modern = program({
      id: 'modern',
      surfaces: [{ slot: 'ambient', component: AmbientA, weight: 0 }],
    });
    const out = listSurfaces([legacy, modern], 'ambient');
    expect(out.map((s) => s.component)).toEqual([LegacyWidget, AmbientA]);
  });
});
