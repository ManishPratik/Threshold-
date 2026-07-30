import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReviewMissionScreen } from '@features/mission-contract';
import {
  onboardingService,
  useOnboardingSetup,
  WitnessRitual,
} from '@features/onboarding';
import { WelcomeFormShell } from './WelcomeFormShell';

/**
 * Screen 5 — Signature. The user reads their contract and presses
 * "I promise.". That press opens the witness ritual: commitAll runs in
 * parallel while the CSS-driven ritual plays. On "Begin today", the
 * onboarding-completed flag is set and the user is delivered to Today.
 *
 * Failure of commitAll surfaces as an error and returns the user to the
 * review — the ritual is honest; it will not celebrate a broken write.
 */
export function WelcomeScreen5() {
  const setup = useOnboardingSetup();
  const navigate = useNavigate();
  const [inRitual, setInRitual] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [committedIso, setCommittedIso] = useState<string | null>(null);

  useEffect(() => {
    if (!setup.missionDraft) {
      navigate('/welcome/promise', { replace: true });
    } else if (!setup.routineDraft) {
      navigate('/welcome/routine', { replace: true });
    }
  }, [setup.missionDraft, setup.routineDraft, navigate]);

  if (!setup.missionDraft || !setup.routineDraft) return null;

  const startRitual = () => {
    if (inRitual) return;
    setError(undefined);
    // Anchor the ritual on the exact moment of intent — the button press —
    // not on the DB write time (which comes a few ms later).
    const iso = new Date().toISOString();
    setCommittedIso(iso);
    setInRitual(true);
    void (async () => {
      try {
        await setup.commitAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save. Try again.');
        setInRitual(false);
        setCommittedIso(null);
      }
    })();
  };

  const handleBeginToday = () => {
    void (async () => {
      try {
        await onboardingService.markCompleted();
      } finally {
        navigate('/today');
      }
    })();
  };

  if (inRitual && committedIso) {
    return (
      <WitnessRitual
        missionTitle={setup.missionDraft.title.trim()}
        durationDays={setup.missionDraft.durationDays}
        committedIso={committedIso}
        onBeginToday={handleBeginToday}
      />
    );
  }

  return (
    <WelcomeFormShell
      kicker="Your contract"
      headline="Read this like you mean it."
      headingId="welcome-commit-heading"
    >
      <ReviewMissionScreen
        hideHeader
        draft={setup.missionDraft}
        errorMessage={error}
        onBack={() => navigate('/welcome/routine')}
        onCommit={startRitual}
      />
    </WelcomeFormShell>
  );
}
