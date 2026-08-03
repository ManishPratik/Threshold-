import { describe, it, expect } from 'vitest';
import type {
  Intervention,
  InterventionContext,
  LifeProgram,
} from '@features/programs';
import { listInterventions } from './interventionQueue';

function ctx(overrides: Partial<InterventionContext> = {}): InterventionContext {
  return {
    promiseId: 'p-1',
    nowIso: '2026-08-03T09:00:00',
    phase: 'morning',
    ...overrides,
  };
}

function iv(
  overrides: Partial<Intervention> & Pick<Intervention, 'id'>,
): Intervention {
  return {
    programId: 'test',
    title: overrides.id,
    body: '',
    phase: 'morning',
    priority: 'p2',
    ackKind: 'per-day',
    shouldFire: () => true,
    ...overrides,
  };
}

function program(interventions: readonly Intervention[]): LifeProgram {
  return {
    id: `prog-${Math.random().toString(36).slice(2, 7)}`,
    displayName: 'Prog',
    description: 'test',
    interventions,
  };
}

describe('listInterventions', () => {
  it('returns an empty list when no programs are registered', () => {
    expect(listInterventions([], ctx())).toEqual([]);
  });

  it('returns an empty list when programs have no interventions', () => {
    const p: LifeProgram = { id: 'no-iv', displayName: 'n', description: 'n' };
    expect(listInterventions([p], ctx())).toEqual([]);
  });

  it('skips interventions whose phase does not match the context phase', () => {
    const p = program([
      iv({ id: 'a', phase: 'morning' }),
      iv({ id: 'b', phase: 'evening' }),
    ]);
    const out = listInterventions([p], ctx({ phase: 'morning' }));
    expect(out.map((i) => i.id)).toEqual(['a']);
  });

  it('skips interventions whose shouldFire returns false', () => {
    const p = program([
      iv({ id: 'a', shouldFire: () => false }),
      iv({ id: 'b', shouldFire: () => true }),
    ]);
    const out = listInterventions([p], ctx());
    expect(out.map((i) => i.id)).toEqual(['b']);
  });

  it('discards interventions whose shouldFire throws — other interventions still returned', () => {
    const p = program([
      iv({
        id: 'a',
        shouldFire: () => {
          throw new Error('boom');
        },
      }),
      iv({ id: 'b' }),
    ]);
    const out = listInterventions([p], ctx());
    expect(out.map((i) => i.id)).toEqual(['b']);
  });

  it('never throws even when every intervention throws', () => {
    const p = program([
      iv({
        id: 'a',
        shouldFire: () => {
          throw new Error('a');
        },
      }),
      iv({
        id: 'b',
        shouldFire: () => {
          throw new Error('b');
        },
      }),
    ]);
    expect(() => listInterventions([p], ctx())).not.toThrow();
    expect(listInterventions([p], ctx())).toEqual([]);
  });

  it('orders p1 before p2 before p3 within the same phase', () => {
    const p = program([
      iv({ id: 'p3-a', priority: 'p3' }),
      iv({ id: 'p1-a', priority: 'p1' }),
      iv({ id: 'p2-a', priority: 'p2' }),
    ]);
    const out = listInterventions([p], ctx());
    expect(out.map((i) => i.id)).toEqual(['p1-a', 'p2-a', 'p3-a']);
  });

  it('caps p1 at P1_PER_PHASE = 3; overflow demotes to below-fold', () => {
    const p = program([
      iv({ id: 'p1-1', priority: 'p1' }),
      iv({ id: 'p1-2', priority: 'p1' }),
      iv({ id: 'p1-3', priority: 'p1' }),
      iv({ id: 'p1-4', priority: 'p1' }),
      iv({ id: 'p1-5', priority: 'p1' }),
    ]);
    const out = listInterventions([p], ctx());
    // First 3 p1 kept above fold; last 2 demoted below fold (p3 slice).
    const aboveFold = out.slice(0, 3);
    expect(aboveFold.map((i) => i.id)).toEqual(['p1-1', 'p1-2', 'p1-3']);
    expect(out.map((i) => i.id)).toContain('p1-4');
    expect(out.map((i) => i.id)).toContain('p1-5');
    expect(out).toHaveLength(5);
  });

  it('caps p2 at P2_PER_PHASE = 3 when no p1s are present', () => {
    const p = program(
      Array.from({ length: 5 }, (_, n) =>
        iv({ id: `p2-${n + 1}`, priority: 'p2' }),
      ),
    );
    const out = listInterventions([p], ctx());
    // First 3 p2 kept above fold; last 2 demoted.
    expect(out.slice(0, 3).map((i) => i.id)).toEqual([
      'p2-1',
      'p2-2',
      'p2-3',
    ]);
    expect(out).toHaveLength(5);
  });

  it('enforces MAX_ABOVE_FOLD = 6 across p1 + p2 combined per phase', () => {
    const p = program([
      iv({ id: 'p1-1', priority: 'p1' }),
      iv({ id: 'p1-2', priority: 'p1' }),
      iv({ id: 'p1-3', priority: 'p1' }),
      iv({ id: 'p2-1', priority: 'p2' }),
      iv({ id: 'p2-2', priority: 'p2' }),
      iv({ id: 'p2-3', priority: 'p2' }),
      iv({ id: 'p2-4', priority: 'p2' }),
    ]);
    const out = listInterventions([p], ctx());
    // 3 p1 + 3 p2 above fold; 1 p2 demoted.
    expect(out.slice(0, 6).map((i) => i.id)).toEqual([
      'p1-1',
      'p1-2',
      'p1-3',
      'p2-1',
      'p2-2',
      'p2-3',
    ]);
    expect(out.map((i) => i.id)).toContain('p2-4');
    expect(out).toHaveLength(7);
  });

  it('does not cap p3 (uncapped by ADR 0009 §4)', () => {
    const p = program(
      Array.from({ length: 12 }, (_, n) =>
        iv({ id: `p3-${n + 1}`, priority: 'p3' }),
      ),
    );
    const out = listInterventions([p], ctx());
    expect(out).toHaveLength(12);
  });

  it('merges multiple programs into a single queue preserving program order', () => {
    const a = program([iv({ id: 'a-p1', priority: 'p1' })]);
    const b = program([iv({ id: 'b-p1', priority: 'p1' })]);
    const c = program([iv({ id: 'c-p2', priority: 'p2' })]);
    const out = listInterventions([a, b, c], ctx());
    expect(out.map((i) => i.id)).toEqual(['a-p1', 'b-p1', 'c-p2']);
  });

  it('passes the full context object to shouldFire', () => {
    let seen: InterventionContext | null = null;
    const p = program([
      iv({
        id: 'a',
        shouldFire: (received) => {
          seen = received;
          return true;
        },
      }),
    ]);
    const passed = ctx({ promiseId: 'special-promise' });
    listInterventions([p], passed);
    expect(seen).toEqual(passed);
  });

  it('does not mutate the input program.interventions arrays', () => {
    const list: readonly Intervention[] = [
      iv({ id: 'a', priority: 'p1' }),
      iv({ id: 'b', priority: 'p2' }),
    ];
    const snapshot = [...list];
    const p = program(list);
    listInterventions([p], ctx());
    expect(list).toEqual(snapshot);
  });
});
