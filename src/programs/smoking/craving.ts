/**
 * Pure state model + constants for the Threshold Craving system.
 * Ported verbatim from the Threshold source blob at ac4b193~1:index.html
 * lines 5395-5477 (constants, CRAV state, stage names, physiological-sigh
 * timing, and the entry shape written to `LS.CRAVING_LOG`).
 *
 * No I/O, no DOM. The storage layer at
 * `personal-os/src/programs/smoking/state.ts` writes these entries to
 * the legacy `settings` v1 IDB store (declared at
 * personal-os/src/data/db/schema.ts line 19). The UI at
 * `personal-os/src/programs/smoking/CravingSOSOverlay.tsx` consumes
 * these constants for the four-stage flow.
 */

/** Total pause window in seconds — 3 minutes per Threshold README
 *  line 130 "3-minute pause" and ac4b193~1:index.html line 2400
 *  aria-label "Craving SOS — start a 3-minute pause". */
export const CRAVING_PAUSE_SECONDS = 180;

/** The four flow stages defined at ac4b193~1:index.html lines 2582-2617. */
export type CravingStage = 'idle' | 'timer' | 'trigger' | 'done';

/** One breath-cycle step of the physiological sigh. Total cycle length
 *  = 8 seconds (2s + 1s + 5s) per ac4b193~1:index.html lines 5432-5436. */
export interface BreathStep {
  label: string;
  ms: number;
  cls: 'inhale' | 'hold' | 'exhale';
}

/** The three-step physiological-sigh cycle, ordered as the user
 *  experiences it. Values verbatim from ac4b193~1:index.html
 *  lines 5432-5436. */
export const BREATH_CYCLE: readonly BreathStep[] = [
  { label: 'Inhale — nose', ms: 2000, cls: 'inhale' },
  { label: 'Hold', ms: 1000, cls: 'hold' },
  { label: 'Exhale slowly — mouth', ms: 5000, cls: 'exhale' },
];

/** Every trigger the one-tap picker offers. Order + emoji + slug are
 *  verbatim from ac4b193~1:index.html lines 2600-2607. */
export interface TriggerOption {
  slug: string;
  label: string;
}

export const CRAVING_TRIGGERS: readonly TriggerOption[] = [
  { slug: 'coffee', label: '☕ Coffee' },
  { slug: 'stress', label: '🌀 Stress' },
  { slug: 'social', label: '👥 Social' },
  { slug: 'driving', label: '🚗 Driving' },
  { slug: 'boredom', label: '🕳️ Boredom' },
  { slug: 'alcohol', label: '🍺 Alcohol' },
  { slug: 'after-meal', label: '🍽️ After meal' },
  { slug: 'other', label: '⋯ Other' },
];

/** Motivational lines shown on the idle stage. Ported verbatim from
 *  ac4b193~1:index.html lines 5395-5401. */
export const CARR_LINES: readonly string[] = [
  'A craving is a sensation. It cannot make you smoke.',
  'This feeling passes whether you feed it or not. Try passing.',
  'The trap wants you to believe you are missing something. You are not.',
  'Wait three minutes. That is all it takes to prove it does not need you.',
  'Non-smokers get through these moments all the time. You are one of them now.',
];

/** Kind of craving event written to the log. Threshold source at
 *  ac4b193~1:index.html line 5470 writes `type: 'surfed'` only from
 *  the SOS flow; `type: 'lapse'` is written by the separate slip-log
 *  handler at ac4b193~1:index.html lines 3508-3514. Both types share
 *  the same on-disk shape. */
export type CravingEventType = 'surfed' | 'lapse';

/** One craving log entry, matching the Threshold shape at
 *  ac4b193~1:index.html lines 5464-5474 (ts, resisted, type, trigger,
 *  note). `ts` is a Unix millis timestamp for interoperability with
 *  the Threshold-era format. */
export interface CravingEntry {
  ts: number;
  resisted: boolean;
  type: CravingEventType;
  trigger: string;
  note: string;
}

/** Whether a picked trigger slug matches one the picker knows about.
 *  Pure — used by the overlay to enable the "Log it" button only when
 *  a trigger has been chosen. */
export function isKnownTrigger(slug: string): boolean {
  return CRAVING_TRIGGERS.some((t) => t.slug === slug);
}

/** Pick a random Carr line for the idle stage. Deterministic when
 *  `rand` is provided — tests inject a fixed generator. Falls back to
 *  an empty string in the impossible case of an empty array so no
 *  non-null assertion is needed. */
export function pickCarrLine(rand: () => number = Math.random): string {
  const idx = Math.floor(rand() * CARR_LINES.length);
  return CARR_LINES[idx] ?? CARR_LINES[0] ?? '';
}

/** How many entries in the log were surfed (`type === 'surfed'`).
 *  Threshold source at ac4b193~1:index.html line 5476 counts exactly
 *  this — the FAB counter reflects only successful pauses. */
export function countSurfed(entries: readonly CravingEntry[]): number {
  return entries.filter((e) => e.type === 'surfed').length;
}

/** Format an integer seconds count as `M:SS` for the pause countdown.
 *  Verbatim from ac4b193~1:index.html lines 5444-5446. */
export function formatCountdown(secondsRemaining: number): string {
  const clamped = Math.max(0, secondsRemaining);
  const m = Math.floor(clamped / 60);
  const s = Math.floor(clamped % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Build the CravingEntry a "surfed" event writes when the user has
 *  chosen a trigger and pressed "Log it". Mirrors ac4b193~1:index.html
 *  lines 5464-5474 exactly (ts, resisted, type, trigger, note). `now`
 *  is injected so tests are deterministic. */
export function buildSurfedEntry(
  trigger: string,
  now: number = Date.now(),
): CravingEntry {
  return {
    ts: now,
    resisted: true,
    type: 'surfed',
    trigger,
    note: `Surfed — trigger: ${trigger}`,
  };
}
