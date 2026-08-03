import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import { UpdatePrompt } from '@/pwa/UpdatePrompt';
import { useServiceWorkerUpdate } from '@/pwa/useServiceWorkerUpdate';
// Register every Life Program manifest at boot. The import is a
// side-effect module so it must appear before any code that reads
// the program registry.
import '@/programs/register';
import {
  FROZEN_BOOT_LOADING_THRESHOLD_MS,
  bootstrapFrozen,
  type FrozenBootData,
} from './boot';
import { selectInitialRoute } from './firstLaunch';
import { frozenRouter } from './router';
import { FrozenModalRoot } from './FrozenModalRoot';

type ShellState =
  | { status: 'loading'; slow: boolean }
  | { status: 'ready'; boot: FrozenBootData }
  | { status: 'error'; message: string };

/**
 * Frozen-architecture app shell. Awaits `bootstrapFrozen`, respects the
 * `FROZEN_BOOT_LOADING_THRESHOLD_MS` threshold before rendering a plain
 * "Loading…" line, calls `selectInitialRoute` to route new-user boots
 * to promise-creation, and mounts `<RouterProvider>` + `<FrozenModalRoot>`
 * inside the existing legacy `ErrorBoundary`.
 *
 * The initial-route navigation runs synchronously against `frozenRouter`
 * before the shell transitions to the `ready` state so `RouterProvider`
 * mounts at the correct URL without a placeholder flash.
 */
export function FrozenAppShell() {
  const [state, setState] = useState<ShellState>({
    status: 'loading',
    slow: false,
  });
  // Registers the vite-plugin-pwa service worker (registerType: 'prompt',
  // injectRegister: false in vite.config). Mounts the update-detection
  // lifecycle for the app's lifetime and surfaces a bottom-of-screen
  // prompt when a new worker is waiting.
  const sw = useServiceWorkerUpdate();

  useEffect(() => {
    let cancelled = false;
    const slowTimer = window.setTimeout(() => {
      if (cancelled) return;
      setState((prev) =>
        prev.status === 'loading' ? { status: 'loading', slow: true } : prev,
      );
    }, FROZEN_BOOT_LOADING_THRESHOLD_MS);

    (async () => {
      try {
        const boot = await bootstrapFrozen();
        if (cancelled) return;
        const initial = selectInitialRoute(boot);
        if (initial === 'create-promise') {
          await frozenRouter.navigate('/create-promise');
        }
        if (cancelled) return;
        setState({ status: 'ready', boot });
      } catch (err) {
        if (cancelled) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Boot failed.',
        });
      } finally {
        window.clearTimeout(slowTimer);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
    };
  }, []);

  if (state.status === 'loading') {
    return state.slow ? <p>Loading…</p> : null;
  }

  if (state.status === 'error') {
    return (
      <ErrorBoundary>
        <p role="alert">Boot failed: {state.message}</p>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <RouterProvider router={frozenRouter} />
      <FrozenModalRoot />
      <UpdatePrompt
        visible={sw.visible}
        updating={sw.updating}
        onUpdate={sw.update}
        onDismiss={sw.dismiss}
      />
    </ErrorBoundary>
  );
}
