import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  dayLogRepository,
  missionRepository,
  promiseEventRepository,
  routineRepository,
} from '@data/repositories';
import type { Mission } from '@data/types/Mission';
import type { Routine, RoutineBlock } from '@data/types/Routine';
import type { DayLog } from '@data/types/DayLog';
import { generateId } from '@shared/lib/id';
import { nowIso } from '@shared/lib/date';
import { selfTrustService } from '@features/self-trust';
import { recoveryService } from '@features/recovery-mode';
import { focusReducer, type FocusState } from './focusState';
import { getTodayProgress, type TodayProgress } from './getCurrentBlock';

export interface RoutineTodayView {
  status: 'loading' | 'ready' | 'empty';
  mission: Mission | null;
  routine: Routine | null;
  dayLog: DayLog | null;
  progress: TodayProgress | null;
  focus: FocusState;
  /** Current Self-Trust score (latest snapshot's cumulative). Null while loading. */
  selfTrustScore: number | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  complete: () => Promise<void>;
  /** Reloads mission + routine + today's log from repositories. Resets focus to idle. */
  refresh: () => void;
  /** Locally replace the mission (e.g. after inline notes/reward edit) without a full refetch. */
  applyMissionUpdate: (mission: Mission) => void;
}

/**
 * Single source of truth for the Today screen. Loads the active Mission +
 * Routine, opens (or creates) today's DayLog, and exposes derived progress
 * plus the ephemeral focus state machine for the current block.
 *
 * Focus state is deliberately not persisted — refreshing mid-block resets to
 * idle (per "no timers, no background execution"). Only Complete produces a
 * persistent write (DayLog + PromiseEvent). Complete additionally recomputes
 * today's Self-Trust snapshot so the score in the header stays fresh without
 * a full page reload.
 */
export function useRoutineToday(): RoutineTodayView {
  const [mission, setMission] = useState<Mission | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [dayLog, setDayLog] = useState<DayLog | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading');
  const [selfTrustScore, setSelfTrustScore] = useState<number | null>(null);
  const [focus, dispatch] = useReducer(focusReducer, 'idle');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const activeMission = await missionRepository.getActive();
      if (!activeMission) {
        if (!cancelled) {
          setMission(null);
          setRoutine(null);
          setDayLog(null);
          setSelfTrustScore(0);
          setStatus('empty');
        }
        return;
      }
      const [routines, todaysLog, score] = await Promise.all([
        routineRepository.getByMission(activeMission.id),
        dayLogRepository.getOrCreateForToday(),
        selfTrustService.getCurrentScore(),
      ]);
      const activeRoutine = routines.find((r) => r.active) ?? null;

      // Recovery sweep — idempotent. Runs after getOrCreateForToday so today
      // exists to be marked. May update today's log to state='recovery' and
      // emit deferred events for yesterday's missed blocks.
      const recoveryUpdate = activeRoutine
        ? await recoveryService.ensureTodayRecoveryState()
        : null;
      const finalLog = recoveryUpdate ?? todaysLog;

      if (cancelled) return;
      setMission(activeMission);
      setRoutine(activeRoutine);
      setDayLog(finalLog);
      setSelfTrustScore(score);
      setStatus(activeRoutine ? 'ready' : 'empty');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const progress = routine && dayLog ? getTodayProgress(routine, dayLog) : null;
  const currentBlock: RoutineBlock | null = progress?.currentBlock ?? null;

  const start = useCallback(() => dispatch('START'), []);
  const pause = useCallback(() => dispatch('PAUSE'), []);
  const resume = useCallback(() => dispatch('RESUME'), []);

  const complete = useCallback(async () => {
    if (!dayLog || !currentBlock) return;
    const updated = await dayLogRepository.markBlockCompleted(dayLog.id, currentBlock.id);
    await promiseEventRepository.append({
      id: generateId(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      schemaVersion: 1,
      dayLogId: dayLog.id,
      kind: 'kept',
      source: 'manual',
      blockId: currentBlock.id,
      missionId: mission?.id ?? null,
      at: nowIso(),
      note: '',
    });
    const snap = await selfTrustService.recomputeTodaySnapshot();
    setDayLog(updated);
    if (snap) setSelfTrustScore(snap.score);
    dispatch('RESET');
  }, [dayLog, currentBlock, mission?.id]);

  const refresh = useCallback(() => {
    dispatch('RESET');
    setStatus('loading');
    setSelfTrustScore(null);
    setReloadKey((k) => k + 1);
  }, []);

  const applyMissionUpdate = useCallback((updated: Mission) => {
    setMission(updated);
  }, []);

  return {
    status,
    mission,
    routine,
    dayLog,
    progress,
    focus,
    selfTrustScore,
    start,
    pause,
    resume,
    complete,
    refresh,
    applyMissionUpdate,
  };
}
