import type { BaseEntity } from './common';

export type RoutineBlockType = 'focus' | 'break' | 'ritual';

export interface RoutineBlock {
  id: string;
  label: string;
  durationMinutes: number;
  type: RoutineBlockType;
  /** 24-hour local time HH:MM. Loose — the engine may drift within a window. */
  expectedStart: string | null;
}

export interface Routine extends BaseEntity {
  name: string;
  missionId: string | null;
  blocks: RoutineBlock[];
  active: boolean;
}
