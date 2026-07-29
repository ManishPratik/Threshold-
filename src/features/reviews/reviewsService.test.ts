import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createReviewsService,
  validateSaveInput,
  ReviewsServiceError,
  ANSWER_MAX_LENGTH,
  type ReviewsDeps,
  type SaveReviewInput,
} from './reviewsService';
import {
  DAILY_PROMPTS,
  MONTHLY_PROMPTS,
  WEEKLY_PROMPTS,
  isValidPromptId,
  promptsFor,
} from './prompts';
import {
  formatPeriodLabel,
  endOfMonth,
  periodEndForKind,
  periodStartForKind,
  startOfMonth,
  startOfWeek,
} from './periods';
import type { TimeProvider } from '@shared/lib/time';
import type { Review } from '@data/types/Review';

const TODAY = '2026-05-13'; // Wednesday
const NOW = '2026-05-13T10:00:00.000Z';
const fakeTime: TimeProvider = {
  nowIso: () => NOW,
  currentLogicalDate: () => TODAY,
};

function stubReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'r1',
    createdAt: '',
    updatedAt: '',
    schemaVersion: 1,
    kind: 'weekly',
    periodStart: '2026-05-11',
    periodEnd: '2026-05-17',
    answers: [],
    submitted: false,
    ...overrides,
  };
}

function makeDeps(state: { existing?: Review; listAll?: Review[] }): {
  deps: ReviewsDeps;
  put: ReturnType<typeof vi.fn>;
  getByKindAndPeriod: ReturnType<typeof vi.fn>;
} {
  const put = vi.fn(async () => undefined);
  const getByKindAndPeriod = vi.fn(async () => state.existing);
  const listByKind = vi.fn(async () => state.listAll ?? []);
  return {
    put,
    getByKindAndPeriod,
    deps: {
      reviewRepository: {
        put,
        getByKindAndPeriod,
        listByKind,
      } as unknown as ReviewsDeps['reviewRepository'],
      time: fakeTime,
    },
  };
}

beforeEach(() => vi.clearAllMocks());

describe('prompts', () => {
  it('promptsFor returns the correct set per kind', () => {
    expect(promptsFor('daily')).toBe(DAILY_PROMPTS);
    expect(promptsFor('weekly')).toBe(WEEKLY_PROMPTS);
    expect(promptsFor('monthly')).toBe(MONTHLY_PROMPTS);
  });

  it('isValidPromptId accepts canonical ids only', () => {
    expect(isValidPromptId('daily', 'kept')).toBe(true);
    expect(isValidPromptId('daily', 'went-well')).toBe(false);
    expect(isValidPromptId('weekly', 'went-well')).toBe(true);
    expect(isValidPromptId('monthly', 'carry')).toBe(true);
    expect(isValidPromptId('daily', 'unknown')).toBe(false);
  });
});

describe('periods', () => {
  it('startOfWeek returns the ISO Monday', () => {
    expect(startOfWeek('2026-05-13')).toBe('2026-05-11'); // Wed → Mon of that week
    expect(startOfWeek('2026-05-11')).toBe('2026-05-11'); // Monday is idempotent
    expect(startOfWeek('2026-05-17')).toBe('2026-05-11'); // Sunday → previous Monday
  });

  it('startOfMonth returns the first day of the month', () => {
    expect(startOfMonth('2026-05-13')).toBe('2026-05-01');
    expect(startOfMonth('2026-05-01')).toBe('2026-05-01');
  });

  it('endOfMonth returns the last day of the month', () => {
    expect(endOfMonth('2026-05-13')).toBe('2026-05-31');
    expect(endOfMonth('2026-02-15')).toBe('2026-02-28'); // 2026 is not a leap year
    expect(endOfMonth('2024-02-15')).toBe('2024-02-29'); // 2024 is a leap year
  });

  it('periodStartForKind picks the right anchor', () => {
    expect(periodStartForKind('daily', TODAY)).toBe(TODAY);
    expect(periodStartForKind('weekly', TODAY)).toBe('2026-05-11');
    expect(periodStartForKind('monthly', TODAY)).toBe('2026-05-01');
  });

  it('periodEndForKind computes the correct span', () => {
    expect(periodEndForKind('daily', TODAY)).toBe(TODAY);
    expect(periodEndForKind('weekly', '2026-05-11')).toBe('2026-05-17');
    expect(periodEndForKind('monthly', '2026-05-01')).toBe('2026-05-31');
  });

  it('formatPeriodLabel uses friendly forms', () => {
    expect(formatPeriodLabel('daily', TODAY, TODAY)).toBe('Today');
    expect(formatPeriodLabel('daily', '2026-05-10', TODAY)).toBe('May 10');
    expect(formatPeriodLabel('weekly', '2026-05-11', TODAY)).toBe('Week of May 11');
    expect(formatPeriodLabel('monthly', '2026-05-01', TODAY)).toBe('May 2026');
  });
});

describe('validateSaveInput', () => {
  it('accepts a well-formed input', () => {
    const input: SaveReviewInput = {
      kind: 'daily',
      periodStart: TODAY,
      answers: [{ promptId: 'kept', answer: 'the morning ritual' }],
      submit: false,
    };
    expect(validateSaveInput(input)).toEqual([]);
  });

  it('rejects unknown promptId for kind', () => {
    const errs = validateSaveInput({
      kind: 'daily',
      periodStart: TODAY,
      answers: [{ promptId: 'went-well', answer: 'x' }],
      submit: false,
    });
    expect(errs.map((e) => e.field)).toContain('answers');
  });

  it('rejects duplicate promptId', () => {
    const errs = validateSaveInput({
      kind: 'daily',
      periodStart: TODAY,
      answers: [
        { promptId: 'kept', answer: 'a' },
        { promptId: 'kept', answer: 'b' },
      ],
      submit: false,
    });
    expect(errs.map((e) => e.field)).toContain('answers');
  });

  it('rejects over-long answer', () => {
    const errs = validateSaveInput({
      kind: 'daily',
      periodStart: TODAY,
      answers: [{ promptId: 'kept', answer: 'x'.repeat(ANSWER_MAX_LENGTH + 1) }],
      submit: false,
    });
    expect(errs.map((e) => e.field)).toContain('answers');
  });

  it('rejects missing periodStart', () => {
    const errs = validateSaveInput({
      kind: 'daily',
      periodStart: '',
      answers: [],
      submit: false,
    });
    expect(errs.map((e) => e.field)).toContain('periodStart');
  });
});

describe('reviewsService.currentPeriod', () => {
  it('daily returns today', () => {
    const svc = createReviewsService(makeDeps({}).deps);
    expect(svc.currentPeriod('daily')).toBe(TODAY);
  });

  it('weekly returns the Monday of this week', () => {
    const svc = createReviewsService(makeDeps({}).deps);
    expect(svc.currentPeriod('weekly')).toBe('2026-05-11');
  });

  it('monthly returns the first of this month', () => {
    const svc = createReviewsService(makeDeps({}).deps);
    expect(svc.currentPeriod('monthly')).toBe('2026-05-01');
  });
});

describe('reviewsService.saveReview', () => {
  it('creates a new review when no existing one for (kind, periodStart)', async () => {
    const { deps, put } = makeDeps({});
    const svc = createReviewsService(deps);
    const saved = await svc.saveReview({
      kind: 'weekly',
      periodStart: '2026-05-11',
      answers: [{ promptId: 'went-well', answer: 'consistent focus' }],
      submit: false,
    });
    expect(saved.kind).toBe('weekly');
    expect(saved.periodStart).toBe('2026-05-11');
    expect(saved.periodEnd).toBe('2026-05-17');
    expect(saved.submitted).toBe(false);
    expect(saved.answers).toHaveLength(1);
    expect(put).toHaveBeenCalledTimes(1);
  });

  it('updates an existing review preserving id + createdAt', async () => {
    const existing = stubReview({
      id: 'r-original',
      createdAt: '2026-05-11T09:00:00.000Z',
      answers: [{ promptId: 'went-well', answer: 'old' }],
    });
    const { deps, put } = makeDeps({ existing });
    const svc = createReviewsService(deps);
    const updated = await svc.saveReview({
      kind: 'weekly',
      periodStart: '2026-05-11',
      answers: [{ promptId: 'went-well', answer: 'new' }],
      submit: false,
    });
    expect(updated.id).toBe('r-original');
    expect(updated.createdAt).toBe('2026-05-11T09:00:00.000Z');
    expect(updated.answers[0]?.answer).toBe('new');
    expect(updated.submitted).toBe(false);
    expect(put).toHaveBeenCalledTimes(1);
  });

  it('submit=true flips submitted; subsequent saves keep it true even with submit=false', async () => {
    const existing = stubReview({ submitted: true });
    const { deps } = makeDeps({ existing });
    const svc = createReviewsService(deps);
    const updated = await svc.saveReview({
      kind: 'weekly',
      periodStart: '2026-05-11',
      answers: [],
      submit: false,
    });
    expect(updated.submitted).toBe(true);
  });

  it('refuses invalid input before touching the DB', async () => {
    const { deps, put, getByKindAndPeriod } = makeDeps({});
    const svc = createReviewsService(deps);
    await expect(
      svc.saveReview({
        kind: 'daily',
        periodStart: TODAY,
        answers: [{ promptId: 'unknown', answer: 'x' }],
        submit: false,
      }),
    ).rejects.toBeInstanceOf(ReviewsServiceError);
    expect(put).not.toHaveBeenCalled();
    expect(getByKindAndPeriod).not.toHaveBeenCalled();
  });
});

describe('reviewsService.listRecent', () => {
  it('returns most-recent periods first, respecting limit', async () => {
    const list = [
      stubReview({ periodStart: '2026-04-01' }),
      stubReview({ periodStart: '2026-05-01' }),
      stubReview({ periodStart: '2026-03-01' }),
    ];
    const { deps } = makeDeps({ listAll: list });
    const svc = createReviewsService(deps);
    const result = await svc.listRecent('weekly', 2);
    expect(result.map((r) => r.periodStart)).toEqual(['2026-05-01', '2026-04-01']);
  });
});
