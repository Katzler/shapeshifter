import type { Agent, WeekSchedule } from '../types';
import {
  generateSchedule,
  calculateAgentHours,
  getHourStatus,
  removeAgentFromSchedule,
} from '../domain';
import type { HourStatus } from '../domain';

/**
 * Summary of an agent's scheduled hours.
 */
export interface AgentHoursSummary {
  agentId: string;
  agentName: string;
  assignedHours: number;
  targetHours: number;
  status: HourStatus;
}

/**
 * Service for schedule-related calculations and operations.
 * Orchestrates domain functions for schedule management.
 */
export class ScheduleCalculatorService {
  /**
   * Generate an optimized schedule based on agent preferences.
   * @param agents - List of agents with their preferences
   * @returns Generated weekly schedule
   */
  generateOptimizedSchedule(agents: Agent[]): WeekSchedule {
    return generateSchedule(agents);
  }

  /**
   * Calculate hours summary for all agents.
   * @param agents - List of agents
   * @param schedule - Current weekly schedule
   * @returns Array of hour summaries per agent
   */
  calculateHoursSummary(agents: Agent[], schedule: WeekSchedule): AgentHoursSummary[] {
    const hoursMap = calculateAgentHours(agents, schedule);

    return agents.map((agent) => {
      const assignedHours = hoursMap.get(agent.id) ?? 0;
      const targetHours = agent.contractHoursPerWeek;

      return {
        agentId: agent.id,
        agentName: agent.name,
        assignedHours,
        targetHours,
        status: getHourStatus(assignedHours, targetHours),
      };
    });
  }

  /**
   * Get total assigned hours for a specific agent.
   * @param agents - List of agents
   * @param schedule - Current weekly schedule
   * @param agentId - ID of the agent to check
   * @returns Assigned hours for the agent
   */
  getAgentHours(agents: Agent[], schedule: WeekSchedule, agentId: string): number {
    const hoursMap = calculateAgentHours(agents, schedule);
    return hoursMap.get(agentId) ?? 0;
  }

  /**
   * Remove an agent from all schedule assignments.
   * @param schedule - Current weekly schedule
   * @param agentId - ID of the agent to remove
   * @returns Updated schedule with agent removed
   */
  removeAgentFromSchedule(schedule: WeekSchedule, agentId: string): WeekSchedule {
    return removeAgentFromSchedule(schedule, agentId);
  }

  /**
   * Check if schedule has any unassigned slots.
   * @param schedule - Weekly schedule to check
   * @returns True if there are unassigned slots
   */
  hasUnassignedSlots(schedule: WeekSchedule): boolean {
    for (const day of Object.values(schedule)) {
      for (const shift of Object.values(day)) {
        if (shift === null) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Count total assigned shifts in the schedule.
   * @param schedule - Weekly schedule to count
   * @returns Number of assigned shifts
   */
  countAssignedShifts(schedule: WeekSchedule): number {
    let count = 0;
    for (const day of Object.values(schedule)) {
      for (const shift of Object.values(day)) {
        if (shift !== null) {
          count++;
        }
      }
    }
    return count;
  }
}

/**
 * Default singleton instance for the application.
 */
export const scheduleCalculator = new ScheduleCalculatorService();
