import { useState } from 'react';
import { Button } from '@shared/ui';
import { isBootstrapMission } from '@data/db/seed';
import { CreateMissionFlow, MissionSummaryCard } from '@features/mission-contract';
import {
  CurrentFocusCard,
  ProgressSummary,
  RoutineBuilder,
  SecondaryBlockCard,
  useRoutineToday,
} from '@features/routine-engine';
import { EndOfDayReflectionCard } from '@features/reviews';
import { RecoveryCard } from '@features/recovery-mode';
import styles from './TodayPage.module.css';

type Mode = 'view' | 'create-mission' | 'edit-routine';

/**
 * The Today experience. Composes:
 *   Greeting → MissionSummary → CurrentFocus (hero) → Progress → EndOfDay.
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
      <Greeting mission={view.mission} />

      <MissionSummaryCard
        mission={view.mission}
        todayDayLog={view.dayLog}
        selfTrustScore={view.selfTrustScore}
        onCreateOwnContract={() => setMode('create-mission')}
        onMissionUpdated={view.applyMissionUpdate}
      />

      {showRecoveryCard && <RecoveryCard onBegin={view.start} />}

      <div className={styles.focusEyebrow} aria-hidden="true">
        <span>Your only focus</span>
      </div>

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

      {view.progress.openBlocks.length > 1 && (
        <section className={styles.alsoSection} aria-labelledby="also-heading">
          <div className={styles.alsoEyebrow} id="also-heading">
            <span>Also in your day</span>
          </div>
          <div className={styles.alsoList}>
            {view.progress.openBlocks.slice(1).map((block) => (
              <SecondaryBlockCard
                key={block.id}
                block={block}
                onComplete={view.completeBlock}
              />
            ))}
          </div>
        </section>
      )}

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
    <section className={styles.page} aria-label="Today">
      {children}
    </section>
  );
}

/** Editorial greeting anchor — time-of-day + calendar date. */
function Greeting({ mission }: { mission: { title: string } }) {
  const now = new Date();
  const hour = now.getHours();
  const salute =
    hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className={styles.greeting}>
      <span className={styles.kicker}>{dateLabel}</span>
      <h1 className={styles.greetingTitle}>
        {salute}<span className={styles.greetingPunct}>.</span>
      </h1>
      <p className={styles.greetingSub}>
        Today's promise: <span className={styles.greetingMission}>{mission.title}</span>
      </p>
    </div>
  );
}
