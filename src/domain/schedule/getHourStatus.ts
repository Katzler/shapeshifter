/**
 * Proximity to target hours:
 * - exact: matches contract hours perfectly
 * - close: within ±5 hours of target
 * - far: more than ±5 hours from target
 */
export type HourStatus = 'exact' | 'close' | 'far';

/**
 * Threshold in hours for "close" vs "far" status.
 */
const CLOSE_THRESHOLD = 5;

/**
 * Determines how close an agent's assigned hours are to their target.
 *
 * @param assigned - Hours assigned to the agent
 * @param target - Agent's target contract hours
 * @returns 'exact' if matching, 'close' if within ±5h, 'far' if beyond
 */
export function getHourStatus(assigned: number, target: number): HourStatus {
  const diff = Math.abs(assigned - target);

  if (diff === 0) return 'exact';
  if (diff <= CLOSE_THRESHOLD) return 'close';
  return 'far';
}
