import type { ISODateTime } from '@shared/lib/date';

/** All persisted entities carry these fields. */
export interface BaseEntity {
  id: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  schemaVersion: number;
}
