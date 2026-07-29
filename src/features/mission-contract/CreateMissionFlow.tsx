import { useState } from 'react';
import { CreateMissionForm } from './CreateMissionForm';
import { ReviewMissionScreen } from './ReviewMissionScreen';
import { activateNewMission, type MissionDraft } from './missionContractService';

export interface CreateMissionFlowProps {
  /** Called after successful activation so the caller can refresh Today. */
  onActivated: () => void;
  /** Called when the user cancels before commit. */
  onCancel?: (() => void) | undefined;
}

type Step =
  | { kind: 'form'; draft: Partial<MissionDraft> }
  | { kind: 'review'; draft: MissionDraft }
  | { kind: 'committing'; draft: MissionDraft };

/**
 * Owns the form → review → commit state machine. Kept as an internal state
 * machine (not routes) because the flow is short and swapping to a route
 * would add navigation history the "one calm screen" UX brief argues against.
 */
export function CreateMissionFlow({ onActivated, onCancel }: CreateMissionFlowProps) {
  const [step, setStep] = useState<Step>({ kind: 'form', draft: {} });
  const [error, setError] = useState<string | undefined>(undefined);

  if (step.kind === 'form') {
    return (
      <CreateMissionForm
        initialDraft={step.draft}
        onCancel={onCancel}
        onSubmit={(draft) => {
          setError(undefined);
          setStep({ kind: 'review', draft });
        }}
      />
    );
  }

  const submitting = step.kind === 'committing';

  return (
    <ReviewMissionScreen
      draft={step.draft}
      submitting={submitting}
      errorMessage={error}
      onBack={() => setStep({ kind: 'form', draft: step.draft })}
      onCommit={() => {
        setStep({ kind: 'committing', draft: step.draft });
        setError(undefined);
        void (async () => {
          try {
            await activateNewMission(step.draft);
            onActivated();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong.');
            setStep({ kind: 'review', draft: step.draft });
          }
        })();
      }}
    />
  );
}
