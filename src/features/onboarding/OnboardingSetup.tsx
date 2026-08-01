import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { activateNewMission, type MissionDraft } from '@features/mission-contract';
import { saveRoutineForActiveMission, type RoutineDraft } from '@features/routine-engine';
import {
  OnboardingSetupContext,
  type CommitAllOpts,
  type OnboardingSetupState,
} from './onboardingSetupContext';

/**
 * Provider component for the onboarding setup context. Wraps the /welcome
 * routes so Screens 3 → 4 → 5 share draft state. commitAll runs the two
 * existing domain writes in sequence — mission first (routine needs an
 * active mission), then routine. Neither service is modified.
 */
export function OnboardingSetupProvider({ children }: { children: ReactNode }) {
  const [missionDraft, setMissionDraftState] = useState<MissionDraft | null>(null);
  const [routineDraft, setRoutineDraftState] = useState<RoutineDraft | null>(null);

  const setMissionDraft = useCallback((draft: MissionDraft) => {
    setMissionDraftState(draft);
  }, []);

  const setRoutineDraft = useCallback((draft: RoutineDraft) => {
    setRoutineDraftState(draft);
  }, []);

  const reset = useCallback(() => {
    setMissionDraftState(null);
    setRoutineDraftState(null);
  }, []);

  const commitAll = useCallback(
    async (opts?: CommitAllOpts) => {
      if (!missionDraft) {
        throw new Error('Cannot commit — mission draft missing.');
      }
      if (!routineDraft) {
        throw new Error('Cannot commit — routine draft missing.');
      }
      // Forward the button-press instant so `mission.promisedAt` records the
      // true commitment moment, distinct from the DB-write time (activatedAt).
      await activateNewMission(
        missionDraft,
        undefined,
        opts?.promisedAt !== undefined ? { promisedAt: opts.promisedAt } : undefined,
      );
      await saveRoutineForActiveMission(routineDraft);
    },
    [missionDraft, routineDraft],
  );

  const value = useMemo<OnboardingSetupState>(
    () => ({
      missionDraft,
      routineDraft,
      setMissionDraft,
      setRoutineDraft,
      commitAll,
      reset,
    }),
    [missionDraft, routineDraft, setMissionDraft, setRoutineDraft, commitAll, reset],
  );

  return (
    <OnboardingSetupContext.Provider value={value}>
      {children}
    </OnboardingSetupContext.Provider>
  );
}
