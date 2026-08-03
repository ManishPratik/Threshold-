import { useEffect, useState } from 'react';
import type { Declaration } from '@data/types/frozen/Declaration';
import type { Principle } from '@data/types/Principle';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import type { Routine, RoutineBlock } from '@data/types/frozen/Routine';
import {
  BlockCompletionService,
  CeremonialFade,
  DeclarationService,
  PromiseService,
  RoutineService,
} from '@features/frozen';
import { computeSelfTrust, type SelfTrustResult } from '@features/self-trust';
import {
  CurrentFocusCard,
  getTodayProgress,
  ProgressSummary,
} from '@features/routine-engine';
import { TodayProgramWidgets } from '@features/programs';
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
  /** Fired when the empty-state "Make one." text link is tapped. Default: noop. */
  onCreatePromise?: () => void;
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
  onCreatePromise,
}: FrozenTodayPageProps = {}) {
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
      {loading ? (
        <p className={styles.loadingLine}>Loading Personal OS.</p>
      ) : (
        <>
          {promise ? (
            <PromiseAnchor
              promise={promise}
              today={today}
              yesterdayVerdict={yesterdayVerdict}
              onTap={onPromiseAnchorTap ?? noop}
            />
          ) : (
            <EmptyState onCreate={onCreatePromise ?? noop} />
          )}
          {promise && selfTrust ? (
            <SelfTrustLine result={selfTrust} />
          ) : null}
          {promise ? <TodayProgramWidgets promiseId={promise.id} /> : null}
          {principle ? <RememberSection principle={principle} /> : null}
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
          ) : null}
          <CeremonialFade visible={reflectionState === 'awaiting'}>
            <ReflectionInvitation
              state={reflectionState}
              onReflect={onReflect ?? noop}
            />
          </CeremonialFade>
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className={styles.emptyBlock}>
      <p className={styles.emptyLine}>You haven&apos;t made a promise yet.</p>
      <button type="button" className={styles.textLink} onClick={onCreate}>
        Make one.
      </button>
    </div>
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
  return (
    <section className={styles.routine} aria-label="Routine">
      <ul className={styles.routineList}>
        {blocks.map((block) => {
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
