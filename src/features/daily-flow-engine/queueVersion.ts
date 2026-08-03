// Program-agnostic revision counter that InterventionQueue subscribes
// to. Any program that finishes an async load which changes
// `shouldFire` behaviour calls `bumpQueueVersion()` and every mounted
// queue re-renders.
//
// Pattern lifted from React 18's `useSyncExternalStore` — the engine
// stays program-agnostic (no knowledge of Smoking or any other
// program), programs stay engine-agnostic (no knowledge of the
// queue component's mounting state).

type Listener = () => void;

let version = 0;
const listeners = new Set<Listener>();

/** Read the current version. Programs never call this. */
export function getQueueVersion(): number {
  return version;
}

/**
 * Programs call this after any async state load whose result could
 * change `shouldFire`. Every mounted InterventionQueue re-renders
 * and re-evaluates the intervention list.
 */
export function bumpQueueVersion(): void {
  version += 1;
  for (const l of listeners) l();
}

/** Subscribe to version bumps. Returns an unsubscribe fn. */
export function subscribeQueueVersion(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
