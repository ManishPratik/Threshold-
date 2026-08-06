import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { ISODate } from '@shared/lib/date';
import { currentLogicalDate } from '@shared/lib/dayBoundary';
import { DeclarationService, PromiseService } from '@features/frozen';
import { FrozenTodayPage } from '@routes/frozen/today';
import { FrozenChainPage } from '@routes/frozen/chain';
import { FrozenPromiseDetailPage } from '@routes/frozen/promise';
import { FrozenRoutinePage } from '@routes/frozen/routine';
import { FrozenHistoryPage } from '@routes/frozen/history';
import { FrozenSettingsPage } from '@routes/frozen/settings';
import { FrozenCreatePromisePage } from '@routes/frozen/create-promise';
import { FrozenDailyFlowAnalyticsPage } from '@routes/frozen/daily-flow-analytics';
import {
  FrozenModulesPage,
  FrozenSmokingModuleDetailPage,
} from '@routes/frozen/modules';
import {
  EVENING_REFLECTION_HOUR,
  LOGICAL_DAY_BOUNDARY_HOUR,
} from '@routes/frozen/today';
import { openModal } from './modalState';
import type {
  ReflectionModalPayload,
} from './FrozenModalRoot';

/**
 * Maximum number of pending Reflection modals surfaced to a returning
 * user. Longer absences are truncated to the most-recent N days,
 * preserving oldest-first ordering within the kept slice.
 */
const MAX_REFLECTION_BACKFILL = 7;

type ActivePromiseState =
  | { status: 'loading' }
  | { status: 'ready'; id: string | null };

function useActivePromiseId(): ActivePromiseState {
  const [state, setState] = useState<ActivePromiseState>({ status: 'loading' });
  useEffect(() => {
    const service = new PromiseService();
    let cancelled = false;
    (async () => {
      const active = await service.getActivePromise();
      if (cancelled) return;
      setState({ status: 'ready', id: active?.id ?? null });
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

export function TodayRouteAdapter() {
  const navigate = useNavigate();

  // On mount, kick off the backfill scan for the active Promise. If any
  // missed days exist, open Reflection for the oldest and thread the
  // remainder onto the modal payload so `FrozenModalRoot` walks the
  // queue oldest-first (Engineering Foundations §8 + Blocker
  // Resolutions §6).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const promiseService = new PromiseService();
      const declarationService = new DeclarationService();
      const active = await promiseService.getActivePromise();
      if (!active || cancelled) return;
      const today = currentLogicalDate();
      const missing = await declarationService.backfillMissingDaysOldestFirst(
        active.id,
        today,
      );
      if (cancelled || missing.length === 0) return;
      // Hard cap at MAX_REFLECTION_BACKFILL to protect returning users
      // from an overwhelming modal queue. Keep the most-recent N by
      // slicing the tail; ordering (oldest-first within the kept set)
      // is preserved.
      const capped =
        missing.length > MAX_REFLECTION_BACKFILL
          ? missing.slice(missing.length - MAX_REFLECTION_BACKFILL)
          : missing;
      const first = capped[0];
      if (first === undefined) return;
      const rest = capped.slice(1);
      const payload: ReflectionModalPayload = {
        variant: 'question',
        promise: active,
        date: first,
        backfillQueue: rest,
      };
      openModal('reflection', payload);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FrozenTodayPage
      onReflect={async () => {
        const service = new PromiseService();
        const promise = await service.getActivePromise();
        if (!promise) return;
        const date = currentLogicalDate();
        const decl = await new DeclarationService().getTodayDeclaration(
          promise.id,
          date,
        );
        const payload: ReflectionModalPayload = decl
          ? {
              variant: 'read-only',
              promise,
              date,
              existingDeclaration: decl,
            }
          : { variant: 'question', promise, date };
        openModal('reflection', payload);
      }}
      onPromiseAnchorTap={async () => {
        const service = new PromiseService();
        const promise = await service.getActivePromise();
        if (promise) navigate(`/promise/${promise.id}`);
      }}
      onEditRoutine={() => navigate('/routine')}
      onExplore={() => navigate('/modules')}
    />
  );
}

function ChainOfPromiseInner({ promiseId }: { promiseId: string }) {
  const navigate = useNavigate();
  return (
    <FrozenChainPage
      promiseId={promiseId}
      onDayTap={async (date: ISODate) => {
        const promiseService = new PromiseService();
        const declarationService = new DeclarationService();
        const promise = await promiseService.getPromiseById(promiseId);
        if (!promise) return;
        const today = currentLogicalDate();
        const decl = await declarationService.getDeclaration(promiseId, date);

        // Today-cell handling per the frozen Chain spec:
        //   declared → read-only Reflection
        //   post-cutoff undeclared → Reflection Question
        //   pre-cutoff undeclared → Today
        // Past-day and future-day handling: past → read-only Reflection,
        // future rows are already disabled in FrozenChainPage.
        if (date === today) {
          if (decl) {
            const payload: ReflectionModalPayload = {
              variant: 'read-only',
              promise,
              date,
              existingDeclaration: decl,
            };
            openModal('reflection', payload);
            return;
          }
          const hour = new Date().getHours();
          const inRitualWindow =
            hour >= EVENING_REFLECTION_HOUR ||
            hour < LOGICAL_DAY_BOUNDARY_HOUR;
          if (inRitualWindow) {
            const payload: ReflectionModalPayload = {
              variant: 'question',
              promise,
              date,
            };
            openModal('reflection', payload);
            return;
          }
          navigate('/today');
          return;
        }

        const payload: ReflectionModalPayload = {
          variant: 'read-only',
          promise,
          date,
          existingDeclaration: decl ?? null,
        };
        openModal('reflection', payload);
      }}
    />
  );
}

export function ChainRouteAdapter() {
  const active = useActivePromiseId();
  if (active.status === 'loading') return <p>Loading…</p>;
  if (active.id === null) return <Navigate to="/create-promise" replace />;
  return <ChainOfPromiseInner promiseId={active.id} />;
}

export function PromiseChainRouteAdapter() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  if (id.length === 0) return <Navigate to="/history" replace />;
  return <ChainOfPromiseInner promiseId={id} />;
}

export function PromiseDetailRouteAdapter() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  if (id.length === 0) return <Navigate to="/history" replace />;
  return (
    <FrozenPromiseDetailPage
      promiseId={id}
      onBroken={() => navigate('/today')}
      onReturn={() => navigate('/history')}
    />
  );
}

export function RoutineRouteAdapter() {
  const navigate = useNavigate();
  const active = useActivePromiseId();
  if (active.status === 'loading') return <p>Loading…</p>;
  if (active.id === null) return <Navigate to="/create-promise" replace />;
  return (
    <FrozenRoutinePage
      promiseId={active.id}
      onRoutineDeleted={() => navigate('/today')}
    />
  );
}

export function HistoryRouteAdapter() {
  const navigate = useNavigate();
  return (
    <FrozenHistoryPage
      onPromiseTap={(promiseId) => navigate(`/promise/${promiseId}`)}
    />
  );
}

export function SettingsRouteAdapter() {
  const navigate = useNavigate();
  return (
    <FrozenSettingsPage
      onErased={() => {
        // Full reload so `FrozenAppShell` re-boots and
        // `selectInitialRoute` returns the user to the promise-creation
        // flow per the frozen first-launch behaviour. Navigating in-app
        // would leave `/today` mounted with stale state and skip the
        // routing decision.
        window.location.reload();
      }}
      onOpenDailyFlowAnalytics={() => navigate('/settings/daily-flow')}
    />
  );
}

export function DailyFlowAnalyticsRouteAdapter() {
  return <FrozenDailyFlowAnalyticsPage />;
}

export function CreatePromiseRouteAdapter() {
  const navigate = useNavigate();
  return (
    <FrozenCreatePromisePage
      onCreated={() => navigate('/today')}
      onCancel={() => navigate('/today')}
    />
  );
}

export function ModulesRouteAdapter() {
  const navigate = useNavigate();
  return (
    <FrozenModulesPage
      onOpenModule={(id) => navigate(`/modules/${id}`)}
    />
  );
}

export function ModulesSmokingRouteAdapter() {
  const navigate = useNavigate();
  return (
    <FrozenSmokingModuleDetailPage onBack={() => navigate('/modules')} />
  );
}

/**
 * Frozen 404 surface. FrozenAppLayout mounts the NavBar so this body
 * carries only the factual line and a link back to Today. Editorial
 * styling arrives with the Settings + 404 batch.
 */
export function NotFoundRouteAdapter() {
  const navigate = useNavigate();
  return (
    <div style={{
      maxWidth: 'var(--content-column-max)',
      margin: '0 auto',
      padding: 'var(--space-xxl) var(--content-column-padding) var(--space-xl)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-l)',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'var(--type-display-reading-size)',
        lineHeight: 'var(--type-display-reading-lh)',
        color: 'var(--ink-primary)',
        margin: 0,
        fontWeight: 'var(--fw-regular)',
      }}>
        That page isn&apos;t here.
      </h1>
      <p style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--type-meta-body-size)',
        color: 'var(--ink-muted)',
        margin: 0,
      }}>
        The address doesn&apos;t match a page in Personal OS.
      </p>
      <button
        type="button"
        onClick={() => navigate('/today')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--type-label-size)',
          fontWeight: 'var(--type-label-weight)',
          cursor: 'pointer',
          padding: 'var(--space-s) var(--space-m)',
        }}
      >
        Return to Today.
      </button>
    </div>
  );
}
