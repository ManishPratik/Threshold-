import { reviewRepository } from '@data/repositories';
import type { Review, ReviewAnswer, ReviewKind } from '@data/types/Review';
import { type ISODate } from '@shared/lib/date';
import { defaultTimeProvider, type TimeProvider } from '@shared/lib/time';
import { generateId } from '@shared/lib/id';
import { isValidPromptId } from './prompts';
import { periodEndForKind, periodStartForKind } from './periods';

/**
 * Reviews domain service. Follows the ADR-0007 pattern: repository stays
 * persistence-only, this service owns lifecycle (period computation,
 * prompt-id validation, upsert-by-period, save vs submit distinction).
 *
 * A Review is uniquely keyed by (kind, periodStart) — enforced via the
 * `by-kind-periodStart` index. Save is upsert; submit sets a flag without
 * blocking further edits (users can amend after submitting; the flag exists
 * so Analytics can distinguish "in progress" vs "done" if a later surface
 * cares).
 */

const SCHEMA_VERSION = 1;

export const ANSWER_MAX_LENGTH = 5_000;

export interface ReviewsDeps {
  reviewRepository: typeof reviewRepository;
  time: TimeProvider;
}

const defaultDeps: ReviewsDeps = {
  reviewRepository,
  time: defaultTimeProvider,
};

export interface SaveReviewInput {
  kind: ReviewKind;
  periodStart: ISODate;
  answers: ReviewAnswer[];
  submit: boolean;
}

export interface ReviewValidationError {
  field: 'kind' | 'periodStart' | 'answers';
  message: string;
}

export class ReviewsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewsServiceError';
  }
}

// ────────────────────────────────────────────────────────────
// Validation (pure)
// ────────────────────────────────────────────────────────────

export function validateSaveInput(input: SaveReviewInput): ReviewValidationError[] {
  const errors: ReviewValidationError[] = [];

  if (input.periodStart.length === 0) {
    errors.push({ field: 'periodStart', message: 'Missing period start date.' });
  }

  // Filter to unique promptIds and validate each belongs to the kind's canonical set.
  const seen = new Set<string>();
  for (const a of input.answers) {
    if (seen.has(a.promptId)) {
      errors.push({
        field: 'answers',
        message: `Duplicate answer for prompt '${a.promptId}'.`,
      });
    }
    seen.add(a.promptId);

    if (!isValidPromptId(input.kind, a.promptId)) {
      errors.push({
        field: 'answers',
        message: `Unknown prompt '${a.promptId}' for kind '${input.kind}'.`,
      });
    }
    if (a.answer.length > ANSWER_MAX_LENGTH) {
      errors.push({
        field: 'answers',
        message: `Answers must stay under ${ANSWER_MAX_LENGTH} characters.`,
      });
    }
  }

  return errors;
}

// ────────────────────────────────────────────────────────────
// Service factory
// ────────────────────────────────────────────────────────────

export interface ReviewsService {
  currentPeriod(kind: ReviewKind): ISODate;
  getReviewForPeriod(kind: ReviewKind, periodStart: ISODate): Promise<Review | undefined>;
  saveReview(input: SaveReviewInput): Promise<Review>;
  listRecent(kind: ReviewKind, limit?: number): Promise<Review[]>;
}

export function createReviewsService(deps: ReviewsDeps = defaultDeps): ReviewsService {
  const { reviewRepository: reviews, time } = deps;

  return {
    currentPeriod(kind: ReviewKind): ISODate {
      return periodStartForKind(kind, time.currentLogicalDate());
    },

    async getReviewForPeriod(
      kind: ReviewKind,
      periodStart: ISODate,
    ): Promise<Review | undefined> {
      return reviews.getByKindAndPeriod(kind, periodStart);
    },

    async saveReview(input: SaveReviewInput): Promise<Review> {
      const errors = validateSaveInput(input);
      if (errors.length > 0) {
        throw new ReviewsServiceError(errors.map((e) => e.message).join(' '));
      }

      const now = time.nowIso();
      const existing = await reviews.getByKindAndPeriod(input.kind, input.periodStart);
      const periodEnd = periodEndForKind(input.kind, input.periodStart);

      if (existing) {
        const updated: Review = {
          ...existing,
          updatedAt: now,
          answers: input.answers,
          submitted: input.submit ? true : existing.submitted,
        };
        await reviews.put(updated);
        return updated;
      }

      const fresh: Review = {
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        schemaVersion: SCHEMA_VERSION,
        kind: input.kind,
        periodStart: input.periodStart,
        periodEnd,
        answers: input.answers,
        submitted: input.submit,
      };
      await reviews.put(fresh);
      return fresh;
    },

    async listRecent(kind: ReviewKind, limit = 12): Promise<Review[]> {
      const all = await reviews.listByKind(kind);
      return all
        .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
        .slice(0, limit);
    },
  };
}

export const reviewsService: ReviewsService = createReviewsService();
