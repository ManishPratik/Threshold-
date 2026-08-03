import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { bumpQueueVersion } from '@features/daily-flow-engine';
import { DeclarationService, PromiseService } from '@features/frozen';
import { readQuitAt } from './state';

/**
 * Program-scoped sync context for the Smoking interventions. Populated
 * asynchronously (kicked off at manifest import time and again on
 * every `shouldFire` cache-miss). Once populated, `shouldFire` can
 * inspect the fields synchronously — the ADR-0009 `Intervention`
 * contract at personal-os/src/features/programs/types.ts:91 keeps
 * `shouldFire` synchronous.
 */
export interface SmokingContext {
  /** Milliseconds-since-epoch quit stamp from
   *  personal-os/src/programs/smoking/state.ts:97-103 `readQuitAt`,
   *  or `null` when the user has not stamped a quit moment yet. */
  quitAt: number | null;
  /** ISO date (YYYY-MM-DD) of the active Promise's start date, or
   *  `null` when no Promise is active. Used to derive day number. */
  promiseStartDate: string | null;
  /** Id of the current promise per
   *  personal-os/src/data/repositories/frozen/AppStateRepository.ts:20-23
   *  `get`. `null` when unset. */
  currentPromiseId: string | null;
  /** True when the user has already declared today (kept or broken).
   *  Read via personal-os/src/features/frozen/declaration/DeclarationService.ts:70
   *  `getTodayDeclaration`. Drives the night intervention's suppress
   *  rule per the Phase 8 spec. */
  todayReflectionDeclared: boolean;
  /** Local-time YYYY-MM-DD snapshot taken at load. */
  todayKey: string;
}

let cache: SmokingContext | null = null;
let inflight: Promise<SmokingContext | null> | null = null;

function todayLocalKey(nowMs: number = Date.now()): string {
  const d = new Date(nowMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Synchronous snapshot of the cached context. Returns `null` when the
 * cache has not been populated yet — interventions treat this as
 * "not ready, do not fire" per the safe-default rule from ADR 0009 §3.
 */
export function getSmokingContextSync(): SmokingContext | null {
  return cache;
}

/**
 * Reset the cache. Used when the user disables/enables Smoking or
 * switches promises so the next Today mount refetches state.
 * Idempotent — safe to call repeatedly.
 */
export function invalidateSmokingContext(): void {
  cache = null;
  inflight = null;
  bumpQueueVersion();
}

/**
 * Populate the cache from IDB. Idempotent — repeated calls dedupe
 * onto the same in-flight promise. Errors are swallowed and leave
 * the cache at `null`; the intervention shouldFire returns false on
 * cache-miss and the queue renders nothing, matching Phase 7's
 * "empty queue emits zero DOM" contract at
 * personal-os/src/features/daily-flow-engine/InterventionQueue.tsx:67.
 */
export async function preloadSmokingContext(): Promise<SmokingContext | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const app = await new AppStateRepository().get();
      const currentPromiseId = app?.currentPromiseId ?? null;
      const activePromise = currentPromiseId
        ? await new PromiseService().getActivePromise()
        : null;
      const quitAt = await readQuitAt();
      const todayKey = todayLocalKey();
      let todayReflectionDeclared = false;
      if (currentPromiseId) {
        const decl = await new DeclarationService().getTodayDeclaration(
          currentPromiseId,
          todayKey,
        );
        todayReflectionDeclared = decl !== undefined;
      }
      cache = {
        quitAt,
        promiseStartDate: activePromise?.startDate ?? null,
        currentPromiseId,
        todayReflectionDeclared,
        todayKey,
      };
      // Notify any mounted InterventionQueue so it re-evaluates
      // shouldFire against the fresh cache. Program-agnostic bump —
      // engine does not learn Smoking's schema.
      bumpQueueVersion();
      return cache;
    } catch {
      // Cache stays null. shouldFire returns false. Queue stays empty.
      return null;
    }
  })();
  return inflight;
}

/**
 * Compute the 1-indexed day number since `promiseStartDate` given the
 * context's `todayKey`. Returns `null` when either input is missing.
 * Pure. Day 1 = start day. Uses UTC math on the date-only strings so
 * DST boundaries do not shift the count.
 */
export function computeDayNumber(context: SmokingContext): number | null {
  if (!context.promiseStartDate) return null;
  const start = context.promiseStartDate;
  const today = context.todayKey;
  const toUtcDays = (iso: string): number => {
    const y = Number(iso.slice(0, 4));
    const m = Number(iso.slice(5, 7));
    const d = Number(iso.slice(8, 10));
    return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  };
  return toUtcDays(today) - toUtcDays(start) + 1;
}

/** Convenience: hours between quitAt and nowMs. Non-negative. Returns
 *  `null` when no quit-at is recorded. */
export function computeCleanHours(
  context: SmokingContext,
  nowMs: number = Date.now(),
): number | null {
  if (context.quitAt === null) return null;
  return Math.max(0, (nowMs - context.quitAt) / 3_600_000);
}
