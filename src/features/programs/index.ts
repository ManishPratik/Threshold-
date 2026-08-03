// Public API of the Life Program runtime. The runtime is deliberately
// minimum: a static registry + a Today mount point + an enabled-ids
// field on AppState. Nothing else is required to allow optional
// programs to plug in without touching Personal OS when no program is
// enabled.

export {
  registerProgram,
  getProgram,
  listPrograms,
  clearRegistry,
} from './registry';

export type { LifeProgram, TodayWidgetProps } from './types';

export { TodayProgramWidgets } from './TodayProgramWidgets';
export type { TodayProgramWidgetsProps } from './TodayProgramWidgets';
