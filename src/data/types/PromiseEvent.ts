import type { ISODateTime } from '@shared/lib/date';
import type { BaseEntity } from './common';

export type PromiseKind = 'kept' | 'broken' | 'deferred';
export type PromiseSource = 'manual' | 'timer' | 'sweep';

/**
 * Append-only event log. Never mutated after insert.
 * Self-Trust is derived from this stream; SelfTrustSnapshot is a projection.
 */
export interface PromiseEvent extends BaseEntity {
  dayLogId: string;
  kind: PromiseKind;
  source: PromiseSource;
  blockId: string | null;
  missionId: string | null;
  at: ISODateTime;
  note: string;
}
