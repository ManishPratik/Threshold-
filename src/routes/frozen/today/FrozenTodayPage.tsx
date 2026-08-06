import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurfaceErrorBoundary } from '@features/daily-flow-engine';
import type { Principle } from '@data/types/Principle';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import type { RoutineBlock } from '@data/types/frozen/Routine';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import {
  ANCHOR_LABELS,
  groupByAnchor,
  orderedAnchorsWithBlocks,
} from '@features/routine-engine';
import { DailyFlowSummary, InterventionQueue } from '@features/daily-flow-engine';
import { listHomeSurfaces } from '@kernel/registry';
import type { SelfTrustResult } from '@features/self-trust';
import type { ReflectionInvitationState } from './reflectionState';
import {
  computeDayNumber,
  totalDaysBetween,
  type ISODate,
} from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import styles from './FrozenTodayPage.module.css';


/**
 * Slice E — Home multi-module composition.
 *
 * Iterates every registered module's contributed home surfaces via
 * `listHomeSurfaces()` at `src/kernel/registry/index.ts:75` and
 * renders each in `identity → hero → supporting → quiet` layer order
 * (descending weight within a layer). Home contains no module-specific
 * rendering logic. A future module contributes to Home by declaring
 * `homeSurfaces` on its manifest and calling `registerModule` — no
 * edit to this file required.
 */
function HomeModuleSurfaces({ today }: { today: ISODate }) {
  const surfaces = listHomeSurfaces();
  return (
    <>
      {surfaces.map((s, idx) => {
        const Surface = s.component;
        return (
          <SurfaceErrorBoundary key={`${s.layer}-${idx}`}>
            <Surface today={today} />
          </SurfaceErrorBoundary>
        );
      })}
    </>
  );
}

export interface FrozenTodayPageProps {
  /** Fired when the "Reflect." button is tapped. Default: noop. */
  onReflect?: () => void;
  /** Fired when the promise anchor is tapped. Default: noop. */
  onPromiseAnchorTap?: () => void;
  /** Fired when the "Edit routine" link is tapped. Default: noop. */
  onEditRoutine?: () => void;
  /**
   * Fired when the empty-state "Make one." text link is tapped. Reserved
   * for the pre-onboarding Promise-forced empty-state path; post
   * Home-first-onboarding the empty-state links to `/modules` via
   * `onExplore` instead. Kept optional for backward compatibility with
   * adapters that still wire the create-promise callback.
   */
  onCreatePromise?: () => void;
  /**
   * Fired when the "Choose a module to begin." link is tapped in the
   * post-onboarding empty state (user picked "Look around first." and
   * has no active Promise). Default: noop.
   */
  onExplore?: () => void;
}

/**
 * Frozen-architecture Today screen. Consumes only PromiseService,
 * RoutineService, and DeclarationService. Presentation-only refactor —
 * business logic, lifecycle, and callback shapes are unchanged.
 */
export function FrozenTodayPage(_props: FrozenTodayPageProps = {}) {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [today] = useState<ISODate>(currentLogicalDate());
  // `undefined` = not yet loaded from AppState; `null` = onboarding not
  // yet completed (Home renders the onboarding state); string = user
  // has picked a Starting Point (Home renders operating state).
  const [startingPoint, setStartingPoint] = useState<string | null | undefined>(
    undefined,
  );

  // Load the chosen Starting Point on mount. Independent of any module's
  // data loading — modules load their own data via their registered
  // Home surfaces (see src/features/frozen/promise/promiseModule.ts +
  // src/features/frozen/promise/usePromiseHomeState.ts for Promise;
  // Smoking uses its own manifest under src/programs/smoking/).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const repo = new AppStateRepository();
      const sp = await repo.getStartingPoint();
      if (!cancelled) setStartingPoint(sp);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChooseStartingPoint = async (
    sp: 'quit-addiction' | 'daily-routine' | 'serious-promise' | 'look-around',
  ) => {
    const repo = new AppStateRepository();
    try {
      await repo.setStartingPoint(sp);
      // Slice G — Onboarding decoupling. Each Starting Point opens its
      // own module. No handler funnels into another module's creation
      // surface; no module is the gateway to another. Users who pick
      // "quit-addiction" get Smoking enabled and land on Home where
      // Smoking's ambient widget renders via the registry; Promise is
      // one option among many, no longer forced.
      if (sp === 'quit-addiction') {
        // Enable Smoking; then Home renders (Smoking's ambient widget
        // appears via listHomeSurfaces per Slice E). User can create a
        // Promise separately if they choose — no forced navigation.
        await repo.setEnabledProgramIds(['smoking']);
        setStartingPoint(sp);
      } else if (sp === 'daily-routine') {
        // Open the Routine module directly. Routine works in orphan
        // mode per Slice C — no Promise required.
        navigate('/modules/routine');
      } else if (sp === 'serious-promise') {
        // User explicitly chose Promise. Route to Promise creation.
        // This is the only Starting Point that opens Promise.
        navigate('/create-promise');
      } else {
        // 'look-around' — stay on Home; the empty layer(s) invite
        // the user to visit /modules via the platform NavBar.
        setStartingPoint(sp);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your choice.');
    }
  };

  return (
    <div className={styles.column}>
      <Greeting />
      {startingPoint === undefined ? (
        <p className={styles.loadingLine}>Loading Personal OS.</p>
      ) : startingPoint === null ? (
        <OnboardingSection
          onChoose={(sp) => {
            void handleChooseStartingPoint(sp);
          }}
        />
      ) : (
        <>
          {/* Slice E — Home multi-module composition. Home enumerates
              registered modules' contributed home surfaces via
              listHomeSurfaces() and renders each in layer order. Home
              contains no module-specific rendering logic. Promise
              contributes through `registerModule` at
              src/features/frozen/promise/promiseModule.ts, Smoking's
              legacy todayWidget auto-aliases through the same
              mechanism per src/kernel/registry/index.ts:98-107. */}
          <HomeModuleSurfaces today={today} />
          {/* Platform-level daily-flow engine surfaces (not module
              contributions). Both accept an optional promiseId — the
              engine passes undefined when no active Promise, and each
              surface self-nulls per InterventionQueue.tsx:130-132 /
              DailyFlowSummary.tsx:117 when nothing fires. */}
          <InterventionQueue />
          <DailyFlowSummary />
        </>
      )}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Greeting() {
  const now = new Date();
  const hour = now.getHours();
  const salute =
    hour < 5
      ? 'Still up'
      : hour < 12
        ? 'Good morning'
        : hour < 18
          ? 'Good afternoon'
          : 'Good evening';
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return (
    <header>
      <p className={styles.greetingEyebrow}>{dateLabel}</p>
      <p className={styles.greetingSalute}>{salute}.</p>
    </header>
  );
}

export function PromiseAnchor({
  promise,
  today,
  yesterdayVerdict,
  onTap,
}: {
  promise: PromiseRecord;
  today: ISODate;
  yesterdayVerdict: 'kept' | 'broken' | null;
  onTap: () => void;
}) {
  const dayN = computeDayNumber(promise.startDate, today);
  const totalM = totalDaysBetween(promise.startDate, promise.endDate);
  const yesterdayLabel =
    yesterdayVerdict === 'kept'
      ? 'Yesterday kept.'
      : yesterdayVerdict === 'broken'
        ? 'Yesterday broken.'
        : null;
  const yesterdayClass =
    yesterdayVerdict === 'kept'
      ? `${styles.anchorYesterday} ${styles.anchorYesterdayKept}`
      : yesterdayVerdict === 'broken'
        ? `${styles.anchorYesterday} ${styles.anchorYesterdayBroken}`
        : styles.anchorYesterday;
  return (
    <button
      type="button"
      className={styles.anchor}
      onClick={onTap}
      title={promise.title}
    >
      <span className={styles.anchorTitle}>{promise.title}</span>
      <span className={styles.anchorDay}>
        Day {dayN} of {totalM}
      </span>
      {yesterdayLabel !== null ? (
        <span className={yesterdayClass}>{yesterdayLabel}</span>
      ) : null}
    </button>
  );
}

function OnboardingSection({
  onChoose,
}: {
  onChoose: (
    sp: 'quit-addiction' | 'daily-routine' | 'serious-promise' | 'look-around',
  ) => void;
}) {
  return (
    <section aria-label="Getting started">
      <p className={styles.welcomeEyebrow}>Welcome to Personal OS.</p>
      <h1 className={styles.welcomeQuestion}>
        What would you like help with today?
      </h1>
      <div className={styles.startingPoints}>
        <StartingPointCard
          title="Quit an addiction."
          subtitle="Nicotine, sugar, screens."
          onSelect={() => onChoose('quit-addiction')}
        />
        <StartingPointCard
          title="Build a daily routine."
          subtitle="Blocks by morning, midday, evening, night."
          onSelect={() => onChoose('daily-routine')}
        />
        <StartingPointCard
          title="Keep a promise to yourself."
          subtitle="A contract with a start, an end, and an honour."
          onSelect={() => onChoose('serious-promise')}
        />
        <StartingPointCard
          title="Look around first."
          subtitle="No commitments yet. Change your mind anytime."
          onSelect={() => onChoose('look-around')}
        />
      </div>
      <p className={styles.startingHint}>
        You can enable more areas later from Modules.
      </p>
    </section>
  );
}

function StartingPointCard({
  title,
  subtitle,
  onSelect,
}: {
  title: string;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.startingPointCard}
      onClick={onSelect}
    >
      <span className={styles.startingPointTitle}>{title}</span>
      <span className={styles.startingPointSubtitle}>{subtitle}</span>
    </button>
  );
}

export function SelfTrustLine({ result }: { result: SelfTrustResult }) {
  const suffix =
    result.daysScored === 0
      ? 'no days scored yet'
      : `${result.daysScored} day${result.daysScored === 1 ? '' : 's'} scored`;
  return (
    <section className={styles.selfTrust} aria-label="Self-Trust">
      <p className={styles.eyebrow}>Self-Trust</p>
      <p className={styles.selfTrustScore}>{result.score}</p>
      <p className={styles.selfTrustMeta}>{suffix}</p>
    </section>
  );
}

export function RememberSection({ principle }: { principle: Principle }) {
  return (
    <section className={styles.remember} aria-label="Remember">
      <p className={styles.eyebrow}>Remember</p>
      <p className={styles.rememberText}>{principle.text}</p>
    </section>
  );
}

export function RoutineStrip({
  blocks,
  completedBlockIds,
  onEditRoutine,
  onBlockTap,
}: {
  blocks: readonly RoutineBlock[];
  completedBlockIds: readonly string[];
  onEditRoutine: () => void;
  onBlockTap: ((blockId: string) => void) | undefined;
}) {
  const completedSet = new Set(completedBlockIds);
  const grouped = groupByAnchor(blocks);
  const anchorsWithBlocks = orderedAnchorsWithBlocks(blocks);
  return (
    <section className={styles.routine} aria-label="Routine">
      {anchorsWithBlocks.map((anchor) => (
        <div key={anchor} className={styles.anchorGroup}>
          <p className={styles.anchorGroupLabel}>{ANCHOR_LABELS[anchor]}</p>
          <ul className={styles.routineList}>
            {grouped[anchor].map((block) => {
              const done = completedSet.has(block.id);
              return (
                <li key={block.id} className={styles.routineListItem}>
                  <button
                    type="button"
                    className={styles.blockButton}
                    onClick={() => {
                      if (onBlockTap) onBlockTap(block.id);
                    }}
                    aria-pressed={done}
                    aria-label={`${done ? 'Uncomplete' : 'Complete'} ${block.name}`}
                  >
                    <span
                      aria-hidden="true"
                      className={done ? `${styles.glyph} ${styles.glyphDone}` : styles.glyph}
                    />
                    <span
                      className={done ? `${styles.blockLabel} ${styles.blockDone}` : styles.blockLabel}
                    >
                      {block.name}
                    </span>
                    <span className={styles.blockMeta}>
                      {block.durationMinutes} min · {block.type}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className={styles.editRoutineRow}>
        <button
          type="button"
          className={styles.textLink}
          onClick={onEditRoutine}
        >
          Edit routine.
        </button>
      </div>
    </section>
  );
}

export function RoutineEmptyStatePromo({
  onEditRoutine,
}: {
  onEditRoutine: () => void;
}) {
  return (
    <section className={styles.remember} aria-label="Routine">
      <p className={styles.eyebrow}>Routine</p>
      <p className={styles.rememberText}>You have no routine yet.</p>
      <button
        type="button"
        className={styles.textLink}
        onClick={onEditRoutine}
      >
        Add your first block.
      </button>
    </section>
  );
}

export function ReflectionInvitation({
  state,
  onReflect,
}: {
  state: ReflectionInvitationState;
  onReflect: () => void;
}) {
  if (state !== 'awaiting') return null;
  return (
    <div className={styles.reflectInvitation}>
      <button
        type="button"
        className={styles.reflectPrimary}
        onClick={onReflect}
      >
        Reflect.
      </button>
    </div>
  );
}
