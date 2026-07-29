import type { ISODateTime } from '@shared/lib/date';
import type { BaseEntity } from './common';

/**
 * Knowledge Vault entry. `deletedAt` supports soft-delete for undo;
 * hard-delete happens via a Settings-level purge action (not V1).
 */
export interface Note extends BaseEntity {
  title: string;
  body: string;
  tags: string[];
  deletedAt: ISODateTime | null;
}
