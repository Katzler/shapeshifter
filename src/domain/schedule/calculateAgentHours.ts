import type { Agent, WeekSchedule } from '../../types';
import { DAYS, SHIFTS, shiftDurationHours } from '../../types';

/**
 * Calculates total assigned hours per agent from a weekly schedule.
 *
 * @param agents - List of agents to calculate hours for
 * @param schedule - The weekly schedule with shift assignments
 * @returns Map of agent ID to total assigned hours
 */
export function calculateAgentHours(
  agents: Agent[],
  schedule: WeekSchedule
): Map<string, number> {
  const hours = new Map<string, number>();

  // Initialize all agents with 0 hours
  for (const agent of agents) {
    hours.set(agent.id, 0);
  }

  // Sum up hours from schedule assignments
  for (const day of DAYS) {
    for (const shift of SHIFTS) {
      const agentId = schedule[day.id][shift.id];
      if (agentId && hours.has(agentId)) {
        hours.set(agentId, hours.get(agentId)! + shiftDurationHours(shift.id));
      }
    }
  }

  return hours;
}
