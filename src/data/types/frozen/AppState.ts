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
  schemaVersion: number;
}

/** The literal id used for the singleton AppState record. */
export const APP_STATE_ID = 'app' as const;
