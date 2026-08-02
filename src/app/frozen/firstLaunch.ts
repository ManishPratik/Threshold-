import type { FrozenBootData } from './boot';

/**
 * Where the app initially renders after boot per the Blocker Resolutions
 * §6 first-launch behaviour: users with no active Promise land on the
 * promise-creation flow; users with an active Promise land on Today.
 */
export type FrozenInitialRoute = 'create-promise' | 'today';

/**
 * Pure decision function for the frozen first-launch behaviour. Given
 * the resolved boot data, returns which route the mounted shell should
 * render first.
 *
 * The frozen product does not seed example content — a brand-new user
 * and a user who has just broken/completed their last Promise both
 * arrive at the same terminus: promise-creation. Distinguishing them is
 * a UI-copy concern that lives on the Create-Promise page, not in this
 * routing decision.
 */
export function selectInitialRoute(boot: FrozenBootData): FrozenInitialRoute {
  return boot.activePromise === null ? 'create-promise' : 'today';
}
