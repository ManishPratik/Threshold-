import { createHashRouter } from 'react-router-dom';
import { FrozenAppLayout } from './FrozenAppLayout';
import {
  ChainRouteAdapter,
  CreatePromiseRouteAdapter,
  DailyFlowAnalyticsRouteAdapter,
  HistoryRouteAdapter,
  NotFoundRouteAdapter,
  PromiseChainRouteAdapter,
  PromiseDetailRouteAdapter,
  RoutineRouteAdapter,
  SettingsRouteAdapter,
  TodayRouteAdapter,
} from './adapters';

/**
 * Frozen-architecture router. Hash-based routing per Engineering
 * Foundations §4. Every route element is a route-adapter component from
 * `./adapters` — the adapters read `useParams()` / `useNavigate()` and
 * project router state into the props expected by the frozen screens.
 *
 * A layout route wraps every child so the NavBar mounts consistently
 * on every surface (hidden only during the focused Create-Promise flow).
 *
 * Modals (Reflection, Completion, Recovery, Witness, and every dialog)
 * are driven by the modal-state manager and rendered by `FrozenModalRoot`
 * per Engineering Foundations §5 — they do not appear as routes here.
 */
export const frozenRouter = createHashRouter([
  {
    element: <FrozenAppLayout />,
    children: [
      { path: '/', element: <TodayRouteAdapter /> },
      { path: '/today', element: <TodayRouteAdapter /> },
      { path: '/chain', element: <ChainRouteAdapter /> },
      { path: '/history', element: <HistoryRouteAdapter /> },
      { path: '/settings', element: <SettingsRouteAdapter /> },
      {
        path: '/settings/daily-flow',
        element: <DailyFlowAnalyticsRouteAdapter />,
      },
      { path: '/promise/:id', element: <PromiseDetailRouteAdapter /> },
      { path: '/promise/:id/chain', element: <PromiseChainRouteAdapter /> },
      { path: '/routine', element: <RoutineRouteAdapter /> },
      { path: '/create-promise', element: <CreatePromiseRouteAdapter /> },
      { path: '*', element: <NotFoundRouteAdapter /> },
    ],
  },
]);
