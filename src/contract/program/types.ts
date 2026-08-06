import type { ComponentType } from 'react';

/**
 * The minimum contract a Life Program declares. Kept intentionally
 * narrow — one identifier, one display name, one description. Programs
 * plug in via either the legacy `todayWidget` alias or the ADR 0009
 * `interventions` / `surfaces` pair. Adding optional fields is not a
 * breaking change; both migration modes coexist.
 */
export interface LifeProgram {
  id: string;
  displayName: string;
  description: string;
  /**
   * Legacy single-widget entry point. Registry helper
   * `getProgramSurfaces` exposes it as one ambient surface when
   * `surfaces` is not provided. See ADR 0009 §3 "Legacy `todayWidget`
   * continues to work as an alias for one `slot: 'ambient'` surface".
   */
  todayWidget?: ComponentType<TodayWidgetProps>;
  /**
   * Data-only intervention descriptors. Programs own `shouldFire`;
   * engine (landing in a later phase) owns rendering, ordering, caps,
   * and ack log. See ADR 0009 §3.
   */
  interventions?: readonly Intervention[];
  /**
   * React components placed in engine-defined slots. Programs own
   * content; engine owns placement, dimensions, error boundaries.
   * See ADR 0009 §3, §5.
   */
  surfaces?: readonly ProgramSurface[];
}

/**
 * Props every Today widget receives from the program runtime. Kept
 * lean so programs can pull their own data through the existing
 * repositories rather than accept a wide facade.
 *
 * `promiseId` is optional per module-independence architecture: modules
 * that do not depend on a Promise (e.g., orphan Routine, Smoking in
 * module-scoped mode) receive `undefined`. Modules that DO carry a
 * Promise-scoped surface still receive the Promise's id.
 */
export interface TodayWidgetProps {
  promiseId?: string;
}

/**
 * Fixed anchor phases in V1. V2 extends via the `custom:${slug}`
 * template literal member without a schema migration. See ADR 0009 §2.
 */
export type Phase =
  | 'morning'
  | 'midday'
  | 'evening'
  | 'night'
  | `custom:${string}`;

/**
 * Priority tier. Engine phase-slot caps in ADR 0009 §4: p1 = 3/day,
 * p2 = 3/day, p3 = uncapped but below-fold; aggregate above-fold ≤ 6.
 */
export type Priority = 'p1' | 'p2' | 'p3';

/**
 * Ack persistence semantics. Engine writes to the reused legacy
 * `settings` v1 store per ADR 0009 §6. Programs never touch the ack
 * log directly.
 */
export type AckKind = 'per-day' | 'per-arc' | 'per-milestone' | 'passive';

/**
 * Context handed to every `shouldFire` call. The concrete engine (later
 * phase) supplies the object. Shape held minimal here so programs do
 * not couple to fields that do not exist yet.
 *
 * `ackRate` — engine-computed rolling engagement signal in [0, 1] over
 * a program-agnostic window. Populated by the engine before each queue
 * evaluation so programs can adapt wording without adding
 * interventions. Optional so pre-existing tests that construct their
 * own context stay compilable; programs treat a missing value as
 * `1` per the "never punish missing data" rule.
 */
export interface InterventionContext {
  /**
   * Optional per module-independence architecture: modules that do not
   * depend on a Promise (e.g., Smoking in module-scoped mode) receive
   * `undefined`. Modules that DO carry a Promise-scoped intervention
   * still receive the Promise's id from the engine.
   */
  promiseId?: string;
  nowIso: string;
  phase: Phase;
  ackRate?: number;
}

/**
 * Data-only intervention descriptor. Engine renders + orders + acks;
 * program provides `shouldFire`. See ADR 0009 §3.
 */
export interface Intervention {
  id: string;
  programId: string;
  title: string;
  body: string;
  phase: Phase;
  priority: Priority;
  ackKind: AckKind;
  shouldFire: (ctx: InterventionContext) => boolean;
}

/**
 * Engine-defined slot the surface renders into. Cardinality is
 * enforced by the engine (later phase) per ADR 0009 §5: hero = one
 * active, ambient = vertical stack, overlay = one active queued.
 */
export type SurfaceSlot = 'hero' | 'ambient' | 'overlay';

/**
 * Props every slot-mounted surface receives. Same shape as
 * `TodayWidgetProps` so legacy widgets can be exposed as ambient
 * surfaces without a component rewrite.
 */
export interface SurfaceProps {
  /**
   * Optional per module-independence architecture. Same semantics as
   * `TodayWidgetProps.promiseId`.
   */
  promiseId?: string;
}

/**
 * React component placed in an engine-defined slot. Weight breaks ties
 * inside a slot (higher wins the hero slot; ordering within ambient
 * stack is engine-owned in a later phase). See ADR 0009 §3, §5.
 */
export interface ProgramSurface {
  slot: SurfaceSlot;
  component: ComponentType<SurfaceProps>;
  weight: number;
}
