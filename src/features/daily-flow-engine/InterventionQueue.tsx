import { useCallback, useEffect, useState } from 'react';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { getProgram } from '@features/programs';
import type {
  Intervention,
  InterventionContext,
  LifeProgram,
} from '@contract/program';
import { markAcked, readSeenTodayIds } from './ackLog';
import { readAggregateAckRate } from './analytics';
import { toDateKey } from './dateKey';
import { listInterventions } from './interventionQueueEngine';
import { resolvePhase } from './resolvePhase';
import {
  bumpQueueVersion,
  getQueueVersion,
  subscribeQueueVersion,
} from './queueVersion';
import { SurfaceErrorBoundary } from './SurfaceErrorBoundary';
import styles from './InterventionQueue.module.css';

export interface InterventionQueueProps {
  promiseId: string;
}

/**
 * Engine-owned intervention list rendered between Self-Trust and the
 * program-widget stack on Today. ADR 0009 §3, §4, §8. Phase 9 adds
 * per-card ACK/DISMISS wiring against the ack log at
 * personal-os/src/features/daily-flow-engine/ackLog.ts.
 *
 * Passive by design — no polling, no interval, no timer. Enabled
 * program ids and the seen-today set load once on mount from
 * personal-os/src/data/repositories/frozen/AppStateRepository.ts
 * `getEnabledProgramIds` (lines 91-94) and
 * `readSeenTodayIds` respectively. Every subsequent evaluation of
 * `listInterventions` runs synchronously during render; a subscription
 * to `subscribeQueueVersion` re-triggers the async loads when a
 * program (or the engine's own ACK path) bumps the version.
 *
 * Every rendered intervention wraps in `SurfaceErrorBoundary` per
 * ADR 0009 §3 "engine drops silently on program failure".
 *
 * When no enabled program declares any intervention that fires — or
 * every firing intervention is already in `seenToday` — the component
 * returns `null`. No wrapper element is emitted, no placeholder, no
 * empty state.
 */
export function InterventionQueue({ promiseId }: InterventionQueueProps) {
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

  const handleInteraction = useCallback(
    async (intervention: Intervention, kind: 'ack' | 'dismiss') => {
      const dateKey = toDateKey(Date.now());
      try {
        await markAcked(intervention.id, dateKey, kind);
      } finally {
        bumpQueueVersion();
      }
    },
    [],
  );

  if (enabledIds === null) return null;

  const programs: LifeProgram[] = [];
  for (const id of enabledIds) {
    const program = getProgram(id);
    if (program) programs.push(program);
  }

  const nowIso = new Date().toISOString();
  const context: InterventionContext = {
    promiseId,
    nowIso,
    phase: resolvePhase(nowIso),
    ackRate,
  };
  const allInterventions = listInterventions(programs, context);
  const interventions = allInterventions.filter((iv) => !seenToday.has(iv.id));
  if (interventions.length === 0) return null;


  return (
    <section className={styles.queue} aria-label="Interventions">
      {interventions.map((iv) => (
        <SurfaceErrorBoundary key={iv.id}>
          <InterventionCard
            intervention={iv}
            onDone={() => {
              void handleInteraction(iv, 'ack');
            }}
            onDismiss={() => {
              void handleInteraction(iv, 'dismiss');
            }}
          />
        </SurfaceErrorBoundary>
      ))}
    </section>
  );
}

function InterventionCard({
  intervention,
  onDone,
  onDismiss,
}: {
  intervention: Intervention;
  onDone: () => void;
  onDismiss: () => void;
}) {
  return (
    <article
      className={styles.card}
      aria-label={intervention.title}
      data-intervention-id={intervention.id}
      data-priority={intervention.priority}
    >
      <p className={styles.title}>{intervention.title}</p>
      {intervention.body ? (
        <p className={styles.body}>{intervention.body}</p>
      ) : null}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={onDone}
          aria-label={`Done — acknowledge ${intervention.title}`}
        >
          Done
        </button>
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label={`Dismiss ${intervention.title}`}
        >
          Dismiss
        </button>
      </div>
    </article>
  );
}
