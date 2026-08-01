import { createContext, useContext } from 'react';
import type { MissionDraft } from '@features/mission-contract';
import type { RoutineDraft } from '@features/routine-engine';

/**
 * Onboarding setup context — holds the two drafts captured during the
 * /welcome flow so nothing persists to IndexedDB until Screen 5's ritual.
 * Split from OnboardingSetupProvider so the provider file exports a single
 * component (satisfies react-refresh/only-export-components).
 */
export interface CommitAllOpts {
  /**
   * ISO timestamp of the user's exact "I promise." press moment. Captured by
   * Screen 5 before commitAll runs and forwarded verbatim to the mission
   * service so `mission.promisedAt` anchors the keepsake on the true moment
   * of intent — independent of DB-write latency.
   */
  promisedAt?: string;
}

export interface OnboardingSetupState {
  missionDraft: MissionDraft | null;
  routineDraft: RoutineDraft | null;
  setMissionDraft: (draft: MissionDraft) => void;
  setRoutineDraft: (draft: RoutineDraft) => void;
  commitAll: (opts?: CommitAllOpts) => Promise<void>;
  reset: () => void;
}

export const OnboardingSetupContext = createContext<OnboardingSetupState | null>(null);

export function useOnboardingSetup(): OnboardingSetupState {
  const ctx = useContext(OnboardingSetupContext);
  if (!ctx) {
    throw new Error('useOnboardingSetup must be used inside OnboardingSetupProvider');
  }
  return ctx;
}
