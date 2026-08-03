import type { ComponentType } from 'react';

/**
 * The minimum contract a Life Program declares. Kept intentionally
 * narrow — one identifier, one display name, one description, and up
 * to one Today widget component. The plugin surface can grow later
 * without renumbering: adding optional fields is not a breaking change.
 *
 * `todayWidget` receives the active Promise id when rendered so
 * program-scoped state can be keyed against it. Programs render
 * nothing when they have no `todayWidget`.
 */
export interface LifeProgram {
  id: string;
  displayName: string;
  description: string;
  todayWidget?: ComponentType<TodayWidgetProps>;
}

/**
 * Props every Today widget receives from the program runtime. Kept
 * lean so programs can pull their own data through the existing
 * repositories rather than accept a wide facade.
 */
export interface TodayWidgetProps {
  promiseId: string;
}
