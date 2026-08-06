import type { FrozenBootData } from './boot';

/**
 * Where the app initially renders after boot.
 *
 * Post Home-first onboarding, this is always `'today'`. Home decides
 * its own state internally: it renders the onboarding surface when
 * `AppState.startingPoint` is unset and the operating composition
 * otherwise (see `FrozenTodayPage.tsx`). The kernel-level boot
 * decision has been retired.
 */
export type FrozenInitialRoute = 'today';

/**
 * Pure decision function. Always returns `'today'` because Home now
 * owns the onboarding-vs-operating decision internally. Preserved as a
 * function to keep the boot-time seam available for future re-widening
 * without touching `FrozenAppShell`.
 */
export function selectInitialRoute(_boot: FrozenBootData): FrozenInitialRoute {
  return 'today';
}
