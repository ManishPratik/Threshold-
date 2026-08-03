import type { WormStage } from './science';

/**
 * Copy for each worm stage. Ported verbatim from
 * ac4b193~1:index.html lines 3568-3574 (`WORM_DATA` map keyed on stage
 * 1-5). Each stage carries a short chamber label, a "worm-stage" title
 * card, and a longer fact sentence explaining what the body is doing.
 */
export interface WormStageCopy {
  label: string;
  title: string;
  fact: string;
}

export const WORM_STAGE_COPY: Readonly<Record<WormStage, WormStageCopy>> = {
  1: {
    label: 'Fed & Demanding',
    title: 'The Parasite is Strong',
    fact: 'It has been feeding on you for years. You just cut off the supply. First 2 hours it still holds full strength.',
  },
  2: {
    label: 'Starving — 50% Gone',
    title: 'The Parasite is Weakening',
    fact: 'Nicotine half-life kicked in at Hour 2 — 50% already cleared. It is fighting back with cravings. That is fear, not power.',
  },
  3: {
    label: 'Collapsing — 5% Left',
    title: 'The Parasite is Collapsing',
    fact: 'Half-life complete. Only trace nicotine remains. It is running on empty. Every hour you hold is another blow.',
  },
  4: {
    label: 'Dying — Final Trace',
    title: 'The Parasite is Dying',
    fact: 'Nicotine is gone from your blood. The last few hours of trace clearance before it is fully dead. Withdrawal peaks now.',
  },
  5: {
    label: 'Dead ✓',
    title: 'The Parasite is Dead',
    fact: 'Nicotine fully cleared. Peak withdrawal passed. What you feel now is habit, not chemistry. Your mind is yours again.',
  },
};

/**
 * State-tier for the chamber percent display. Matches the color
 * ladder in ac4b193~1:index.html lines 3406-3414 (`stateCls` in
 * `updateChamber`).
 */
export type ChamberState =
  | 'critical'
  | 'high'
  | 'fading'
  | 'trace'
  | 'cleared';

export function selectChamberState(pct: number): ChamberState {
  if (pct >= 50) return 'critical';
  if (pct >= 20) return 'high';
  if (pct >= 5) return 'fading';
  if (pct > 0.01) return 'trace';
  return 'cleared';
}

/**
 * Format the chamber percent value the way Threshold does at
 * ac4b193~1:index.html lines 3403-3405 — integer above 10, one
 * decimal 1-10, two decimals 0.01-1, and "0" below that.
 */
export function formatChamberPct(pct: number): string {
  if (pct >= 10) return Math.round(pct).toString();
  if (pct >= 1) return pct.toFixed(1);
  if (pct >= 0.01) return pct.toFixed(2);
  return '0';
}
