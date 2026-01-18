import type { Agent, DayOfWeek, ShiftId } from '../../types';
import { DAYS, SHIFTS } from '../../types';

export interface CoverageCount {
  available: number;
  unavailable: number;
  neutral: number;
}

export type ShiftCoverage = Record<ShiftId, CoverageCount>;
export type WeekCoverage = Record<DayOfWeek, ShiftCoverage>;

function createEmptyCoverageCount(): CoverageCount {
  return { available: 0, unavailable: 0, neutral: 0 };
}

function createEmptyShiftCoverage(): ShiftCoverage {
  return {
    s1: createEmptyCoverageCount(),
    s2: createEmptyCoverageCount(),
    s3: createEmptyCoverageCount(),
    s4: createEmptyCoverageCount(),
    s5: createEmptyCoverageCount(),
  };
}

function createEmptyWeekCoverage(): WeekCoverage {
  return {
    mon: createEmptyShiftCoverage(),
    tue: createEmptyShiftCoverage(),
    wed: createEmptyShiftCoverage(),
    thu: createEmptyShiftCoverage(),
    fri: createEmptyShiftCoverage(),
    sat: createEmptyShiftCoverage(),
    sun: createEmptyShiftCoverage(),
  };
}

/**
 * Calculates coverage statistics for each shift across the week.
 * Shows how many agents are available, unavailable, or neutral for each slot.
 *
 * @param agents - List of agents with their preferences
 * @returns Coverage counts per day and shift
 */
export function calculateCoverage(agents: Agent[]): WeekCoverage {
  const coverage = createEmptyWeekCoverage();

  for (const agent of agents) {
    for (const day of DAYS) {
      for (const shift of SHIFTS) {
        const status = agent.preferences[day.id][shift.id];
        coverage[day.id][shift.id][status]++;
      }
    }
  }

  return coverage;
}

/**
 * Coverage status for visual display.
 * - covered: has preferred availability (green)
 * - tight: only neutral availability (yellow)
 * - gap: no availability (red)
 */
export type CoverageStatus = 'covered' | 'tight' | 'gap';

/**
 * Get coverage status for a single shift based on preference counts.
 */
export function getShiftCoverageStatus(counts: CoverageCount): CoverageStatus {
  if (counts.available > 0) return 'covered';
  if (counts.neutral > 0) return 'tight';
  return 'gap';
}

/**
 * Get worst coverage status for a day (for summary views).
 * Returns 'gap' if any shift has a gap, 'tight' if any shift is tight, else 'covered'.
 */
export function getDayCoverageStatus(shiftCoverage: ShiftCoverage): CoverageStatus {
  let hasGap = false;
  let hasTight = false;

  for (const shift of SHIFTS) {
    const status = getShiftCoverageStatus(shiftCoverage[shift.id]);
    if (status === 'gap') hasGap = true;
    if (status === 'tight') hasTight = true;
  }

  if (hasGap) return 'gap';
  if (hasTight) return 'tight';
  return 'covered';
}

/**
 * Get human-readable label for coverage status.
 */
export function getCoverageStatusLabel(status: CoverageStatus): string {
  switch (status) {
    case 'covered':
      return 'Covered';
    case 'tight':
      return 'Tight';
    case 'gap':
      return 'Gap';
  }
}
