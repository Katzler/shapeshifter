import type { WeekSchedule } from '../../types';
import { DAYS, SHIFTS } from '../../types';

/**
 * Removes all assignments for a specific agent from the schedule.
 * Returns a new schedule object with the agent's assignments cleared.
 *
 * @param schedule - The current weekly schedule
 * @param agentId - The ID of the agent to remove
 * @returns A new schedule with the agent's assignments set to null
 */
export function removeAgentFromSchedule(
  schedule: WeekSchedule,
  agentId: string
): WeekSchedule {
  const newSchedule = { ...schedule };

  for (const day of DAYS) {
    newSchedule[day.id] = { ...newSchedule[day.id] };
    for (const shift of SHIFTS) {
      if (newSchedule[day.id][shift.id] === agentId) {
        newSchedule[day.id][shift.id] = null;
      }
    }
  }

  return newSchedule;
}
