import type { BlockCompletion } from '@data/types/frozen/BlockCompletion';
import type { Declaration } from '@data/types/frozen/Declaration';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import type { Routine } from '@data/types/frozen/Routine';
import type { ISODate } from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import {
  BlockCompletionService,
  DeclarationService,
  PromiseService,
  RoutineService,
} from '@features/frozen';

/**
 * Threshold above which the app root renders a plain "Loading…" line
 * per Engineering Foundations §6. Boot faster than this and the user
 * sees the shell only.
 */
export const FROZEN_BOOT_LOADING_THRESHOLD_MS = 400;

/** Shape returned by `bootstrapFrozen`. Everything the mounted app needs
 *  to render the first frame is here — the caller may still fetch
 *  additional data (History, past-Promise Chain) on route entry. */
export interface FrozenBootData {
  today: ISODate;
  activePromise: PromiseRecord | null;
  todayDeclaration: Declaration | null;
  todayCompletions: BlockCompletion[];
  routine: Routine | null;
}

/**
 * Frozen boot sequence per Engineering Foundations §6.
 *
 * 1. Resolve today's logical date via the 04:00 boundary rule.
 * 2. Ask PromiseService for the active Promise — the service reads the
 *    AppState pointer internally, so AppState never needs to be touched
 *    from here.
 * 3. When a Promise is active, load its routine, today's declaration,
 *    and today's block completions in parallel.
 *
 * No splash, no spinner. The caller renders a "Loading…" line only when
 * this call exceeds `FROZEN_BOOT_LOADING_THRESHOLD_MS`.
 */
export async function bootstrapFrozen(): Promise<FrozenBootData> {
  const today = currentLogicalDate();

  const promiseService = new PromiseService();
  const active = (await promiseService.getActivePromise()) ?? null;

  if (active === null) {
    return {
      today,
      activePromise: null,
      todayDeclaration: null,
      todayCompletions: [],
      routine: null,
    };
  }

  const declarationService = new DeclarationService();
  const blockCompletionService = new BlockCompletionService();
  const routineService = new RoutineService();

  const [declaration, completions, routine] = await Promise.all([
    declarationService.getTodayDeclaration(active.id, today),
    blockCompletionService.getCompletedBlocksForToday(active.id, today),
    routineService.getRoutine(active.id),
  ]);

  return {
    today,
    activePromise: active,
    todayDeclaration: declaration ?? null,
    todayCompletions: completions,
    routine: routine ?? null,
  };
}
