import { useState } from 'react';
import { Button } from '@shared/ui';
import { isBootstrapMission } from '@data/db/seed';
import { CreateMissionFlow, MissionSummaryCard } from '@features/mission-contract';
import {
  CurrentFocusCard,
  ProgressSummary,
  RoutineBuilder,
  useRoutineToday,
} from '@features/routine-engine';
import { EndOfDayReflectionCard } from '@features/reviews';
import { RecoveryCard } from '@features/recovery-mode';
import styles from './TodayPage.module.css';

type Mode = 'view' | 'create-mission' | 'edit-routine';

/**
 * The Today experience. Composes:
 *   MissionSummary  →  CurrentFocus (hero)  →  ProgressSummary  →  EndOfDay.
 *
 * Three macro-modes: view (normal), create-mission (Mission Contract flow),
 * and edit-routine (Routine Builder). Mode swaps replace the whole main region
 * — the "one calm screen" UX brief argues against dual surfaces.
 *
 * Data-driven auto-guides: when there is no active mission we force the
 * creation flow with no Cancel; when there is a real mission but no routine
 * we force the routine builder with no Cancel. Both guides retire once the
 * user has committed the corresponding record.
 */
export function TodayPage() {
  const view = useRoutineToday();
  const [mode, setMode] = useState<Mode>('view');

  if (view.status === 'loading') {
    return null;
  }

  // Auto-guide: no mission at all → force mission creation.
  if (!view.mission) {
    return (
      <ShellPage>
        <CreateMissionFlow
          onActivated={() => {
            setMode('view');
            view.refresh();
          }}
        />
      </ShellPage>
    );
  }

  // Auto-guide: real mission with no routine → force routine builder.
  const missionIsBootstrap = isBootstrapMission(view.mission);
  const needsRoutineBuild = !missionIsBootstrap && !view.routine;

  if (mode === 'create-mission') {
    return (
      <ShellPage>
        <CreateMissionFlow
          onActivated={() => {
            setMode('view');
            view.refresh();
          }}
          onCancel={() => setMode('view')}
        />
      </ShellPage>
    );
  }

  if (mode === 'edit-routine' || needsRoutineBuild) {
    return (
      <ShellPage>
        <RoutineBuilder
          existing={view.routine ?? null}
          onSaved={() => {
            setMode('view');
            view.refresh();
          }}
          onCancel={
            !needsRoutineBuild
              ? () => {
                  setMode('view');
                }
              : undefined
          }
        />
      </ShellPage>
    );
  }

  // View mode requires a routine + dayLog + progress. This branch renders
  // only for the bootstrap-mission case where a routine also exists; a real
  // mission with no routine is intercepted by the auto-guide above.
  if (!view.routine || !view.dayLog || !view.progress) {
    return (
      <ShellPage>
        <p>Routine not set up yet.</p>
      </ShellPage>
    );
  }

  const showRecoveryCard =
    view.dayLog.state === 'recovery' &&
    view.focus === 'idle' &&
    view.progress.remainingBlocks > 0;

  return (
    <ShellPage>
      <MissionSummaryCard
        mission={view.mission}
        todayDayLog={view.dayLog}
        selfTrustScore={view.selfTrustScore}
        onCreateOwnContract={() => setMode('create-mission')}
        onMissionUpdated={view.applyMissionUpdate}
      />

      {showRecoveryCard && <RecoveryCard onBegin={view.start} />}

      <CurrentFocusCard
        block={view.progress.currentBlock}
        focus={view.focus}
        onStart={view.start}
        onPause={view.pause}
        onResume={view.resume}
        onComplete={() => {
          void view.complete();
        }}
      />

      <ProgressSummary progress={view.progress} />

      {!missionIsBootstrap && (
        <div className={styles.editRow}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMode('edit-routine')}
          >
            Edit routine
          </Button>
        </div>
      )}

      <EndOfDayReflectionCard />
    </ShellPage>
  );
}

function ShellPage({ children }: { children: React.ReactNode }) {
  return (
    <section className={styles.page} aria-labelledby="today-heading">
      <h1 id="today-heading" className="visually-hidden">
        Today
      </h1>
      {children}
    </section>
  );
}
