// Engine-wide constants. ADR 0009 §4 fixes the priority caps and
// §6 fixes the ack-log retention; every magic number in the engine
// resolves here. No consumer should hard-code these values.

/** Phase-slot cap for p1 interventions per ADR 0009 §4. */
export const P1_PER_PHASE = 3;

/** Phase-slot cap for p2 interventions per ADR 0009 §4. */
export const P2_PER_PHASE = 3;

/** Aggregate above-fold cap across p1 + p2 per phase per ADR 0009 §4. */
export const MAX_ABOVE_FOLD = 6;

/** Ack-log retention window in days per ADR 0009 §6. */
export const ACK_RETENTION_DAYS = 30;

/** Default rolling window for `getInterventionAckRate` per ADR 0009 §7. */
export const DEFAULT_ACK_WINDOW = 7;

/** IDB `settings` v1 record id prefix for daily-flow ack rows. One row
 *  per calendar day: `dailyFlow-ack-YYYY-MM-DD`. */
export const ACK_RECORD_ID_PREFIX = 'dailyFlow-ack-';

/** IDB record `key` field value written alongside the ack payload. */
export const ACK_RECORD_KEY = 'dailyFlow.ack';

/** Ack-record schema version. Incremented if the payload shape ever
 *  changes; existing records self-describe so migrations stay optional. */
export const ACK_RECORD_SCHEMA_VERSION = 1;
