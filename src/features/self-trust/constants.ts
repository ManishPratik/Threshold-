/**
 * V1 Self-Trust constants. All scoring numbers live in this file so a
 * balance change (or a strategy swap) is a single-file diff.
 *
 * Version bump rule: any change to a value below MUST come with a new
 * strategy implementation and a corresponding version bump — historical
 * snapshots record which formula version wrote them.
 */
export const V1_CONSTANTS = {
  version: 1,
  name: 'V1SelfTrustStrategy',

  pointsPerKept: 1,
  pointsPerSkipped: 0,
  pointsPerBroken: -2,
  pointsPerDeferred: 0,

  fullDayBonus: 3,

  scoreFloor: 0,
} as const;

export type V1Constants = typeof V1_CONSTANTS;
