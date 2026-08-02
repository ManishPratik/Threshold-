import { useSyncExternalStore } from 'react';
import type { Declaration } from '@data/types/frozen/Declaration';
import type { PromiseRecord } from '@data/types/PromiseRecord';
import type { ISODate } from '@shared/lib/date';
import { PromiseService } from '@features/frozen';
import {
  closeModal,
  getModalState,
  replaceModal,
  subscribe,
  unsubscribe,
  type FrozenModalState,
  type ModalListener,
} from './modalState';
import {
  FrozenReflectionModal,
  type FrozenReflectionVariant,
} from '@routes/frozen/reflection';
import { FrozenRecoveryModal } from '@routes/frozen/recovery';
import { FrozenCompletionModal } from '@routes/frozen/completion';

/** Payload shapes for each modal type. Callers pass these opaquely
 *  through the modal-state manager; the root casts them here. */
export interface ReflectionModalPayload {
  variant: FrozenReflectionVariant;
  promise: PromiseRecord;
  date: ISODate;
  existingDeclaration?: Declaration | null;
  /**
   * Ordered oldest-first list of ADDITIONAL logical dates that need
   * reflection after this one dismisses. Set by the Today adapter when
   * missed days are detected on mount. Threaded through variant
   * transitions so `onDismiss` can open the next date. Absent or empty
   * = no follow-on backfill.
   */
  backfillQueue?: readonly ISODate[];
}
export interface RecoveryModalPayload {
  promise: PromiseRecord;
  /**
   * True when Recovery is following an endDate-broken transition that
   * terminated the Promise. The Continue handler then reloads the page
   * so the underlying route rehydrates from the cleared AppState pointer.
   * Absent or false for mid-arc broken declarations where the Promise
   * remains active.
   */
  terminated?: boolean;
}
export interface CompletionModalPayload {
  promise: PromiseRecord;
}

// Module-level stable subscribe wrapper for useSyncExternalStore. The
// modal-state manager exposes subscribe/unsubscribe with a listener
// signature that receives the current state; React's hook expects a
// no-arg listener, so we adapt.
function subscribeReact(reactListener: () => void): () => void {
  const wrapped: ModalListener = () => reactListener();
  subscribe(wrapped);
  return () => unsubscribe(wrapped);
}

function useFrozenModalState(): FrozenModalState | null {
  return useSyncExternalStore(subscribeReact, getModalState);
}

/**
 * Handle Reflection modal dismiss with three concerns in strict order:
 *
 * 1. If the reflected date equals the Promise's endDate, terminate the
 *    Promise atomically via PromiseService (kept → completePromise +
 *    Completion modal; broken → breakPromise('final-day-broken') +
 *    Recovery modal). Skip any backfill continuation because the arc
 *    is over.
 * 2. If a backfill queue exists and has more dates, open the next
 *    date's Question variant with the remainder threaded forward.
 * 3. Otherwise: standard mid-arc handling — broken → Recovery, kept →
 *    close.
 */
async function handleReflectionDismiss(
  payload: ReflectionModalPayload,
): Promise<void> {
  const isEndDate = payload.date === payload.promise.endDate;

  if (isEndDate) {
    const service = new PromiseService();
    if (payload.variant === 'kept') {
      await service.completePromise(payload.promise.id);
      replaceModal('completion', {
        promise: payload.promise,
      } satisfies CompletionModalPayload);
      return;
    }
    if (payload.variant === 'broken') {
      await service.breakPromise(payload.promise.id, 'final-day-broken');
      replaceModal('recovery', {
        promise: payload.promise,
        terminated: true,
      } satisfies RecoveryModalPayload);
      return;
    }
  }

  const queue = payload.backfillQueue;
  if (queue && queue.length > 0) {
    const nextDate = queue[0];
    const rest = queue.slice(1);
    if (nextDate !== undefined) {
      replaceModal('reflection', {
        variant: 'question',
        promise: payload.promise,
        date: nextDate,
        backfillQueue: rest,
      } satisfies ReflectionModalPayload);
      return;
    }
  }

  if (payload.variant === 'broken') {
    replaceModal('recovery', {
      promise: payload.promise,
    } satisfies RecoveryModalPayload);
    return;
  }
  closeModal();
}

/**
 * Renders exactly the modal named by the current modal state, or nothing
 * when the state is null. Reuses every previously built frozen modal /
 * dialog component — no business logic is duplicated here. Common
 * transitions (kept/broken confirmation, kept→close, broken→recovery)
 * are wired via `replaceModal` and `closeModal` so callers construct
 * only the minimum payload.
 *
 * The `delete-block` modal type has no dedicated component — the delete-
 * block confirmation lives inline within `FrozenRoutinePage` and is not
 * driven through the modal-state manager.
 */
export function FrozenModalRoot() {
  const state = useFrozenModalState();
  if (state === null) return null;

  switch (state.type) {
    case 'reflection': {
      const payload = state.payload as ReflectionModalPayload;
      const carry = payload.backfillQueue
        ? { backfillQueue: payload.backfillQueue }
        : {};
      return (
        <FrozenReflectionModal
          open={true}
          variant={payload.variant}
          promise={payload.promise}
          date={payload.date}
          existingDeclaration={payload.existingDeclaration ?? null}
          onKeptDeclared={() =>
            replaceModal('reflection', {
              variant: 'kept',
              promise: payload.promise,
              date: payload.date,
              ...carry,
            } satisfies ReflectionModalPayload)
          }
          onBrokenDeclared={() =>
            replaceModal('reflection', {
              variant: 'broken',
              promise: payload.promise,
              date: payload.date,
              ...carry,
            } satisfies ReflectionModalPayload)
          }
          onDismiss={() => {
            void handleReflectionDismiss(payload);
          }}
        />
      );
    }
    case 'recovery': {
      const payload = state.payload as RecoveryModalPayload;
      return (
        <FrozenRecoveryModal
          open={true}
          promise={payload.promise}
          onContinue={() => {
            closeModal();
            if (payload.terminated) {
              // AppState pointer was just cleared by the endDate-broken
              // termination. Force a full reload so the mounted route
              // rehydrates from the fresh app state instead of showing
              // the stale in-memory Promise the previous mount fetched.
              window.location.reload();
            }
          }}
        />
      );
    }
    case 'completion': {
      const payload = state.payload as CompletionModalPayload;
      return (
        <FrozenCompletionModal
          open={true}
          promise={payload.promise}
          onContinue={() => {
            closeModal();
            // Completion is only reached from the endDate-kept
            // termination, which cleared the AppState pointer. Full
            // reload so the mounted route rehydrates from fresh state.
            window.location.reload();
          }}
        />
      );
    }
    default:
      return null;
  }
}
