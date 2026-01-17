import type { Agent, DayOfWeek, ShiftId, WeekSchedule } from '../../types';
import { createEmptyWeekSchedule, shiftDurationHours, DAYS, SHIFTS } from '../../types';

interface Slot {
  day: DayOfWeek;
  dayIndex: number;
  shift: ShiftId;
}

/**
 * Counts how many agents are available (not unavailable) for a given slot.
 * Used to determine slot difficulty for prioritization.
 */
function countAvailableAgents(agents: Agent[], slot: Slot): number {
  return agents.filter(
    (agent) => agent.preferences[slot.day][slot.shift] !== 'unavailable'
  ).length;
}

/**
 * Gets the previous day ID for cross-midnight constraint checking.
 * Returns null for Monday (no previous day in our week).
 */
function getPreviousDayId(dayIndex: number): DayOfWeek | null {
  if (dayIndex === 0) return null;
  return DAYS[dayIndex - 1].id;
}

/**
 * Determines if an agent can be assigned to a slot based on:
 * - Preference (not unavailable)
 * - Max 1 shift per day constraint
 * - Cross-midnight constraint (S5 -> S1 next day)
 */
function canAssignAgentToSlot(
  agent: Agent,
  slot: Slot,
  agentDayAssignments: Map<string, Set<DayOfWeek>>,
  s5Assignments: Map<DayOfWeek, string | null>,
  schedule: WeekSchedule
): boolean {
  // Cannot assign unavailable
  if (agent.preferences[slot.day][slot.shift] === 'unavailable') {
    return false;
  }

  // Max 1 shift per day
  const agentDays = agentDayAssignments.get(agent.id)!;
  if (agentDays.has(slot.day)) {
    return false;
  }

  // Cross-midnight constraint: if assigning to S1, check if same agent had S5 previous day
  if (slot.shift === 's1') {
    const prevDay = getPreviousDayId(slot.dayIndex);
    if (prevDay !== null) {
      const s5Agent = s5Assignments.get(prevDay);
      if (s5Agent === agent.id) {
        return false;
      }
    }
  }

  // If assigning to S5, check if same agent has S1 next day already
  if (slot.shift === 's5' && slot.dayIndex < DAYS.length - 1) {
    const nextDay = DAYS[slot.dayIndex + 1].id;
    const s1Assignment = schedule[nextDay]['s1'];
    if (s1Assignment === agent.id) {
      return false;
    }
  }

  return true;
}

/**
 * Scores an agent for a slot based on:
 * - Preference (available > neutral)
 * - Fairness (prefer agents under their target hours)
 */
function scoreAgentForSlot(
  agent: Agent,
  slot: Slot,
  assignedHours: Map<string, number>
): number {
  const pref = agent.preferences[slot.day][slot.shift];
  let score = 0;

  // Preference score
  if (pref === 'available') score += 10;
  else if (pref === 'neutral') score += 2;

  // Fairness: prefer agents under their target hours
  const currentHours = assignedHours.get(agent.id)!;
  const targetHours = agent.contractHoursPerWeek;
  const ratio = currentHours / targetHours;

  if (ratio < 0.8) score += 3;
  else if (ratio < 1.0) score += 1;
  else if (ratio > 1.2) score -= 3;
  else if (ratio > 1.0) score -= 1;

  return score;
}

/**
 * Generates an optimized weekly schedule based on agent preferences.
 *
 * Algorithm:
 * 1. Sort slots by difficulty (fewer available agents = harder = assign first)
 * 2. For each slot, find eligible agents and score them
 * 3. Assign the highest-scoring agent
 *
 * Constraints enforced:
 * - Respects agent unavailability
 * - Max 1 shift per agent per day
 * - Cross-midnight rest (no S5 followed by S1 next day)
 * - Fairness based on contract hours
 */
export function generateSchedule(agents: Agent[]): WeekSchedule {
  const schedule = createEmptyWeekSchedule();
  if (agents.length === 0) return schedule;

  // Build list of all slots
  const slots: Slot[] = [];
  for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
    const day = DAYS[dayIndex].id;
    for (const shift of SHIFTS) {
      slots.push({ day, dayIndex, shift: shift.id });
    }
  }

  // Track assigned hours per agent
  const assignedHours = new Map<string, number>();
  for (const agent of agents) {
    assignedHours.set(agent.id, 0);
  }

  // Track which agents are assigned to which day (for max 1 shift per day)
  const agentDayAssignments = new Map<string, Set<DayOfWeek>>();
  for (const agent of agents) {
    agentDayAssignments.set(agent.id, new Set());
  }

  // Track S5 assignments to enforce cross-midnight constraint
  const s5Assignments = new Map<DayOfWeek, string | null>();
  for (const day of DAYS) {
    s5Assignments.set(day.id, null);
  }

  // Sort slots by difficulty (fewer available = harder = assign first)
  slots.sort(
    (a, b) => countAvailableAgents(agents, a) - countAvailableAgents(agents, b)
  );

  // Assign slots
  for (const slot of slots) {
    const candidates: { agent: Agent; score: number }[] = [];

    for (const agent of agents) {
      if (
        canAssignAgentToSlot(
          agent,
          slot,
          agentDayAssignments,
          s5Assignments,
          schedule
        )
      ) {
        candidates.push({
          agent,
          score: scoreAgentForSlot(agent, slot, assignedHours),
        });
      }
    }

    if (candidates.length === 0) {
      continue;
    }

    // Sort by score descending and pick the best
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0].agent;

    // Assign
    schedule[slot.day][slot.shift] = best.id;
    assignedHours.set(
      best.id,
      assignedHours.get(best.id)! + shiftDurationHours(slot.shift)
    );
    agentDayAssignments.get(best.id)!.add(slot.day);

    if (slot.shift === 's5') {
      s5Assignments.set(slot.day, best.id);
    }
  }

  return schedule;
}
