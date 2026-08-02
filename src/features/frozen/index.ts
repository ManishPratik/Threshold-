// Public API of the frozen feature. Every consumer outside this folder
// (routes, other features) MUST import from here. Deep imports into
// `@features/frozen/<subfolder>` are blocked by the feature-boundary
// ESLint rule at eslint.config.js.

export { PromiseService } from './promise/PromiseService';
export { DeclarationService } from './declaration/DeclarationService';
export { BlockCompletionService } from './blockCompletion/BlockCompletionService';
export { RoutineService } from './routine/RoutineService';
export { NoteService, NOTE_MAX_LENGTH } from './note/NoteService';

export { NavBar } from './shell/NavBar';
export { ModalShell } from './shell/ModalShell';
export { DialogShell } from './shell/DialogShell';
export { InlineError } from './shell/InlineError';
export { CeremonialFade } from './shell/CeremonialFade';

// Duplicate-submission guard (Engineering Foundations §11) — re-exported
// here so every frozen consumer imports from a single public entry point.
export { useSubmitOnce } from '@shared/hooks/useSubmitOnce';
