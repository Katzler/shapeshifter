export type HourStatus = 'under' | 'over' | 'normal';

/**
 * Threshold in hours for determining if an agent is significantly
 * under or over their target hours.
 */
const HOUR_THRESHOLD = 8;

/**
 * Determines if an agent's assigned hours are significantly under or over target.
 *
 * @param assigned - Hours assigned to the agent
 * @param target - Agent's target contract hours
 * @returns 'under' if more than 8h below target, 'over' if more than 8h above, 'normal' otherwise
 */
export function getHourStatus(assigned: number, target: number): HourStatus {
  const diff = assigned - target;

  if (diff < -HOUR_THRESHOLD) return 'under';
  if (diff > HOUR_THRESHOLD) return 'over';
  return 'normal';
}
