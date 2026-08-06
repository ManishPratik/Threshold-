import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Declaration } from '@data/types/frozen/Declaration';
import type { Principle } from '@data/types/Principle';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import type { Routine, RoutineBlock } from '@data/types/frozen/Routine';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import {
  BlockCompletionService,
  CeremonialFade,
  DeclarationService,
  PromiseService,
  RoutineService,
} from '@features/frozen';
import { computeSelfTrust, type SelfTrustResult } from '@features/self-trust';
import {
  ANCHOR_LABELS,
  CurrentFocusCard,
  getTodayProgress,
  groupByAnchor,
  orderedAnchorsWithBlocks,
  ProgressSummary,
} from '@features/routine-engine';
import { TodayProgramWidgets } from '@features/programs';
import {
  DailyFlowSummary,
  InterventionQueue,
} from '@features/daily-flow-engine';
import {
  addDays,
  computeDayNumber,
  totalDaysBetween,
  type ISODate,
} from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import {
  selectReflectionState,
  type ReflectionInvitationState,
} from './reflectionState';
import styles from './FrozenTodayPage.module.css';

const noop = () => {};

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
export function FrozenTodayPage({
  onReflect,
  onPromiseAnchorTap,
  onEditRoutine,
  onExplore,
}: FrozenTodayPageProps = {}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [promise, setPromise] = useState<PromiseRecord | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [todayDeclaration, setTodayDeclaration] =
    useState<Declaration | null>(null);
  const [completedBlockIds, setCompletedBlockIds] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [today, setToday] = useState<ISODate>(currentLogicalDate());
  const [yesterdayVerdict, setYesterdayVerdict] = useState<
    'kept' | 'broken' | null
  >(null);
  const [selfTrust, setSelfTrust] = useState<SelfTrustResult | null>(null);
  // `undefined` = not yet loaded from AppState; `null` = onboarding not
  // yet completed (Home renders the onboarding state); string = user
  // has picked a Starting Point (Home renders operating state).
  const [startingPoint, setStartingPoint] = useState<string | null | undefined>(
    undefined,
  );

  // Load the chosen Starting Point on mount. Independent of the primary
  // data useEffect below so onboarding-state rendering does not have to
  // wait for the Promise/Routine reads (which return early when
  // `activePromise === null` anyway).
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
      if (sp === 'quit-addiction') {
        // Pre-enable Smoking so the post-Promise Home immediately shows
        // its ambient widget + interventions. Then flow into the
        // Promise-creation ritual as the natural continuation of
        // onboarding — the user is not "leaving" onboarding; they are
        // completing it.
        await repo.setEnabledProgramIds(['smoking']);
        navigate('/create-promise');
      } else if (sp === 'daily-routine') {
        navigate('/modules/routine');
      } else if (sp === 'serious-promise') {
        navigate('/create-promise');
      } else {
        // 'look-around' — stay on Home; the operating state renders the
        // module-agnostic empty-state prompt linking to /modules.
        setStartingPoint(sp);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your choice.');
    }
  };

  useEffect(() => {
    const promiseService = new PromiseService();
    const routineService = new RoutineService();
    const declarationService = new DeclarationService();
    const blockCompletionService = new BlockCompletionService();
    let cancelled = false;

    (async () => {
      try {
        const active = await promiseService.getActivePromise();
        if (cancelled) return;
        if (!active) {
          setPromise(null);
          setRoutine(null);
          setTodayDeclaration(null);
          setCompletedBlockIds([]);
          setSelfTrust(null);
          return;
        }
        const now = currentLogicalDate();
        setToday(now);
        const yesterday = addDays(now, -1);
        const yesterdayInsideArc = yesterday >= active.startDate;
        const [
          routineRecord,
          declaration,
          completions,
          yesterdayDecl,
          allDeclarations,
          allCompletions,
        ] = await Promise.all([
          routineService.getRoutine(active.id),
          declarationService.getTodayDeclaration(active.id, now),
          blockCompletionService.getCompletedBlocksForToday(active.id, now),
          yesterdayInsideArc
            ? declarationService.getDeclaration(active.id, yesterday)
            : Promise.resolve(null),
          declarationService.listDeclarationsForPromise(active.id),
          blockCompletionService.listForPromise(active.id),
        ]);
        if (cancelled) return;
        setPromise(active);
        setRoutine(routineRecord ?? null);
        setTodayDeclaration(declaration ?? null);
        setCompletedBlockIds(completions.map((c) => c.blockId));
        setYesterdayVerdict(yesterdayDecl?.verdict ?? null);
        setSelfTrust(
          computeSelfTrust({
            promise: active,
            routine: routineRecord ?? null,
            declarations: allDeclarations,
            blockCompletions: allCompletions,
            today: now,
          }),
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load Today.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBlockTap = async (blockId: string) => {
    if (!promise) return;
    const service = new BlockCompletionService();
    const declarationService = new DeclarationService();
    const isDone = completedBlockIds.includes(blockId);
    try {
      if (isDone) {
        await service.uncompleteBlock(promise.id, today, blockId);
        setCompletedBlockIds((prev) => prev.filter((id) => id !== blockId));
      } else {
        await service.completeBlock(promise.id, today, blockId);
        setCompletedBlockIds((prev) =>
          prev.includes(blockId) ? prev : [...prev, blockId],
        );
      }
      // Recompute Self-Trust after any block change so the full-day bonus
      // update is reflected immediately without waiting for a remount.
      const [allDeclarations, allCompletions] = await Promise.all([
        declarationService.listDeclarationsForPromise(promise.id),
        service.listForPromise(promise.id),
      ]);
      setSelfTrust(
        computeSelfTrust({
          promise,
          routine,
          declarations: allDeclarations,
          blockCompletions: allCompletions,
          today,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save block.');
    }
  };

  const currentHour = new Date().getHours();
  const reflectionState = selectReflectionState({
    currentHour,
    todayDeclaration,
  });

  const principle = promise?.principles?.[0];

  return (
    <div className={styles.column}>
      <Greeting />
      {loading || startingPoint === undefined ? (
        <p className={styles.loadingLine}>Loading Personal OS.</p>
      ) : startingPoint === null ? (
        <OnboardingSection
          onChoose={(sp) => {
            void handleChooseStartingPoint(sp);
          }}
        />
      ) : (
        <>
          {/* Layer 1 — Identity (always). Greeting is above. Anchor +
              Self-Trust complete the identity strip per the Daily
              Momentum composition. */}
          {promise ? (
            <PromiseAnchor
              promise={promise}
              today={today}
              yesterdayVerdict={yesterdayVerdict}
              onTap={onPromiseAnchorTap ?? noop}
            />
          ) : (
            <EmptyState onExplore={onExplore ?? noop} />
          )}
          {promise && selfTrust ? (
            <SelfTrustLine result={selfTrust} />
          ) : null}
          {/* Layer 2 — Hero (single conscious decision). Reflection
              takes the hero when the ritual window is open per line
              180-184. Otherwise the Intervention Queue occupies the
              first-below-identity position and self-nulls when nothing
              fires per InterventionQueue.tsx:128-130 — leaving the
              routine section visually next in line. */}
          <CeremonialFade visible={reflectionState === 'awaiting'}>
            <ReflectionInvitation
              state={reflectionState}
              onReflect={onReflect ?? noop}
            />
          </CeremonialFade>
          {promise ? <InterventionQueue promiseId={promise.id} /> : null}
          {/* Layer 3 — Supporting. Routine section (Current focus +
              progress + strip) or its empty-state promo, then ambient
              module widgets. */}
          {routine ? (
            (() => {
              const routineProgress = getTodayProgress(
                routine,
                completedBlockIds,
              );
              return (
                <>
                  <CurrentFocusCard progress={routineProgress} />
                  <ProgressSummary progress={routineProgress} />
                  <RoutineStrip
                    blocks={routine.blocks}
                    completedBlockIds={completedBlockIds}
                    onEditRoutine={onEditRoutine ?? noop}
                    onBlockTap={(id) => {
                      void handleBlockTap(id);
                    }}
                  />
                </>
              );
            })()
          ) : promise ? (
            <RoutineEmptyStatePromo onEditRoutine={onEditRoutine ?? noop} />
          ) : null}
          {promise ? <TodayProgramWidgets promiseId={promise.id} /> : null}
          {/* Layer 4 — Quiet. Aggregate engagement summary + principle
              reinforcement. */}
          {promise ? <DailyFlowSummary promiseId={promise.id} /> : null}
          {principle ? <RememberSection principle={principle} /> : null}
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

function PromiseAnchor({
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

function EmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <div className={styles.emptyBlock}>
      <p className={styles.emptyLine}>Personal OS is quiet today.</p>
      <button type="button" className={styles.textLink} onClick={onExplore}>
        Choose a module to begin.
      </button>
    </div>
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

function SelfTrustLine({ result }: { result: SelfTrustResult }) {
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

function RememberSection({ principle }: { principle: Principle }) {
  return (
    <section className={styles.remember} aria-label="Remember">
      <p className={styles.eyebrow}>Remember</p>
      <p className={styles.rememberText}>{principle.text}</p>
    </section>
  );
}

function RoutineStrip({
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

function RoutineEmptyStatePromo({
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

function ReflectionInvitation({
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
