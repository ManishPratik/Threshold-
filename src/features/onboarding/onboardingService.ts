import { settingRepository } from '@data/repositories';
import type { Setting } from '@data/types';
import { generateId } from '@shared/lib/id';
import { defaultTimeProvider, type TimeProvider } from '@shared/lib/time';

/**
 * Onboarding completion marker. The V1.1 witness ritual routes new users
 * through /welcome; on first "I promise." press this flag is set and never
 * unset. Existing installations without the flag get routed to /welcome once
 * (see OnboardingGate) — unless the DB already has an active user mission
 * (they installed before this shipped), in which case the gate marks them
 * completed silently. See ADR-adjacent notes in the onboarding feature README.
 *
 * The flag lives as a key-value row in the existing `settings` store — no
 * schema change, no DB_VERSION bump.
 */

const KEY = 'onboarding.completedAt';
const SETTING_ID = 'setting-onboarding-completed';

export interface OnboardingDeps {
  settings: typeof settingRepository;
  time: TimeProvider;
}

const defaultDeps: OnboardingDeps = {
  settings: settingRepository,
  time: defaultTimeProvider,
};

export interface OnboardingService {
  /** Returns the ISO timestamp of completion, or null when not yet completed. */
  getCompletedAt(): Promise<string | null>;
  /** Idempotent. Persists the flag with `now` if not already set. */
  markCompleted(): Promise<string>;
}

export function createOnboardingService(deps: OnboardingDeps = defaultDeps): OnboardingService {
  const { settings, time } = deps;

  return {
    async getCompletedAt(): Promise<string | null> {
      const row = await settings.getByKey(KEY);
      if (!row) return null;
      if (row.type !== 'string') return null;
      const value = row.value;
      return typeof value === 'string' && value.length > 0 ? value : null;
    },

    async markCompleted(): Promise<string> {
      const existing = await settings.getByKey(KEY);
      if (existing && existing.type === 'string' && typeof existing.value === 'string' && existing.value.length > 0) {
        return existing.value;
      }
      const now = time.nowIso();
      const row: Setting = {
        id: existing?.id ?? SETTING_ID,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        schemaVersion: 1,
        key: KEY,
        type: 'string',
        value: now,
      };
      // Guard against a stale id conflict — fall back to generateId if the
      // fixed id is somehow already taken by a foreign row.
      if (!existing) {
        const dup = await settings.getById(SETTING_ID);
        if (dup && dup.id === SETTING_ID) {
          row.id = generateId();
        }
      }
      await settings.put(row);
      return now;
    },
  };
}

export const onboardingService: OnboardingService = createOnboardingService();
