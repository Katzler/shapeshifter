// Domain layer exports
// Pure business logic with no React dependencies

export { generateSchedule, validateAssignment, getViolationLabel } from './scheduling';
export type { AssignmentValidation, AssignmentViolation } from './scheduling';
export { calculateAgentHours, getHourStatus, removeAgentFromSchedule } from './schedule';
export type { HourStatus } from './schedule';
export { calculateCoverage } from './coverage';
export type { CoverageCount, ShiftCoverage, WeekCoverage } from './coverage';
export { getNextPreferenceStatus } from './preferences';

// Repository interfaces (contracts)
export type { IAppDataRepository, IFileService, ImportResult } from './repositories';
