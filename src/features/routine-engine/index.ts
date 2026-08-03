// Public API of the routine-engine feature. Every consumer outside this
// folder (routes, other features) MUST import from here.

export { focusReducer } from './focusState';
export type { FocusState, FocusAction } from './focusState';

export { getTodayProgress } from './getCurrentBlock';
export type { TodayProgress } from './getCurrentBlock';

export { ProgressSummary } from './ProgressSummary';
export type { ProgressSummaryProps } from './ProgressSummary';

export { CurrentFocusCard } from './CurrentFocusCard';
export type { CurrentFocusCardProps } from './CurrentFocusCard';

export {
  ANCHOR_ORDER,
  ANCHOR_LABELS,
  getBlockAnchor,
  groupByAnchor,
  orderedAnchorsWithBlocks,
} from './anchors';
