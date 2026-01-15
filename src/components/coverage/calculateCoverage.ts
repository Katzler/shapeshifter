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
