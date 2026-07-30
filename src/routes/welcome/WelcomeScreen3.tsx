import { useNavigate } from 'react-router-dom';
import { CreateMissionForm } from '@features/mission-contract';
import { useOnboardingSetup } from '@features/onboarding';
import { WelcomeFormShell } from './WelcomeFormShell';

/**
 * Screen 3 — Promise. The user writes their first sentence. On "Review", the
 * mission draft is captured in the onboarding-setup context (not persisted)
 * and we advance to Screen 4 (Shape). The DB write happens at Screen 5 when
 * the user signs the contract.
 */
export function WelcomeScreen3() {
  const setup = useOnboardingSetup();
  const navigate = useNavigate();

  return (
    <WelcomeFormShell
      kicker="Your first promise"
      headline="So — what's the one promise?"
      sub="Small enough to keep on your worst day. Meaningful enough to matter on your best."
      headingId="welcome-promise-heading"
    >
      <CreateMissionForm
        hideHeader
        {...(setup.missionDraft ? { initialDraft: setup.missionDraft } : {})}
        onSubmit={(draft) => {
          setup.setMissionDraft(draft);
          navigate('/welcome/routine');
        }}
        onCancel={() => navigate('/welcome/reframe')}
      />
    </WelcomeFormShell>
  );
}
