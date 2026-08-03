/**
 * Choose the one-line copy per the Phase 11 spec. Never exposes raw
 * percentages, never technical wording.
 *
 * Cases:
 *   total > 0 AND seen === total  → "You've completed every guidance moment today."
 *   total > 0 AND seen === 0      → "Today's guidance is waiting."
 *   total > 0 AND 0 < seen < total → "You've engaged with N of M guidance moments today."
 *   total === 0 AND seen > 0      → "You've engaged with every guidance moment today."
 *   otherwise                     → null (component returns null)
 */
export function pickLine(seen: number, total: number): string | null {
  if (total > 0 && seen === total) {
    return "You've completed every guidance moment today.";
  }
  if (total > 0 && seen === 0) {
    return "Today's guidance is waiting.";
  }
  if (total > 0 && seen > 0 && seen < total) {
    const moment = total === 1 ? 'guidance moment' : 'guidance moments';
    return `You've engaged with ${seen} of ${total} ${moment} today.`;
  }
  if (total === 0 && seen > 0) {
    return "You've engaged with every guidance moment today.";
  }
  return null;
}
