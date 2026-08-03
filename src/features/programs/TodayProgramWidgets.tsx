import { useEffect, useState } from 'react';
import { AppStateRepository } from '@data/repositories/frozen/AppStateRepository';
import { getProgram } from './registry';

export interface TodayProgramWidgetsProps {
  promiseId: string;
}

/**
 * Renders the Today widget of every enabled Life Program, in the
 * order stored on AppState. When no programs are enabled (the default
 * state per personal-os/src/data/repositories/frozen/AppStateRepository.ts
 * `getEnabledProgramIds` — returns `[]` when the field is absent), this
 * component renders nothing and Today behaves exactly as before the
 * program runtime landed.
 *
 * The enabled-ids list is loaded once on mount. Toggling a program in
 * Settings requires a re-mount of Today (navigation or reload) to
 * apply. Live sync is deferred to keep this slice minimal.
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

  return (
    <>
      {enabledIds.map((id) => {
        const program = getProgram(id);
        if (!program || !program.todayWidget) return null;
        const Widget = program.todayWidget;
        return <Widget key={id} promiseId={promiseId} />;
      })}
    </>
  );
}
