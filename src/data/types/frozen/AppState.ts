/**
 * Singleton pointer record. The only pointer to the active Promise.
 * `id` is the literal string `'app'` — one record per install.
 *
 * `currentPromiseId` is null when there is no active Promise (first launch,
 * post-Break, post-Completion). Today's no-active-Promise auto-guide reads
 * this field to decide whether to render the promise-creation flow.
 */
export interface AppState {
  id: 'app';
  currentPromiseId: string | null;
  /**
   * Ids of registered Life Programs the user has enabled. Optional so
   * existing AppState rows written before program-runtime landed remain
   * valid without a schema bump. `undefined` and `[]` are both read as
   * "no programs enabled" by the runtime.
   */
  enabledProgramIds?: readonly string[];
  /**
   * The Starting Point the user picked during first-launch onboarding.
   * Set exactly once when the user selects one of the Home starting-point
   * cards. `undefined` means onboarding has not yet been completed —
   * Home renders its onboarding state (`FrozenTodayPage` branches on
   * `startingPoint === null`). Values are opaque strings written by the
   * onboarding surface; the field is optional so existing AppState rows
   * remain valid without a schema bump (same pattern as
   * `enabledProgramIds` above).
   */
  startingPoint?: string;
  schemaVersion: number;
}

/** The literal id used for the singleton AppState record. */
export const APP_STATE_ID = 'app' as const;
