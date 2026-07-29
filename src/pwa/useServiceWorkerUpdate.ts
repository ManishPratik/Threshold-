import { useCallback, useEffect, useReducer, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import {
  initialUpdateState,
  shouldShowUpdatePrompt,
  updateReducer,
} from './updateState';

/**
 * Wires the vite-plugin-pwa update lifecycle into React state. Mounted from
 * AppLayout so a single instance runs for the app's lifetime.
 *
 * Rules of engagement match ADR 0005: registerType is 'prompt', so silent
 * reloads never happen. The user always sees the prompt and clicks Update to
 * activate the waiting worker.
 */
export function useServiceWorkerUpdate() {
  const [state, dispatch] = useReducer(updateReducer, initialUpdateState);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateSW = registerSW({
      onNeedRefresh() {
        dispatch('DETECTED');
      },
      onOfflineReady() {
        console.info('[pwa] App is ready to work offline.');
      },
      onRegisterError(error) {
        console.error('[pwa] SW registration failed:', error);
      },
    });
    updateSWRef.current = updateSW;
    // No cleanup — service worker registration lives for the app lifetime.
  }, []);

  const update = useCallback(() => {
    dispatch('UPDATE_STARTED');
    void (async () => {
      try {
        await updateSWRef.current?.(true);
        // reloadPage=true triggers a full reload inside vite-plugin-pwa
        // once the waiting worker takes control; execution rarely returns here.
      } catch (e) {
        console.error('[pwa] update failed:', e);
        dispatch('UPDATE_FAILED');
      }
    })();
  }, []);

  const dismiss = useCallback(() => dispatch('DISMISS'), []);

  return {
    visible: shouldShowUpdatePrompt(state),
    updating: state.updating,
    update,
    dismiss,
  };
}
