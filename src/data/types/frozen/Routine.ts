import type { BaseEntity } from '../common';

/**
 * Anchor phase a routine block belongs to. See ADR 0009 §2 — four
 * fixed anchors in V1, extendable to `custom:${slug}` in V2 without
 * a schema migration. Custom slugs are intentionally not included on
 * the concrete `Anchor` type in Phase 6.
 */
export type Anchor = 'morning' | 'midday' | 'evening' | 'night';

/**
 * A block in the user's routine. Free-form `type` string with default
 * "Ritual"; no enum narrowing. Duration is minutes as an integer.
 *
 * `anchor`, `required`, `order`, `programOrigin` are additive optional
 * fields introduced in Phase 6. Existing records that predate the
 * migration default to `anchor = 'morning'` via `getBlockAnchor` —
 * no DB_VERSION bump required.
 */
export interface RoutineBlock {
  id: string;
  name: string;
  durationMinutes: number;
  type: string;
  anchor?: Anchor;
  required?: boolean;
  order?: number;
  programOrigin?: string;
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
