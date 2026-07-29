import type { ISODate } from '@shared/lib/date';
import type { BaseEntity } from './common';

export type ReviewKind = 'daily' | 'weekly' | 'monthly';

export interface ReviewAnswer {
  promptId: string;
  answer: string;
}

export interface Review extends BaseEntity {
  kind: ReviewKind;
  periodStart: ISODate;
  periodEnd: ISODate;
  answers: ReviewAnswer[];
  submitted: boolean;
}
