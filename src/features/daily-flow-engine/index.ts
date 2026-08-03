// Public API of the Daily Flow Engine. Pure modules only in this
// phase — no runtime consumer, no Today wiring, no scheduler. The
// engine follows ADR 0009 and is safe to import from anywhere;
// nothing here mounts, renders, or auto-runs.

export {
  P1_PER_PHASE,
  P2_PER_PHASE,
  MAX_ABOVE_FOLD,
  ACK_RETENTION_DAYS,
  DEFAULT_ACK_WINDOW,
  ACK_RECORD_ID_PREFIX,
  ACK_RECORD_KEY,
  ACK_RECORD_SCHEMA_VERSION,
} from './constants';

export { resolvePhase } from './resolvePhase';
export { listInterventions } from './interventionQueue';
export { listSurfaces } from './surfaces';

export {
  markAcked,
  markAckedNow,
  isAckedToday,
  readAckRecord,
  readSeenTodayIds,
  purgeOlderThan30Days,
  type AckRecordKind,
  type DailyAckRecord,
} from './ackLog';

export {
  getInterventionAckRate,
  readAggregateAckRate,
} from './analytics';

export { readDailyAnalytics } from './dailyAnalytics';
export type {
  DailyAnalytics,
  DailyAnalyticsRow,
} from './dailyAnalytics';

export { SurfaceErrorBoundary } from './SurfaceErrorBoundary';

export { InterventionQueue } from './InterventionQueue';
export type { InterventionQueueProps } from './InterventionQueue';

export { DailyFlowSummary } from './DailyFlowSummary';
export type { DailyFlowSummaryProps } from './DailyFlowSummary';
export { pickLine } from './dailyFlowSummaryCopy';

export {
  bumpQueueVersion,
  getQueueVersion,
  subscribeQueueVersion,
} from './queueVersion';

export {
  toDateKey,
  isoToDateKey,
  daysBetweenKeys,
  shiftDateKey,
} from './dateKey';
