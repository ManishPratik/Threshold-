import type { Mission } from '@data/types/Mission';
import type { DayLog } from '@data/types/DayLog';

/**
 * A calm, human-facing health label for the Mission Summary card.
 * Deliberately narrow in Milestone 1 — richer "off-track" detection needs
 * Self-Trust rollups (deferred to a later milestone).
 */
export type MissionHealth = 'healthy' | 'in-recovery' | 'completed';

export function getMissionHealth(mission: Mission, todayDayLog: DayLog | undefined): MissionHealth {
  if (mission.status === 'completed') return 'completed';
  if (todayDayLog?.state === 'recovery') return 'in-recovery';
  return 'healthy';
}

export function healthLabel(h: MissionHealth): string {
  switch (h) {
    case 'healthy':
      return 'Healthy';
    case 'in-recovery':
      return 'In recovery';
    case 'completed':
      return 'Completed';
  }
}
