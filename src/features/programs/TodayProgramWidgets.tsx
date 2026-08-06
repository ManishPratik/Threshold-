import { useEffect, useState } from 'react';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { listSurfaces, SurfaceErrorBoundary } from '@features/daily-flow-engine';
import { getProgram } from './registry';
import type { LifeProgram } from '@contract/program';

export interface TodayProgramWidgetsProps {
  promiseId: string;
}

/**
 * Renders the ambient-slot surface of every enabled Life Program, in
 * the order stored on AppState. Routing goes through the Daily Flow
 * Engine per ADR 0009 §3, §5 (ambient = unbounded vertical stack).
 *
 * Legacy `todayWidget` programs surface through the alias defined in
 * personal-os/src/features/programs/registry.ts lines 46-59 —
 * `getProgramSurfaces` exposes one ambient entry per legacy program
 * so Smoking (registered at
 * personal-os/src/programs/smoking/manifest.ts lines 4-11) requires
 * zero code changes.
 *
 * Every surface is wrapped in `SurfaceErrorBoundary`. A program whose
 * ambient component throws collapses to `null`; every other program
 * continues rendering; Today never crashes.
 *
 * Hero and overlay slots are not yet activated by this integration
 * slice. The intervention queue is not yet wired.
 */
export function TodayProgramWidgets({ promiseId }: TodayProgramWidgetsProps) {
  const [enabledIds, setEnabledIds] = useState<readonly string[] | null>(null);

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

  if (enabledIds === null || enabledIds.length === 0) return null;

  const programs: LifeProgram[] = [];
  for (const id of enabledIds) {
    const program = getProgram(id);
    if (program) programs.push(program);
  }
  if (programs.length === 0) return null;

  return (
    <>
      {programs.map((program) => {
        const ambient = listSurfaces([program], 'ambient');
        return ambient.map((surface, idx) => {
          const Surface = surface.component;
          return (
            <SurfaceErrorBoundary key={`${program.id}-${idx}`}>
              <Surface promiseId={promiseId} />
            </SurfaceErrorBoundary>
          );
        });
      })}
    </>
  );
}
