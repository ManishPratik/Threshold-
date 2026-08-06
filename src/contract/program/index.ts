// Leaf contract module for the Life Program runtime. Types only —
// no runtime code, no side effects, no imports from any `@features/*`
// module. Consumed by `@features/programs` (registry) and
// `@features/daily-flow-engine` (engine) plus every concrete program
// under `src/programs/*`. Kept as a leaf so those two features stop
// depending on each other's public surface.

export type {
  LifeProgram,
  TodayWidgetProps,
  Phase,
  Priority,
  AckKind,
  InterventionContext,
  Intervention,
  SurfaceSlot,
  SurfaceProps,
  ProgramSurface,
} from './types';
