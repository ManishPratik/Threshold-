import { nowIso as defaultNowIso, type ISODate, type ISODateTime } from './date';
import { currentLogicalDate as defaultCurrentLogicalDate } from './dayBoundary';

/**
 * Minimal time abstraction so time-dependent domain services can be tested
 * without module-level mocks. Kept intentionally small — extend only when a
 * real caller needs a new operation.
 */
export interface TimeProvider {
  /** Current wall-clock timestamp, ISO 8601 UTC. */
  nowIso(): ISODateTime;
  /** Today's ISODate under the configured logical-day boundary (04:00 default). */
  currentLogicalDate(): ISODate;
}

/** Real implementation. Production code uses this by default. */
export const defaultTimeProvider: TimeProvider = {
  nowIso: defaultNowIso,
  currentLogicalDate: defaultCurrentLogicalDate,
};
