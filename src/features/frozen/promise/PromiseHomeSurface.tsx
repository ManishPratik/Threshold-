import { useNavigate } from 'react-router-dom';
import type { HomeSurfaceProps } from '@contract/program';
import { CeremonialFade, DeclarationService } from '@features/frozen';
import {
  CurrentFocusCard,
  getTodayProgress,
  ProgressSummary,
} from '@features/routine-engine';
import { openModal } from '../../../app/frozen/modalState';
import type { ReflectionModalPayload } from '../../../app/frozen/FrozenModalRoot';
import {
  PromiseAnchor,
  ReflectionInvitation,
  RememberSection,
  RoutineEmptyStatePromo,
  RoutineStrip,
  SelfTrustLine,
} from '../../../routes/frozen/today/FrozenTodayPage';
import { usePromiseHomeState } from './usePromiseHomeState';

/**
 * Slice E — Home multi-module composition.
 *
 * The Promise module's contribution to Home. Thin orchestration
 * adapter per Founder ruling: contains no business logic, no JSX
 * duplication, no hook duplication, no helper duplication. Uses:
 *
 * - `usePromiseHomeState` (single implementation of the Promise-Home
 *   state + fetches + Self-Trust computation + block-toggle handler)
 * - The six sub-components exported from `FrozenTodayPage.tsx`
 *   (`PromiseAnchor`, `SelfTrustLine`, `ReflectionInvitation`,
 *   `RoutineStrip`, `RoutineEmptyStatePromo`, `RememberSection`) which
 *   are the single source of truth for their respective UI.
 * - `CurrentFocusCard`, `ProgressSummary`, `getTodayProgress` from
 *   `@features/routine-engine` (same as `FrozenTodayPage` previously
 *   consumed).
 *
 * Registered as a `layer: 'identity'` HomeSurface via
 * `src/features/frozen/promise/promiseModule.ts`. Home iterates
 * `listHomeSurfaces()` and renders every enabled module's contributed
 * surfaces without knowing that this surface belongs to Promise.
 *
 * Self-nulls when no active Promise (module-independence: the
 * platform does not render a Promise-specific fallback prompt; an
 * empty identity layer is a valid state).
 */
export function PromiseHomeSurface(_props: HomeSurfaceProps) {
  const state = usePromiseHomeState();
  const navigate = useNavigate();

  if (state.loading) return null;
  if (!state.promise) return null;

  const promise = state.promise;
  const today = state.today;

  const handleReflect = async () => {
    const decl = await new DeclarationService().getTodayDeclaration(
      promise.id,
      today,
    );
    const payload: ReflectionModalPayload = decl
      ? {
          variant: 'read-only',
          promise,
          date: today,
          existingDeclaration: decl,
        }
      : { variant: 'question', promise, date: today };
    openModal('reflection', payload);
  };

  const handlePromiseAnchorTap = () => {
    navigate(`/promise/${promise.id}`);
  };

  const handleEditRoutine = () => {
    navigate('/routine');
  };

  const principle = promise.principles?.[0];

  return (
    <>
      <PromiseAnchor
        promise={promise}
        today={today}
        yesterdayVerdict={state.yesterdayVerdict}
        onTap={handlePromiseAnchorTap}
      />
      {state.selfTrust ? <SelfTrustLine result={state.selfTrust} /> : null}
      <CeremonialFade visible={state.reflectionState === 'awaiting'}>
        <ReflectionInvitation
          state={state.reflectionState}
          onReflect={handleReflect}
        />
      </CeremonialFade>
      {state.routine ? (
        (() => {
          const routineProgress = getTodayProgress(
            state.routine,
            state.completedBlockIds,
          );
          return (
            <>
              <CurrentFocusCard progress={routineProgress} />
              <ProgressSummary progress={routineProgress} />
              <RoutineStrip
                blocks={state.routine.blocks}
                completedBlockIds={state.completedBlockIds}
                onEditRoutine={handleEditRoutine}
                onBlockTap={(id) => {
                  void state.handleBlockTap(id);
                }}
              />
            </>
          );
        })()
      ) : (
        <RoutineEmptyStatePromo onEditRoutine={handleEditRoutine} />
      )}
      {principle ? <RememberSection principle={principle} /> : null}
    </>
  );
}
