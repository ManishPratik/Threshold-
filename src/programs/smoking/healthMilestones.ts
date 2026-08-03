/**
 * Health-recovery milestones. Ported verbatim from
 * ac4b193~1:index.html lines 2951-2963 (`MILESTONES` array, ten
 * entries covering the pharmacological + cardiovascular + lung
 * recovery timeline). Each entry carries a minute-cutoff, an emoji,
 * a short title, and a longer descriptive paragraph.
 */

export interface HealthMilestone {
  /** Minutes-since-quit when this milestone is reached. */
  mins: number;
  emoji: string;
  title: string;
  desc: string;
}

export const HEALTH_MILESTONES: readonly HealthMilestone[] = [
  {
    mins: 20,
    emoji: '❤️',
    title: 'Heart Rate Drops',
    desc: 'Blood pressure begins normalizing. Your cardiovascular system starts recovery.',
  },
  {
    mins: 120,
    emoji: '🩸',
    title: '50% Nicotine Gone',
    desc: 'Half-life complete. Half the nicotine has already left your bloodstream.',
  },
  {
    mins: 480,
    emoji: '🫁',
    title: 'Carbon Monoxide Clears',
    desc: '8 hours. CO replaced by oxygen. Brain and body getting cleaner fuel.',
  },
  {
    mins: 720,
    emoji: '🧠',
    title: 'Nicotine Almost Gone',
    desc: '12 hours. Nicotine nearly cleared from blood. The parasite is starving.',
  },
  {
    mins: 1440,
    emoji: '👃',
    title: 'Taste & Smell Return',
    desc: '24 hours. Nicotine gone from blood. Sensory systems beginning to reawaken.',
  },
  {
    mins: 2880,
    emoji: '⚡',
    title: 'Nerve Endings Regenerating',
    desc: '48 hours. Damaged nerve endings start growing back. The body heals fast.',
  },
  {
    mins: 4320,
    emoji: '💪',
    title: 'Peak Withdrawal Passed',
    desc: '72 hours. The hardest phase is behind you. Nicotine fully cleared from blood.',
  },
  {
    mins: 10080,
    emoji: '🌬️',
    title: '1 Week — Lungs Clearing',
    desc: 'Cilia regenerating in lungs. Each breath is measurably cleaner than last week.',
  },
  {
    mins: 30240,
    emoji: '🫀',
    title: '3 Weeks — Traces Gone',
    desc: 'No traces of nicotine anywhere in your body. The parasite is completely dead.',
  },
  {
    mins: 43200,
    emoji: '🌟',
    title: '1 Month — Heart Risk ↓',
    desc: 'Circulation improved. Lung function increasing. Your body has adapted to life without the drug.',
  },
];

/**
 * Milestones already reached at the given clean-hours count. Ordered
 * oldest-first. Threshold source at ac4b193~1:index.html line 3742
 * uses the same predicate `cleanHrs*60 >= m.mins`.
 */
export function reachedHealthMilestones(
  cleanHrs: number,
): readonly HealthMilestone[] {
  const mins = cleanHrs * 60;
  return HEALTH_MILESTONES.filter((m) => mins >= m.mins);
}

/**
 * The next un-reached milestone at the given clean-hours count, or
 * `null` when every milestone has been reached. Threshold source at
 * ac4b193~1:index.html line 3743 uses the same predicate
 * `cleanHrs*60 < m.mins`.
 */
export function nextHealthMilestone(
  cleanHrs: number,
): HealthMilestone | null {
  const mins = cleanHrs * 60;
  return HEALTH_MILESTONES.find((m) => mins < m.mins) ?? null;
}
