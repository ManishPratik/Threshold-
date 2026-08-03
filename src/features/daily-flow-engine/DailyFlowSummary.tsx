import { useEffect, useMemo, useState } from 'react';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import {
  getProgram,
  type InterventionContext,
  type LifeProgram,
} from '@features/programs';
import { listInterventions } from './interventionQueue';
import { readSeenTodayIds } from './ackLog';
import { readAggregateAckRate } from './analytics';
import { toDateKey } from './dateKey';
import { resolvePhase } from './resolvePhase';
import {
  getQueueVersion,
  subscribeQueueVersion,
} from './queueVersion';
import { pickLine } from './dailyFlowSummaryCopy';
import styles from './DailyFlowSummary.module.css';

export interface DailyFlowSummaryProps {
  promiseId: string;
}

/**
 * One-line supportive feedback line rendered on Today between the
 * Self-Trust region and the Intervention Queue. ADR 0009 §3, §8.
 *
 * Passive by design — no polling, no interval. Enabled program ids
 * and today's seen-set load on mount and re-load on every
 * `subscribeQueueVersion` bump so a tap on Done or Dismiss inside
 * the InterventionQueue at
 * personal-os/src/features/daily-flow-engine/InterventionQueue.tsx
 * updates this line automatically.
 *
 * Visibility rules per the Phase 11 spec:
 *   - no enabled Life Program → hide
 *   - no intervention fired for the current phase → hide
 *   - no acks and no dismisses today AND no interventions firing → hide
 *
 * The component reuses `listInterventions` and `readSeenTodayIds`
 * from the engine — it does NOT duplicate any aggregation logic.
 */
export function DailyFlowSummary({ promiseId }: DailyFlowSummaryProps) {
  const [enabledIds, setEnabledIds] = useState<readonly string[] | null>(null);
  const [seenToday, setSeenToday] = useState<ReadonlySet<string>>(new Set());
  const [ackRate, setAckRate] = useState<number>(1);
  const [queueVersion, setQueueVersion] = useState<number>(() =>
    getQueueVersion(),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const repo = new AppStateRepository();
      const ids = await repo.getEnabledProgramIds();
      if (cancelled) return;
      setEnabledIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await readSeenTodayIds(toDateKey(Date.now()));
      if (cancelled) return;
      setSeenToday(seen);
    })();
    return () => {
      cancelled = true;
    };
  }, [queueVersion]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rate = await readAggregateAckRate();
      if (cancelled) return;
      setAckRate(rate);
    })();
    return () => {
      cancelled = true;
    };
  }, [queueVersion]);

  useEffect(() => {
    const unsubscribe = subscribeQueueVersion(() => {
      setQueueVersion(getQueueVersion());
    });
    return unsubscribe;
  }, []);

  const summary = useMemo(() => {
    if (enabledIds === null || enabledIds.length === 0) return null;
    const programs: LifeProgram[] = [];
    for (const id of enabledIds) {
      const program = getProgram(id);
      if (program) programs.push(program);
    }
    if (programs.length === 0) return null;

    const nowIso = new Date().toISOString();
    const context: InterventionContext = {
      promiseId,
      nowIso,
      phase: resolvePhase(nowIso),
      ackRate,
    };
    const allInterventions = listInterventions(programs, context);
    const firing = allInterventions.map((iv) => iv.id);
    const seenFromFiring = firing.filter((id) => seenToday.has(id)).length;
    const total = firing.length;

    if (total === 0 && seenFromFiring === 0) return null;
    return { total, seen: seenFromFiring };
  }, [enabledIds, seenToday, promiseId, ackRate]);

  if (summary === null) return null;
  const { total, seen } = summary;
  const line = pickLine(seen, total);
  if (line === null) return null;
  return (
    <p className={styles.line} aria-label="Daily Flow Summary">
      {line}
    </p>
  );
}

