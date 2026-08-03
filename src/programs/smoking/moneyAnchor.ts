export interface MoneyAnchor {
  min: number;
  txt: string;
}

// Money-anchor ladder verbatim from ac4b193~1:index.html lines 3492-3502.
// Currency is Rupees per that source.
export const MONEY_ANCHORS: readonly MoneyAnchor[] = [
  { min: 0, txt: '= one clean day at a time' },
  { min: 500, txt: '= a good meal out' },
  { min: 1500, txt: '= a book you have been meaning to read' },
  { min: 3000, txt: '= a pair of running shoes' },
  { min: 6000, txt: '= two pairs of running shoes' },
  { min: 12000, txt: '= 4 months gym membership' },
  { min: 25000, txt: '= a weekend trip' },
  { min: 50000, txt: '= a short holiday' },
  { min: 100000, txt: '= a domestic flight + hotel week' },
];

// Personal-benefit anchor for a running total. Iterates the ladder in
// order and returns the last-matched entry — matches ac4b193~1:index.html
// lines 3502-3506.
export function selectMoneyAnchor(rupees: number): string {
  let out = MONEY_ANCHORS[0]?.txt ?? '';
  for (const a of MONEY_ANCHORS) {
    if (rupees >= a.min) out = a.txt;
  }
  return out;
}

// Money saved to date. Matches ac4b193~1:index.html line 3706 formula
// `Math.floor(cleanDays * S.packCost)`.
export function moneySavedRupees(
  cleanHrs: number,
  packCostRupees: number,
): number {
  const cleanDays = cleanHrs / 24;
  return Math.floor(cleanDays * packCostRupees);
}

// Natural High meter percent 0-100. Matches ac4b193~1:index.html
// line 3699 formula `Math.min(100, (cleanHrs / (24*90)) * 100)` —
// 3 months clean = 100 percent.
export function naturalHighPercent(cleanHrs: number): number {
  return Math.min(100, (cleanHrs / (24 * 90)) * 100);
}

// Body-awareness copy verbatim from ac4b193~1:index.html lines 3484-3488.
// Three zones by clean-hours cutoff.
export function bodyAwarenessCopy(cleanHrs: number): string {
  if (cleanHrs < 72)
    return 'Day 1-3. Withdrawal fog is real and expected. This is the drug leaving. It is not who you are.';
  if (cleanHrs < 336)
    return 'The fog is lifting. Sleep and focus rebuild in weeks, not days.';
  return 'Your baseline is returning. Full lungs. Clear head. This is the natural state, not an achievement.';
}
