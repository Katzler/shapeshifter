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

// Agent with their weekly preferences
export interface Agent {
  id: string;
  name: string;
  preferences: WeekPreferences;
}

// Top-level app data structure (versioned for future migrations)
export interface AppData {
  version: number;
  agents: Agent[];
}

// Current schema version
export const CURRENT_VERSION = 1;

// Create default empty preferences for a day (all neutral)
function createDefaultDayPreferences(): DayPreferences {
  return {
    s1: 'neutral',
    s2: 'neutral',
    s3: 'neutral',
    s4: 'neutral',
    s5: 'neutral',
  };
}

// Create default empty preferences for a week (all neutral)
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

// Create a new agent with default preferences
export function createAgent(id: string, name: string): Agent {
  return {
    id,
    name,
    preferences: createDefaultWeekPreferences(),
  };
}

// Create empty app data
export function createEmptyAppData(): AppData {
  return {
    version: CURRENT_VERSION,
    agents: [],
  };
}

// Valid preference status values
const VALID_STATUSES: Set<string> = new Set(['neutral', 'available', 'unavailable']);

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
 * Normalize an agent, ensuring id, name, and full preferences are present.
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

  return {
    id: obj.id,
    name: obj.name,
    preferences: normalizeWeekPreferences(obj.preferences),
  };
}

/**
 * Normalize unknown input into valid AppData.
 * Ensures version is CURRENT_VERSION and all agents have complete preferences.
 */
export function normalizeAppData(input: unknown): AppData {
  const result: AppData = {
    version: CURRENT_VERSION,
    agents: [],
  };

  if (typeof input !== 'object' || input === null) {
    return result;
  }

  const obj = input as Record<string, unknown>;

  if (Array.isArray(obj.agents)) {
    for (const agentInput of obj.agents) {
      const agent = normalizeAgent(agentInput);
      if (agent !== null) {
        result.agents.push(agent);
      }
    }
  }

  return result;
}
