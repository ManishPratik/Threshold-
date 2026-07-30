import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoutineBuilder } from '@features/routine-engine';
import { useOnboardingSetup } from '@features/onboarding';
import { WelcomeFormShell } from './WelcomeFormShell';

/**
 * Screen 4 — Shape. The user arranges the blocks that will carry the promise.
 * The routine draft is captured (not persisted) via RoutineBuilder's
 * onDraftReady prop; commit happens at Screen 5.
 *
 * If the user lands here without a mission draft (deep-link or reload), we
 * redirect to Screen 3 so the flow order stays intact.
 */
export function WelcomeScreen4() {
  const setup = useOnboardingSetup();
  const navigate = useNavigate();

  useEffect(() => {
    if (!setup.missionDraft) {
      navigate('/welcome/promise', { replace: true });
    }
  }, [setup.missionDraft, navigate]);

  if (!setup.missionDraft) return null;

  return (
    <WelcomeFormShell
      kicker="Your day"
      headline="How will you keep it?"
      sub="Not a schedule. A shape. Small blocks you can actually start."
      headingId="welcome-routine-heading"
    >
      <RoutineBuilder
        hideHeader
        primaryLabel="Next"
        onDraftReady={(draft) => {
          setup.setRoutineDraft(draft);
          navigate('/welcome/commit');
        }}
        onCancel={() => navigate('/welcome/promise')}
        // onSaved never fires when onDraftReady is provided, but the prop is
        // required by the type. Provide a no-op.
        onSaved={() => {
          // Handled via onDraftReady in the onboarding flow.
        }}
      />
    </WelcomeFormShell>
  );
}
