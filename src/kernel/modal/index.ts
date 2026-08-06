// @kernel/modal — E5 single-active-modal host.
//
// V2 Kernel Public API for opening / closing / observing the single
// active modal, plus the `ModalShell` primitive used by any surface
// that renders a modal frame.
//
// ─────────────────────────────────────────────────────────────
// Architectural invariant enforced across every module in V2:
//   Modules may import only:
//     - @kernel/*
//     - @contract/*
//     - @shared/*
//   Modules must not import:
//     - other modules
//     - kernel internals
// ─────────────────────────────────────────────────────────────
//
// Runtime implementation lives at src/app/frozen/modalState.ts
// (imperative state manager) and src/features/frozen/shell/ModalShell.tsx
// (React primitive). This namespace re-exports both under stable kernel
// names so modules never reach into the kernel internals directly.

export {
  openModal,
  closeModal,
  replaceModal,
  getModalState,
  subscribe,
  unsubscribe,
} from '@app/frozen/modalState';

export type {
  FrozenModalType,
  FrozenModalState,
  ModalListener,
} from '@app/frozen/modalState';

export { ModalShell } from '@features/frozen';
