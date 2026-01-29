// Workspace types
export {
  type WorkspaceMeta,
  type WorkspaceRegistry,
  WORKSPACE_REGISTRY_VERSION,
  DEFAULT_WORKSPACE_ID,
  DEFAULT_WORKSPACE_NAME,
  MAX_WORKSPACES,
  createWorkspaceMeta,
  createDefaultWorkspace,
  createDefaultRegistry,
  normalizeWorkspaceRegistry,
} from './workspace';

// Preference status for a shift slot
export type PreferenceStatus = 'neutral' | 'available' | 'unavailable';

// Days of the week
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// Shift identifiers
export type ShiftId = 's1' | 's2' | 's3' | 's4' | 's5';

// Shift definition
export interface Shift {
  id: ShiftId;
  label: string;
  startTime: string;
  endTime: string;
}

// Fixed shift definitions
export const SHIFTS: readonly Shift[] = [
  { id: 's1', label: 'S1', startTime: '00:00', endTime: '07:00' },
  { id: 's2', label: 'S2', startTime: '07:00', endTime: '13:00' },
  { id: 's3', label: 'S3', startTime: '09:00', endTime: '17:00' },
  { id: 's4', label: 'S4', startTime: '12:00', endTime: '20:00' },
  { id: 's5', label: 'S5', startTime: '19:00', endTime: '01:00' },
] as const;

// Shift durations in hours
const SHIFT_DURATIONS: Record<ShiftId, number> = {
  s1: 7,  // 00:00-07:00
  s2: 6,  // 07:00-13:00
  s3: 8,  // 09:00-17:00
  s4: 8,  // 12:00-20:00
  s5: 6,  // 19:00-01:00 (crosses midnight)
};

export function shiftDurationHours(shiftId: ShiftId): number {
  return SHIFT_DURATIONS[shiftId];
}

// Day definition for display
export interface Day {
  id: DayOfWeek;
  label: string;
}

// Days of the week with display names
export const DAYS: readonly Day[] = [
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
  { id: 'sun', label: 'Sunday' },
] as const;

// Preferences for all shifts in a single day
export type DayPreferences = Record<ShiftId, PreferenceStatus>;

// Preferences for all days in a week
export type WeekPreferences = Record<DayOfWeek, DayPreferences>;

// Schedule assignment: agentId or null (unassigned)
export type ScheduleAssignment = string | null;

// Schedule for all shifts in a single day
export type DaySchedule = Record<ShiftId, ScheduleAssignment>;

// Schedule for all days in a week
export type WeekSchedule = Record<DayOfWeek, DaySchedule>;

// Default contract hours per week
export const DEFAULT_CONTRACT_HOURS = 40;

// Agent with their weekly preferences and contract hours
export interface Agent {
  id: string;
  name: string;
  email?: string; // Optional: links agent to user account for swaps
  preferences: WeekPreferences;
  contractHoursPerWeek: number;
}

// Top-level app data structure (versioned for future migrations)
export interface AppData {
  version: number;
  agents: Agent[];
  schedule: WeekSchedule;
}

// Current schema version
export const CURRENT_VERSION = 2;

// Create default preferences for a day (all unavailable for safety-first scheduling)
function createDefaultDayPreferences(): DayPreferences {
  return {
    s1: 'unavailable',
    s2: 'unavailable',
    s3: 'unavailable',
    s4: 'unavailable',
    s5: 'unavailable',
  };
}

// Create default preferences for a week (all unavailable for safety-first scheduling)
export function createDefaultWeekPreferences(): WeekPreferences {
  return {
    mon: createDefaultDayPreferences(),
    tue: createDefaultDayPreferences(),
    wed: createDefaultDayPreferences(),
    thu: createDefaultDayPreferences(),
    fri: createDefaultDayPreferences(),
    sat: createDefaultDayPreferences(),
    sun: createDefaultDayPreferences(),
  };
}

// Create empty day schedule (all null)
function createEmptyDaySchedule(): DaySchedule {
  return {
    s1: null,
    s2: null,
    s3: null,
    s4: null,
    s5: null,
  };
}

// Create empty week schedule (all null)
export function createEmptyWeekSchedule(): WeekSchedule {
  return {
    mon: createEmptyDaySchedule(),
    tue: createEmptyDaySchedule(),
    wed: createEmptyDaySchedule(),
    thu: createEmptyDaySchedule(),
    fri: createEmptyDaySchedule(),
    sat: createEmptyDaySchedule(),
    sun: createEmptyDaySchedule(),
  };
}

// Create a new agent with default preferences
export function createAgent(id: string, name: string, email?: string): Agent {
  return {
    id,
    name,
    email: email?.trim().toLowerCase() || undefined,
    preferences: createDefaultWeekPreferences(),
    contractHoursPerWeek: DEFAULT_CONTRACT_HOURS,
  };
}

// Create empty app data
export function createEmptyAppData(): AppData {
  return {
    version: CURRENT_VERSION,
    agents: [],
    schedule: createEmptyWeekSchedule(),
  };
}

// Valid preference status values
const VALID_STATUSES: Set<string> = new Set(['neutral', 'available', 'unavailable']);

/**
 * Get CSS class suffix for a schedule cell based on assignment and preference.
 * Returns: 'unassigned' | 'pref-available' | 'pref-neutral' | 'pref-unavailable'
 */
export function getScheduleCellStatus(
  isAssigned: boolean,
  preference: PreferenceStatus | undefined
): string {
  if (!isAssigned) {
    return 'unassigned';
  }
  return `pref-${preference ?? 'neutral'}`;
}

/**
 * Get human-readable preference label for tooltips.
 */
export function getPreferenceLabel(preference: PreferenceStatus | undefined): string {
  switch (preference) {
    case 'available':
      return 'Available';
    case 'unavailable':
      return 'Unavailable';
    case 'neutral':
    default:
      return 'Neutral';
  }
}

// All day IDs for iteration
const DAY_IDS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// All shift IDs for iteration
const SHIFT_IDS: ShiftId[] = ['s1', 's2', 's3', 's4', 's5'];

/**
 * Normalize a preference status value, defaulting to "neutral" if invalid.
 */
function normalizeStatus(value: unknown): PreferenceStatus {
  if (typeof value === 'string' && VALID_STATUSES.has(value)) {
    return value as PreferenceStatus;
  }
  return 'neutral';
}

/**
 * Normalize day preferences, ensuring all shifts are present with valid statuses.
 */
function normalizeDayPreferences(input: unknown): DayPreferences {
  const result = createDefaultDayPreferences();
  if (typeof input !== 'object' || input === null) {
    return result;
  }
  const obj = input as Record<string, unknown>;
  for (const shiftId of SHIFT_IDS) {
    result[shiftId] = normalizeStatus(obj[shiftId]);
  }
  return result;
}

/**
 * Normalize week preferences, ensuring all days and shifts are present.
 */
function normalizeWeekPreferences(input: unknown): WeekPreferences {
  const result = createDefaultWeekPreferences();
  if (typeof input !== 'object' || input === null) {
    return result;
  }
  const obj = input as Record<string, unknown>;
  for (const dayId of DAY_IDS) {
    result[dayId] = normalizeDayPreferences(obj[dayId]);
  }
  return result;
}

/**
 * Normalize an agent, ensuring id, name, preferences, and contractHoursPerWeek are present.
 */
function normalizeAgent(input: unknown): Agent | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }
  const obj = input as Record<string, unknown>;

  // id and name must be valid strings
  if (typeof obj.id !== 'string' || obj.id.trim() === '') {
    return null;
  }
  if (typeof obj.name !== 'string' || obj.name.trim() === '') {
    return null;
  }

  // contractHoursPerWeek defaults to DEFAULT_CONTRACT_HOURS
  let contractHours = DEFAULT_CONTRACT_HOURS;
  if (typeof obj.contractHoursPerWeek === 'number' && obj.contractHoursPerWeek > 0) {
    contractHours = Math.round(obj.contractHoursPerWeek);
  }

  // email is optional
  const email = typeof obj.email === 'string' && obj.email.trim() !== ''
    ? obj.email.trim().toLowerCase()
    : undefined;

  return {
    id: obj.id,
    name: obj.name,
    email,
    preferences: normalizeWeekPreferences(obj.preferences),
    contractHoursPerWeek: contractHours,
  };
}

/**
 * Normalize day schedule, ensuring all shifts are present. Invalid agentIds become null.
 */
function normalizeDaySchedule(input: unknown, validAgentIds: Set<string>): DaySchedule {
  const result = createEmptyDaySchedule();
  if (typeof input !== 'object' || input === null) {
    return result;
  }
  const obj = input as Record<string, unknown>;
  for (const shiftId of SHIFT_IDS) {
    const val = obj[shiftId];
    if (typeof val === 'string' && validAgentIds.has(val)) {
      result[shiftId] = val;
    } else {
      result[shiftId] = null;
    }
  }
  return result;
}

/**
 * Normalize week schedule, ensuring all days and shifts are present.
 */
function normalizeWeekSchedule(input: unknown, validAgentIds: Set<string>): WeekSchedule {
  const result = createEmptyWeekSchedule();
  if (typeof input !== 'object' || input === null) {
    return result;
  }
  const obj = input as Record<string, unknown>;
  for (const dayId of DAY_IDS) {
    result[dayId] = normalizeDaySchedule(obj[dayId], validAgentIds);
  }
  return result;
}

/**
 * Normalize unknown input into valid AppData.
 * Ensures version is CURRENT_VERSION, all agents have complete data, and schedule is valid.
 */
export function normalizeAppData(input: unknown): AppData {
  const result: AppData = {
    version: CURRENT_VERSION,
    agents: [],
    schedule: createEmptyWeekSchedule(),
  };

  if (typeof input !== 'object' || input === null) {
    return result;
  }

  const obj = input as Record<string, unknown>;

  // Normalize agents first to get valid IDs
  if (Array.isArray(obj.agents)) {
    for (const agentInput of obj.agents) {
      const agent = normalizeAgent(agentInput);
      if (agent !== null) {
        result.agents.push(agent);
      }
    }
  }

  // Build set of valid agent IDs for schedule normalization
  const validAgentIds = new Set(result.agents.map((a) => a.id));

  // Normalize schedule
  result.schedule = normalizeWeekSchedule(obj.schedule, validAgentIds);

  return result;
}

// ==================== Swap Types ====================

export type SwapStatus = 'available' | 'claimed' | 'approved' | 'denied' | 'cancelled';

export interface SwapRequest {
  id: string;
  workspaceId: string;
  day: DayOfWeek;
  shiftId: ShiftId;
  fromAgent: string;        // agent name (for display)
  note?: string;            // from original poster

  // If claimed
  claimedBy?: string;       // agent name (for display)
  claimNote?: string;
  claimedAt?: string;

  status: SwapStatus;
  createdAt: string;

  // If approved/denied
  reviewedBy?: string;
  reviewedAt?: string;
  denialReason?: string;
}

// Helper to get shift label with time range
export function getShiftDisplayLabel(shiftId: ShiftId): string {
  const shift = SHIFTS.find(s => s.id === shiftId);
  if (!shift) return shiftId.toUpperCase();
  return `${shift.label} (${shift.startTime}–${shift.endTime})`;
}

// Helper to get day label
export function getDayDisplayLabel(day: DayOfWeek): string {
  const dayObj = DAYS.find(d => d.id === day);
  return dayObj?.label ?? day;
}

// Helper to format shift for display: "Mon S1 (00:00–07:00)"
export function formatShiftDisplay(day: DayOfWeek, shiftId: ShiftId): string {
  const dayLabel = getDayDisplayLabel(day).slice(0, 3); // "Mon", "Tue", etc.
  return `${dayLabel} ${getShiftDisplayLabel(shiftId)}`;
}
