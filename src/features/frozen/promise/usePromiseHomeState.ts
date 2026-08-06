import { useCallback, useEffect, useState } from 'react';
import type { Declaration } from '@data/types/frozen/Declaration';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import type { Routine } from '@data/types/frozen/Routine';
import {
  BlockCompletionService,
  DeclarationService,
  PromiseService,
  RoutineService,
} from '@features/frozen';
import { computeSelfTrust, type SelfTrustResult } from '@features/self-trust';
import { addDays, type ISODate } from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import {
  selectReflectionState,
  type ReflectionInvitationState,
} from '../../../routes/frozen/today/reflectionState';

/**
 * Slice E — Home multi-module composition.
 *
 * Promise-Home state hook. Extracted verbatim from FrozenTodayPage's
 * useEffect + handleBlockTap so the business logic exists exactly once
 * per Founder's constraint. Consumers: `PromiseHomeSurface` (the
 * Promise module's Home contribution).
 *
 * State: promise, routine, today's declaration, completed block ids,
 * yesterday's verdict, Self-Trust result. Handlers: `handleBlockTap`
 * (toggle a block; recomputes Self-Trust). Derived: `reflectionState`
 * from current hour + today's declaration.
 *
 * Behavioural equivalence to prior FrozenTodayPage code path: identical
 * fetch pattern (Promise.all over routine + declaration + completions +
 * yesterday declaration + all declarations + all completions);
 * identical BlockCompletionService toggle semantics; identical
 * computeSelfTrust argument set; identical reflection window.
 */
export interface PromiseHomeState {
  loading: boolean;
  promise: PromiseRecord | null;
  routine: Routine | null;
  todayDeclaration: Declaration | null;
  completedBlockIds: string[];
  today: ISODate;
  yesterdayVerdict: 'kept' | 'broken' | null;
  selfTrust: SelfTrustResult | null;
  error: string;
  reflectionState: ReflectionInvitationState;
  handleBlockTap: (blockId: string) => Promise<void>;
}

export function usePromiseHomeState(): PromiseHomeState {
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

  const handleBlockTap = useCallback(
    async (blockId: string) => {
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
    },
    [promise, routine, completedBlockIds, today],
  );

  const currentHour = new Date().getHours();
  const reflectionState = selectReflectionState({
    currentHour,
    todayDeclaration,
  });

  return {
    loading,
    promise,
    routine,
    todayDeclaration,
    completedBlockIds,
    today,
    yesterdayVerdict,
    selfTrust,
    error,
    reflectionState,
    handleBlockTap,
  };
}
