/**
 * V1 Self-Trust constants. All scoring numbers live in this file so a
 * balance change (or a strategy swap) is a single-file diff.
 *
 * Restored from tag v1.0.0 (self-trust folder). The v1.0.0 shape included
 * pointsPerSkipped and pointsPerDeferred; both are removed here because
 * the current Frozen data model has neither concept — Declaration carries
 * only `kept` and `broken` verdicts, and BlockCompletion has no `skipped`
 * side. Zero-valued fields in the original had no effect on the score, so
 * their removal is behaviourally identical to the v1.0.0 formula.
 *
 * Version bump rule: any change to a value below MUST come with a new
 * strategy version. Historical snapshots (if ever added) record which
 * formula version wrote them.
 */
export const V1_CONSTANTS = {
  version: 1,
  name: 'V1SelfTrustStrategy',

  pointsPerKept: 1,
  pointsPerBroken: -2,

  fullDayBonus: 3,

  scoreFloor: 0,
} as const;

export type V1Constants = typeof V1_CONSTANTS;
