/**
 * A single operating principle the user commits to follow while keeping
 * a mission's promise. Deliberately minimal — text and a stable id.
 *
 * Principles are NOT tasks: they are never marked complete and produce no
 * PromiseEvents. They exist to be re-read, not to be tracked. The stable id
 * lets the UI reorder, edit, and delete without index churn, and leaves a
 * seam for future per-principle metadata (adoptedAt, timesShown) without
 * shape breakage.
 */
export interface Principle {
  id: string;
  text: string;
}

/** Maximum characters per principle text. Tweet-sized so the "Remember"
 *  card on Today never wraps into a paragraph. */
export const PRINCIPLE_TEXT_MAX = 140;
