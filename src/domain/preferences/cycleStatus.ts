import type { PreferenceStatus } from '../../types';

/**
 * The order in which preference statuses cycle when toggled.
 */
const STATUS_CYCLE: PreferenceStatus[] = ['neutral', 'available', 'unavailable'];

/**
 * Gets the next preference status in the cycle.
 * neutral -> available -> unavailable -> neutral
 *
 * @param current - The current preference status
 * @returns The next status in the cycle
 */
export function getNextPreferenceStatus(current: PreferenceStatus): PreferenceStatus {
  const index = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
}
