import type { ReviewKind } from '@data/types/Review';

/**
 * Canonical prompt sets per review kind. Prompt `id` is the stable identity —
 * `text` can evolve without invalidating stored answers. Adding new prompts
 * is safe; removing or renaming an id would orphan historical answers, so
 * treat this file as append-only.
 *
 * Language deliberately flat: no motivational framing, no coaching, no
 * percentages, no streak language. Consistent with ADR 0008.
 */

export interface ReviewPrompt {
  id: string;
  text: string;
}

export const DAILY_PROMPTS: readonly ReviewPrompt[] = [
  { id: 'kept', text: 'What did you keep today?' },
  { id: 'missed', text: 'What did you miss?' },
  { id: 'carry', text: 'What will you carry into tomorrow?' },
];

export const WEEKLY_PROMPTS: readonly ReviewPrompt[] = [
  { id: 'went-well', text: 'What went well this week?' },
  { id: 'slipped', text: 'Where did you slip?' },
  { id: 'adjustment', text: 'What is one adjustment for next week?' },
];

export const MONTHLY_PROMPTS: readonly ReviewPrompt[] = [
  { id: 'built', text: 'What did you build this month?' },
  { id: 'patterns', text: 'What patterns did you notice?' },
  { id: 'carry', text: 'What are you carrying into next month?' },
];

export function promptsFor(kind: ReviewKind): readonly ReviewPrompt[] {
  switch (kind) {
    case 'daily':
      return DAILY_PROMPTS;
    case 'weekly':
      return WEEKLY_PROMPTS;
    case 'monthly':
      return MONTHLY_PROMPTS;
  }
}

export function isValidPromptId(kind: ReviewKind, id: string): boolean {
  return promptsFor(kind).some((p) => p.id === id);
}
