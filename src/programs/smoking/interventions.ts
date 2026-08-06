import type { Intervention, InterventionContext } from '@contract/program';
import { DEFAULT_MANTRA, DEFAULT_PLEDGE_BODY } from './editableSlots';
import {
  computeCleanHours,
  computeDayNumber,
  getSmokingContextSync,
  preloadSmokingContext,
} from './interventionState';

/**
 * Days in the identity-formation window per the Phase 8 spec. Days 1-7
 * are inclusive on both ends — the intervention Morning Pledge shows
 * the full Pledge for exactly 7 days, then flips to the short reminder.
 */
export const IDENTITY_FORMATION_DAYS = 7;

/**
 * Engagement tier thresholds per the Phase 12 behavioural spec. Read
 * from `ctx.ackRate` per personal-os/src/features/programs/types.ts:76.
 * Missing data resolves to tier `'high'` per the "never punish missing
 * data" rule — see `pickEngagementTier` below.
 */
export const HIGH_ENGAGEMENT_MIN = 0.8;
export const MEDIUM_ENGAGEMENT_MIN = 0.4;

const PROGRAM_ID = 'smoking';

/**
 * Guard used by every Smoking intervention. Any cache-miss triggers a
 * fire-and-forget preload so the *next* Queue render observes the
 * populated cache; the current call returns `null` and the caller
 * treats that as "do not fire".
 */
function readyContext(): ReturnType<typeof getSmokingContextSync> {
  const ctx = getSmokingContextSync();
  if (ctx === null) {
    void preloadSmokingContext();
    return null;
  }
  return ctx;
}

/**
 * Resolve the engagement tier from `ctx.ackRate`. Missing / undefined
 * treated as `1` (high) per the Phase 12 fallback rule. Boundaries:
 *   ackRate >= HIGH_ENGAGEMENT_MIN     → 'high'
 *   ackRate >= MEDIUM_ENGAGEMENT_MIN   → 'medium'
 *   otherwise                          → 'low'
 */
export type EngagementTier = 'high' | 'medium' | 'low';
export function pickEngagementTier(ctx: InterventionContext): EngagementTier {
  const rate = ctx.ackRate ?? 1;
  if (rate >= HIGH_ENGAGEMENT_MIN) return 'high';
  if (rate >= MEDIUM_ENGAGEMENT_MIN) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------
// Morning Pledge — Days 1-7. Three wording tiers per Phase 12; only
// one fires per morning phase because the tier gates are mutually
// exclusive.
// ---------------------------------------------------------------------

const morningFullHigh: Intervention = {
  id: 'smoking-morning-pledge-full',
  programId: PROGRAM_ID,
  title: 'Read your Pledge',
  body: DEFAULT_PLEDGE_BODY,
  phase: 'morning',
  priority: 'p1',
  ackKind: 'per-day',
  shouldFire: (ctx) => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const day = computeDayNumber(state);
    if (day === null) return false;
    if (day < 1 || day > IDENTITY_FORMATION_DAYS) return false;
    return pickEngagementTier(ctx) === 'high';
  },
};

const morningFullMedium: Intervention = {
  id: 'smoking-morning-pledge-full-medium',
  programId: PROGRAM_ID,
  title: 'Read your Pledge aloud',
  body: DEFAULT_PLEDGE_BODY,
  phase: 'morning',
  priority: 'p1',
  ackKind: 'per-day',
  shouldFire: (ctx) => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const day = computeDayNumber(state);
    if (day === null) return false;
    if (day < 1 || day > IDENTITY_FORMATION_DAYS) return false;
    return pickEngagementTier(ctx) === 'medium';
  },
};

const morningFullLow: Intervention = {
  id: 'smoking-morning-pledge-full-direct',
  programId: PROGRAM_ID,
  title: 'Read your Pledge — out loud, once, slowly',
  body: DEFAULT_PLEDGE_BODY,
  phase: 'morning',
  priority: 'p1',
  ackKind: 'per-day',
  shouldFire: (ctx) => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const day = computeDayNumber(state);
    if (day === null) return false;
    if (day < 1 || day > IDENTITY_FORMATION_DAYS) return false;
    return pickEngagementTier(ctx) === 'low';
  },
};

// ---------------------------------------------------------------------
// Morning Pledge — Day 8+. Three wording tiers.
// ---------------------------------------------------------------------

const morningShortHigh: Intervention = {
  id: 'smoking-morning-pledge-short',
  programId: PROGRAM_ID,
  title: 'One clean day at a time',
  body: 'Read the Pledge below only if it feels heavy. Otherwise, breathe once and continue.',
  phase: 'morning',
  priority: 'p1',
  ackKind: 'per-day',
  shouldFire: (ctx) => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const day = computeDayNumber(state);
    if (day === null) return false;
    if (day <= IDENTITY_FORMATION_DAYS) return false;
    return pickEngagementTier(ctx) === 'high';
  },
};

const morningShortMedium: Intervention = {
  id: 'smoking-morning-pledge-short-medium',
  programId: PROGRAM_ID,
  title: 'Anchor the morning',
  body: 'Read the Pledge below. Even one line is enough to reset the pattern.',
  phase: 'morning',
  priority: 'p1',
  ackKind: 'per-day',
  shouldFire: (ctx) => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const day = computeDayNumber(state);
    if (day === null) return false;
    if (day <= IDENTITY_FORMATION_DAYS) return false;
    return pickEngagementTier(ctx) === 'medium';
  },
};

const morningShortLow: Intervention = {
  id: 'smoking-morning-pledge-short-direct',
  programId: PROGRAM_ID,
  title: 'Do not skip. Read the Pledge once — out loud.',
  body: 'Read the Pledge below. Not tomorrow. Now. One line is enough.',
  phase: 'morning',
  priority: 'p1',
  ackKind: 'per-day',
  shouldFire: (ctx) => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const day = computeDayNumber(state);
    if (day === null) return false;
    if (day <= IDENTITY_FORMATION_DAYS) return false;
    return pickEngagementTier(ctx) === 'low';
  },
};

// ---------------------------------------------------------------------
// Midday Check-in — engagement-tier agnostic. Kept identical across
// tiers per Phase 12 rule "No additional interventions" for medium.
// ---------------------------------------------------------------------

const midday: Intervention = {
  id: 'smoking-midday-checkin',
  programId: PROGRAM_ID,
  title: 'Where the body is right now',
  body: 'Cravings ride in waves. Each one you sit through is a slightly-weaker version of the last. This hour is repair, not discomfort.',
  phase: 'midday',
  priority: 'p2',
  ackKind: 'per-day',
  shouldFire: () => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const cleanHrs = computeCleanHours(state);
    if (cleanHrs === null) return false;
    return cleanHrs >= 0;
  },
};

// ---------------------------------------------------------------------
// Evening Commitment — three wording tiers. Low tier reads "mandatory"
// per Phase 12 spec while still occupying the same p1 phase slot.
// ---------------------------------------------------------------------

const eveningHigh: Intervention = {
  id: 'smoking-evening-commitment',
  programId: PROGRAM_ID,
  title: 'Recommit',
  body: DEFAULT_MANTRA,
  phase: 'evening',
  priority: 'p1',
  ackKind: 'per-day',
  shouldFire: (ctx) => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const cleanHrs = computeCleanHours(state);
    if (cleanHrs === null) return false;
    if (cleanHrs < 0) return false;
    return pickEngagementTier(ctx) === 'high';
  },
};

const eveningMedium: Intervention = {
  id: 'smoking-evening-commitment-medium',
  programId: PROGRAM_ID,
  title: 'Recommit — one line, out loud',
  body: DEFAULT_MANTRA,
  phase: 'evening',
  priority: 'p1',
  ackKind: 'per-day',
  shouldFire: (ctx) => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const cleanHrs = computeCleanHours(state);
    if (cleanHrs === null) return false;
    if (cleanHrs < 0) return false;
    return pickEngagementTier(ctx) === 'medium';
  },
};

const eveningLow: Intervention = {
  id: 'smoking-evening-commitment-direct',
  programId: PROGRAM_ID,
  title: 'Non-negotiable: read the Mantra out loud',
  body: DEFAULT_MANTRA,
  phase: 'evening',
  priority: 'p1',
  ackKind: 'per-day',
  shouldFire: (ctx) => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    const cleanHrs = computeCleanHours(state);
    if (cleanHrs === null) return false;
    if (cleanHrs < 0) return false;
    return pickEngagementTier(ctx) === 'low';
  },
};

// ---------------------------------------------------------------------
// Night Reflection Cue — engagement-tier agnostic. Silenced by prior
// reflection declaration per the Phase 8 spec.
// ---------------------------------------------------------------------

const night: Intervention = {
  id: 'smoking-night-reflection-cue',
  programId: PROGRAM_ID,
  title: 'One line closes the day',
  body: 'Reflection is one sentence. Not a report. Log what happened, then rest.',
  phase: 'night',
  priority: 'p2',
  ackKind: 'per-day',
  shouldFire: () => {
    const state = readyContext();
    if (state === null) return false;
    if (state.quitAt === null) return false;
    if (state.todayReflectionDeclared) return false;
    return true;
  },
};

/**
 * Complete Smoking-program intervention set consumed by the manifest.
 * Eleven records, but the tier gates make at most four fire per day
 * (one per phase). ADR 0009 §4 caps are respected inherently.
 */
export const SMOKING_INTERVENTIONS: readonly Intervention[] = [
  morningFullHigh,
  morningFullMedium,
  morningFullLow,
  morningShortHigh,
  morningShortMedium,
  morningShortLow,
  midday,
  eveningHigh,
  eveningMedium,
  eveningLow,
  night,
];
