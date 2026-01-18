import type { DayOfWeek } from '../types';

/**
 * Maps JavaScript Date.getDay() index (0=Sunday) to DayOfWeek id.
 */
export const JS_DAY_TO_DAY_ID: readonly DayOfWeek[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
] as const;

/**
 * Get the current day of week as a DayOfWeek id.
 */
export function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay();
  return JS_DAY_TO_DAY_ID[dayIndex];
}
