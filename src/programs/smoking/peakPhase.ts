import { PEAK_END_HOURS } from './science';

/**
 * Sub-zones of the peak-withdrawal window. Copy ported verbatim from
 * ac4b193~1:index.html lines 3242-3258 (four sub-phases inside the
 * H0-H72 window).
 */
export interface PeakPhase {
  id: 'entering' | 'day1' | 'deepest' | 'final';
  title: string;
  subtitle: string;
}

export const PEAK_PHASES: readonly PeakPhase[] = [
  {
    id: 'entering',
    title: 'PEAK WITHDRAWAL · ENTERING',
    subtitle:
      'The parasite has just realised the food is cut. First cravings arrive within 2 hours. Each one lasts 3-5 minutes maximum. Ride the wave.',
  },
  {
    id: 'day1',
    title: 'PEAK WITHDRAWAL · DAY 1',
    subtitle:
      'You are inside the hardest stretch of your entire journey. Every craving you resist right now is worth ten cravings resisted later.',
  },
  {
    id: 'deepest',
    title: 'PEAK WITHDRAWAL · DEEPEST HOURS',
    subtitle:
      'The peak of the peak. Receptors recalibrating hardest right now. Your body is doing the work — you just have to hold. Do not negotiate with the parasite.',
  },
  {
    id: 'final',
    title: 'PEAK WITHDRAWAL · FINAL STRETCH',
    subtitle:
      'You have already crossed the deepest hours. What remains is the tail. Close this window and you have permanently crossed the biggest hurdle of the entire quit.',
  },
];

/**
 * Select the peak-phase copy for the given `cleanHrs`. Boundaries
 * match ac4b193~1:index.html lines 3240-3258 exactly:
 *   cleanHrs <  4  → entering
 *   cleanHrs < 24  → day1
 *   cleanHrs < 48  → deepest
 *   cleanHrs < PEAK_END_HOURS → final
 *   otherwise → null (peak already crossed)
 */
export function selectPeakPhase(cleanHrs: number): PeakPhase | null {
  if (cleanHrs >= PEAK_END_HOURS) return null;
  if (cleanHrs < 4) return PEAK_PHASES[0] ?? null;
  if (cleanHrs < 24) return PEAK_PHASES[1] ?? null;
  if (cleanHrs < 48) return PEAK_PHASES[2] ?? null;
  return PEAK_PHASES[3] ?? null;
}

/**
 * Fraction of the peak-withdrawal window already crossed, clamped
 * 0-1. Matches ac4b193~1:index.html line 3232 formula
 * `Math.min(100, (cleanHrs / PEAK_END_HOURS) * 100)` scaled to
 * 0-1 for use with the ProgressBar shared component.
 */
export function peakCrossedFraction(cleanHrs: number): number {
  if (cleanHrs <= 0) return 0;
  if (cleanHrs >= PEAK_END_HOURS) return 1;
  return cleanHrs / PEAK_END_HOURS;
}

/**
 * Hours remaining in the peak window. Zero once the peak has been
 * crossed. Matches ac4b193~1:index.html line 3223 formula
 * `Math.max(0, PEAK_END_HOURS - cleanHrs)`.
 */
export function peakHoursRemaining(cleanHrs: number): number {
  return Math.max(0, PEAK_END_HOURS - cleanHrs);
}

/**
 * Format the remaining peak-window time as `Xh Ym`. Matches the
 * display format in ac4b193~1:index.html lines 3225-3228.
 */
export function formatPeakRemaining(cleanHrs: number): string {
  const rem = peakHoursRemaining(cleanHrs);
  const h = Math.floor(rem);
  const m = Math.floor((rem - h) * 60);
  return `${h}h ${m}m`;
}
