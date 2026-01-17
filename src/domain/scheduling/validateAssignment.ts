import type { Agent, DayOfWeek, ShiftId, WeekSchedule } from '../../types';
import { DAYS, SHIFTS } from '../../types';

export type AssignmentValidation =
  | { valid: true }
  | { valid: false; reason: AssignmentViolation };

export type AssignmentViolation =
  | 'unavailable'
  | 'already-assigned-today'
  | 'cross-midnight-s5-before'
  | 'cross-midnight-s1-after';

/**
 * Get day index from day ID for cross-midnight checks.
 */
function getDayIndex(day: DayOfWeek): number {
  return DAYS.findIndex((d) => d.id === day);
}

/**
 * Get the previous day ID, or null for Monday.
 */
function getPreviousDay(day: DayOfWeek): DayOfWeek | null {
  const index = getDayIndex(day);
  if (index === 0) return null;
  return DAYS[index - 1].id;
}

/**
 * Get the next day ID, or null for Sunday.
 */
function getNextDay(day: DayOfWeek): DayOfWeek | null {
  const index = getDayIndex(day);
  if (index >= DAYS.length - 1) return null;
  return DAYS[index + 1].id;
}

/**
 * Validates whether an agent can be assigned to a specific slot.
 *
 * Constraints checked:
 * 1. Agent must not be "unavailable" for this slot
 * 2. Agent must not already have another shift on the same day (max 1 shift/day)
 * 3. Cross-midnight rest: No S5 → S1 next day for same agent
 */
export function validateAssignment(
  agent: Agent,
  day: DayOfWeek,
  shift: ShiftId,
  schedule: WeekSchedule
): AssignmentValidation {
  // 1. Check preference - cannot assign if unavailable
  if (agent.preferences[day][shift] === 'unavailable') {
    return { valid: false, reason: 'unavailable' };
  }

  // 2. Check max 1 shift per day
  const daySchedule = schedule[day];
  for (const s of SHIFTS) {
    if (s.id !== shift && daySchedule[s.id] === agent.id) {
      return { valid: false, reason: 'already-assigned-today' };
    }
  }

  // 3. Cross-midnight constraint
  // If assigning to S1, check if same agent has S5 on previous day
  if (shift === 's1') {
    const prevDay = getPreviousDay(day);
    if (prevDay !== null && schedule[prevDay]['s5'] === agent.id) {
      return { valid: false, reason: 'cross-midnight-s5-before' };
    }
  }

  // If assigning to S5, check if same agent has S1 on next day
  if (shift === 's5') {
    const nextDay = getNextDay(day);
    if (nextDay !== null && schedule[nextDay]['s1'] === agent.id) {
      return { valid: false, reason: 'cross-midnight-s1-after' };
    }
  }

  return { valid: true };
}

/**
 * Returns human-readable text for a violation reason.
 */
export function getViolationLabel(reason: AssignmentViolation): string {
  switch (reason) {
    case 'unavailable':
      return 'Unavailable';
    case 'already-assigned-today':
      return 'Already assigned today';
    case 'cross-midnight-s5-before':
      return 'Has S5 previous day';
    case 'cross-midnight-s1-after':
      return 'Has S1 next day';
  }
}
