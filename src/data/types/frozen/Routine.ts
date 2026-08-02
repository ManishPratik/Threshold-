import type { BaseEntity } from '../common';

/**
 * A block in the user's routine. Free-form `type` string with default
 * "Ritual"; no enum narrowing. Duration is minutes as an integer.
 */
export interface RoutineBlock {
  id: string;
  name: string;
  durationMinutes: number;
  type: string;
}

/**
 * One routine per Promise. `promiseId` is required and unique — the
 * uniqueness is enforced at the object-store index level. Creating a
 * new Promise creates no routine; the user authors it from the empty
 * variant of the Routine screen.
 */
export interface Routine extends BaseEntity {
  promiseId: string;
  blocks: RoutineBlock[];
}
