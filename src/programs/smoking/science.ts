/**
 * Threshold Smoking Program — science module.
 *
 * Pure functions and constants ported verbatim from the Threshold source
 * blob at ac4b193~1:index.html (Threshold-era single-page HTML PWA;
 * `getWormStage`, `nicotinePctRemaining`, `getWormScale` around lines
 * 3385-3480 and `PEAK_END_HOURS` + `HURDLES` array at lines 3188-3320
 * per the Threshold README lines 47-56 "chamber & science" section).
 *
 * No I/O, no React, no DOM. This module is the entire pure-logic slice of
 * the future Smoking Program. Widget consumers are deferred until the
 * minimum program-runtime slot infrastructure lands (backlog item 13).
 *
 * All science numbers are drawn from the Threshold README:
 *   - Half-life t½ = 2 hours (Threshold README line 47 "chamber & the
 *     science" section)
 *   - 50 % cleared at hour 2, gone by hour 72 (same section)
 *   - Peak-withdrawal window H0-H72 (Threshold README line 51)
 *   - Post-peak hurdles chain: 6 milestones (week1, week2, month1,
 *     month3, month6, year1) (Threshold README line 52)
 */

/** Hours after the last cigarette. Callers derive this from a
 *  Program-supplied "quit time" moment. Never negative in normal use;
 *  the science floors at 0. */
export type CleanHours = number;

/** Stage 1 through 5 of the visual "worm" — mirrors the parasite
 *  metaphor in the Threshold source. Stage 5 = fully cleared. */
export type WormStage = 1 | 2 | 3 | 4 | 5;

/** The one immutable science constant. Cross-referenced by the peak
 *  banner, the hurdles chain, the celebration overlay, and the
 *  nicotine-clearance narrative. */
export const PEAK_END_HOURS = 72;

/** Post-peak milestone. `hrs` is the exact hour cutoff. `id` is the
 *  stable key used for user-acknowledgement persistence in the future
 *  program-scoped state store. `ratchet` HTML strings are preserved
 *  verbatim from the Threshold source so the widget layer can render
 *  the emphasis structurally when it lands. */
export interface Hurdle {
  id: string;
  hrs: number;
  icon: string;
  label: string;
  headline: string;
  body: string;
  ratchet: string;
}

/** Six post-peak hurdles, from Threshold README line 52 and source
 *  blob at ac4b193~1:index.html lines 3270-3308. `ratchet` HTML markup
 *  (`<strong>...</strong>`) preserved for the widget renderer. */
export const HURDLES: readonly Hurdle[] = [
  {
    id: 'week1',
    hrs: 168,
    icon: '🚩',
    label: 'One Week',
    headline: 'Seven days smoke-free.',
    body: 'The habit loops are starting to fire without their old reward. Your body has learned that the cue arrives, and nothing follows. That is un-learning.',
    ratchet:
      'You crossed peak withdrawal 4 days ago. <strong>This hurdle was smaller.</strong> The next one is smaller still.',
  },
  {
    id: 'week2',
    hrs: 336,
    icon: '🛡️',
    label: 'Two Weeks',
    headline: 'Two weeks. The wiring is changing.',
    body: 'Dopamine receptors are recalibrating toward baseline production. What used to require a cigarette now generates its own quiet reward — a full breath, a completed task, a walk finished.',
    ratchet:
      'The peak took 72 hours of chemistry to cross. <strong>You just gave 14 days of habit-rewriting.</strong> Discipline, not chemistry — and you have more of it than you thought.',
  },
  {
    id: 'month1',
    hrs: 720,
    icon: '🔑',
    label: 'One Month',
    headline: 'One full month. Habit territory.',
    body: 'Cravings now are memory-triggered, not chemical. A place, a stress, a mood remembers what used to happen and asks. But your body no longer needs it. That gap between the ask and the need is where freedom lives.',
    ratchet:
      '<strong>Peak was chemistry — you crossed it in 3 days.</strong> This was habit — you just crossed 30. If you smoke now, you undo both.',
  },
  {
    id: 'month3',
    hrs: 2160,
    icon: '🌊',
    label: 'Three Months',
    headline: 'Baseline reset.',
    body: 'Nervous system fully recalibrated. Sleep, focus, mood, breath — the baseline you have now is what a non-smoker feels every day. This is not effort. This is who you are.',
    ratchet:
      'You are further from smoking than most people who quit ever get. <strong>The hardest hurdle was 90 days ago.</strong> Everything since has been maintenance.',
  },
  {
    id: 'month6',
    hrs: 4320,
    icon: '💎',
    label: 'Six Months',
    headline: 'Six months. Rare air.',
    body: 'Most people who attempt to quit relapse within the first 6 months. You are past that statistical wall. Neural rewire is deep. The identity is locked.',
    ratchet:
      '<strong>You already crossed something much harder than any craving you will ever face again.</strong> A single cigarette from here erases six months of proof. It will not.',
  },
  {
    id: 'year1',
    hrs: 8760,
    icon: '🏛️',
    label: 'One Year',
    headline: 'One full year of freedom.',
    body: 'You are not a former smoker. You are a non-smoker who used to smoke. The distinction is permanent. Your body has forgotten how to be dependent on this.',
    ratchet:
      '<strong>Peak withdrawal was 362 days ago.</strong> You crossed the biggest chemical hurdle before this year even started. Everything since has been evidence of who you are now.',
  },
];

/**
 * Fraction of nicotine still in the bloodstream, expressed as a percent
 * 0-100 inclusive. Ported verbatim from ac4b193~1:index.html line 3385:
 * `pct = 100 * 0.5^(cleanHrs / 2)`. Half-life t½ = 2h matches the
 * pharmacology used by every other visualisation in the source (chamber,
 * worm, banner).
 *
 * Anchors: hour 0 → 100 %, hour 2 → 50 %, hour 12 → 0.4 %, hour 24 → 0.02 %,
 * hour 72 → 0.0000... (effectively cleared per stage 5 of getWormStage).
 */
export function nicotinePctRemaining(cleanHrs: CleanHours): number {
  if (cleanHrs <= 0) return 100;
  const pct = 100 * Math.pow(0.5, cleanHrs / 2);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Stage of the nicotine-clearance parasite metaphor. Aligned with the
 * Threshold HOURLY_MSGS narrative per the Threshold source comment at
 * ac4b193~1:index.html line 3454:
 *   H2  — 50% cleared        H12 — half-life complete
 *   H24 — nicotine gone      H72 — fully cleared, peak passed
 *
 * Stage boundaries are strict inequalities on the LEFT (cleanHrs < X)
 * so the transition happens exactly at each anchor. Stage 5 covers all
 * hours at or beyond `PEAK_END_HOURS`.
 */
export function getWormStage(cleanHrs: CleanHours): WormStage {
  if (cleanHrs < 2) return 1; // Fed & Demanding (100 %-50 %)
  if (cleanHrs < 12) return 2; // Starving (50 %→5 %)
  if (cleanHrs < 24) return 3; // Collapsing (5 %→2 %)
  if (cleanHrs < PEAK_END_HOURS) return 4; // Dying — final trace
  return 5; // Dead — fully cleared from blood
}

/**
 * Continuous shrink factor 0-1 tracking nicotine half-life clearance.
 * Ported verbatim from ac4b193~1:index.html line 3474. Piecewise-linear
 * interpolation between anchor stops chosen to match the app's
 * self-narrated clearance timeline.
 *
 * Anchors: (0, 1.00), (1, 0.70), (2, 0.50), (4, 0.25), (6, 0.15),
 * (8, 0.10), (12, 0.05), (24, 0.02), (72, 0.01). Values at or beyond
 * hour 72 clamp to the final anchor (0.01).
 */
export function getWormScale(cleanHrs: CleanHours): number {
  const stops: ReadonlyArray<readonly [number, number]> = [
    [0, 1.0],
    [1, 0.7],
    [2, 0.5],
    [4, 0.25],
    [6, 0.15],
    [8, 0.1],
    [12, 0.05],
    [24, 0.02],
    [PEAK_END_HOURS, 0.01],
  ];
  const last = stops[stops.length - 1];
  if (!last) return 1;
  if (cleanHrs >= last[0]) return last[1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (!a || !b) continue;
    const [h0, s0] = a;
    const [h1, s1] = b;
    if (cleanHrs >= h0 && cleanHrs < h1) {
      const t = (cleanHrs - h0) / (h1 - h0);
      return s0 + t * (s1 - s0);
    }
  }
  return 1;
}

/**
 * Every crossed hurdle for the current `cleanHrs`, in chronological
 * order. A hurdle is "crossed" when `cleanHrs >= hurdle.hrs`. Used by
 * the future widget to render the milestone chain and by the
 * program-scoped state layer to know which hurdles are eligible for
 * user acknowledgement.
 */
export function crossedHurdles(cleanHrs: CleanHours): readonly Hurdle[] {
  return HURDLES.filter((h) => cleanHrs >= h.hrs);
}

/**
 * The next un-crossed hurdle for the current `cleanHrs`, or null when
 * every hurdle has been crossed. Callers render the countdown / ratchet
 * copy against this. `undefined` from `Array.find` is normalised to
 * `null` here so the return type is easier to narrow at the call site.
 */
export function nextHurdle(cleanHrs: CleanHours): Hurdle | null {
  return HURDLES.find((h) => cleanHrs < h.hrs) ?? null;
}
