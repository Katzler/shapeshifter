import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  Agent,
  AppData,
  DayOfWeek,
  ShiftId,
  PreferenceStatus,
  WeekSchedule,
} from '../types';
import {
  createAgent,
  createEmptyAppData,
  createEmptyWeekSchedule,
  shiftDurationHours,
  DAYS,
  SHIFTS,
} from '../types';
import { loadData, saveData, exportToFile } from '../storage';

// Preference cycle order
const STATUS_CYCLE: PreferenceStatus[] = ['neutral', 'available', 'unavailable'];

function getNextStatus(current: PreferenceStatus): PreferenceStatus {
  const index = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
}

// Generate unique ID with fallback for older browsers
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

// Context value type
interface AppContextValue {
  agents: Agent[];
  schedule: WeekSchedule;
  selectedAgentId: string | null;
  addAgent: (name: string) => Agent;
  renameAgent: (id: string, name: string) => void;
  deleteAgent: (id: string) => void;
  setContractHours: (agentId: string, hours: number) => void;
  setPreference: (
    agentId: string,
    day: DayOfWeek,
    shift: ShiftId,
    status: PreferenceStatus
  ) => void;
  cyclePreference: (agentId: string, day: DayOfWeek, shift: ShiftId) => void;
  selectAgent: (id: string | null) => void;
  setScheduleAssignment: (day: DayOfWeek, shift: ShiftId, agentId: string | null) => void;
  clearSchedule: () => void;
  suggestSchedule: () => void;
  exportData: () => void;
  importData: (data: AppData) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [data, setData] = useState<AppData>(() => {
    const loaded = loadData();
    return loaded ?? createEmptyAppData();
  });
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Auto-save whenever data changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  const addAgent = useCallback((name: string): Agent => {
    const id = generateId();
    const agent = createAgent(id, name);
    setData((prev) => ({
      ...prev,
      agents: [...prev.agents, agent],
    }));
    return agent;
  }, []);

  const renameAgent = useCallback((id: string, name: string): void => {
    setData((prev) => ({
      ...prev,
      agents: prev.agents.map((agent) =>
        agent.id === id ? { ...agent, name } : agent
      ),
    }));
  }, []);

  const deleteAgent = useCallback((id: string): void => {
    setData((prev) => {
      // Also remove agent from schedule
      const newSchedule = { ...prev.schedule };
      for (const day of DAYS) {
        newSchedule[day.id] = { ...newSchedule[day.id] };
        for (const shift of SHIFTS) {
          if (newSchedule[day.id][shift.id] === id) {
            newSchedule[day.id][shift.id] = null;
          }
        }
      }
      return {
        ...prev,
        agents: prev.agents.filter((agent) => agent.id !== id),
        schedule: newSchedule,
      };
    });
    setSelectedAgentId((prev) => (prev === id ? null : prev));
  }, []);

  const setContractHours = useCallback((agentId: string, hours: number): void => {
    setData((prev) => ({
      ...prev,
      agents: prev.agents.map((agent) =>
        agent.id === agentId
          ? { ...agent, contractHoursPerWeek: Math.max(1, Math.round(hours)) }
          : agent
      ),
    }));
  }, []);

  const setPreference = useCallback(
    (
      agentId: string,
      day: DayOfWeek,
      shift: ShiftId,
      status: PreferenceStatus
    ): void => {
      setData((prev) => ({
        ...prev,
        agents: prev.agents.map((agent) =>
          agent.id === agentId
            ? {
                ...agent,
                preferences: {
                  ...agent.preferences,
                  [day]: {
                    ...agent.preferences[day],
                    [shift]: status,
                  },
                },
              }
            : agent
        ),
      }));
    },
    []
  );

  const cyclePreference = useCallback(
    (agentId: string, day: DayOfWeek, shift: ShiftId): void => {
      setData((prev) => ({
        ...prev,
        agents: prev.agents.map((agent) => {
          if (agent.id !== agentId) return agent;
          const currentStatus = agent.preferences[day][shift];
          const nextStatus = getNextStatus(currentStatus);
          return {
            ...agent,
            preferences: {
              ...agent.preferences,
              [day]: {
                ...agent.preferences[day],
                [shift]: nextStatus,
              },
            },
          };
        }),
      }));
    },
    []
  );

  const selectAgent = useCallback((id: string | null): void => {
    setSelectedAgentId(id);
  }, []);

  const setScheduleAssignment = useCallback(
    (day: DayOfWeek, shift: ShiftId, agentId: string | null): void => {
      setData((prev) => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            [shift]: agentId,
          },
        },
      }));
    },
    []
  );

  const clearSchedule = useCallback((): void => {
    setData((prev) => ({
      ...prev,
      schedule: createEmptyWeekSchedule(),
    }));
  }, []);

  const suggestSchedule = useCallback((): void => {
    setData((prev) => {
      const newSchedule = generateSchedule(prev.agents);
      return { ...prev, schedule: newSchedule };
    });
  }, []);

  const exportData = useCallback((): void => {
    exportToFile(data);
  }, [data]);

  const importData = useCallback((newData: AppData): void => {
    setData(newData);
    setSelectedAgentId(null);
  }, []);

  const value: AppContextValue = {
    agents: data.agents,
    schedule: data.schedule,
    selectedAgentId,
    addAgent,
    renameAgent,
    deleteAgent,
    setContractHours,
    setPreference,
    cyclePreference,
    selectAgent,
    setScheduleAssignment,
    clearSchedule,
    suggestSchedule,
    exportData,
    importData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the app context
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// ============ Scheduling Algorithm ============

interface Slot {
  day: DayOfWeek;
  dayIndex: number;
  shift: ShiftId;
}

function generateSchedule(agents: Agent[]): WeekSchedule {
  const schedule = createEmptyWeekSchedule();
  if (agents.length === 0) return schedule;

  // Build list of all slots
  const slots: Slot[] = [];
  for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
    const day = DAYS[dayIndex].id;
    for (const shift of SHIFTS) {
      slots.push({ day, dayIndex, shift: shift.id });
    }
  }

  // Track assigned hours per agent
  const assignedHours: Map<string, number> = new Map();
  for (const agent of agents) {
    assignedHours.set(agent.id, 0);
  }

  // Track which agents are assigned to which day (for max 1 shift per day)
  const agentDayAssignment: Map<string, Set<DayOfWeek>> = new Map();
  for (const agent of agents) {
    agentDayAssignment.set(agent.id, new Set());
  }

  // Track s5 assignments to enforce cross-midnight constraint
  const s5Assignments: Map<DayOfWeek, string | null> = new Map();
  for (const day of DAYS) {
    s5Assignments.set(day.id, null);
  }

  // Count available agents per slot for difficulty sorting
  function countAvailable(slot: Slot): number {
    let count = 0;
    for (const agent of agents) {
      if (agent.preferences[slot.day][slot.shift] !== 'unavailable') {
        count++;
      }
    }
    return count;
  }

  // Sort slots by difficulty (fewer available = harder = assign first)
  slots.sort((a, b) => countAvailable(a) - countAvailable(b));

  // Get previous day for cross-midnight check
  function getPrevDayId(dayIndex: number): DayOfWeek | null {
    if (dayIndex === 0) return null; // Monday has no previous day in our week
    return DAYS[dayIndex - 1].id;
  }

  // Check if agent can be assigned to slot
  function canAssign(agent: Agent, slot: Slot): boolean {
    // Cannot assign unavailable
    if (agent.preferences[slot.day][slot.shift] === 'unavailable') {
      return false;
    }

    // Max 1 shift per day
    const agentDays = agentDayAssignment.get(agent.id)!;
    if (agentDays.has(slot.day)) {
      return false;
    }

    // Cross-midnight constraint: if assigning to s1, check if same agent had s5 previous day
    if (slot.shift === 's1') {
      const prevDay = getPrevDayId(slot.dayIndex);
      if (prevDay !== null) {
        const s5Agent = s5Assignments.get(prevDay);
        if (s5Agent === agent.id) {
          return false;
        }
      }
    }

    // If assigning to s5, check if same agent has s1 next day already
    if (slot.shift === 's5' && slot.dayIndex < DAYS.length - 1) {
      const nextDay = DAYS[slot.dayIndex + 1].id;
      const s1Assignment = schedule[nextDay]['s1'];
      if (s1Assignment === agent.id) {
        return false;
      }
    }

    return true;
  }

  // Score an agent for a slot
  function scoreAgent(agent: Agent, slot: Slot): number {
    const pref = agent.preferences[slot.day][slot.shift];
    let score = 0;

    // Preference score
    if (pref === 'available') score += 10;
    else if (pref === 'neutral') score += 2;
    // unavailable already filtered out

    // Fairness: prefer agents under their target hours
    const currentHours = assignedHours.get(agent.id)!;
    const targetHours = agent.contractHoursPerWeek;
    const ratio = currentHours / targetHours;

    // Bonus for underworked, penalty for overworked
    if (ratio < 0.8) score += 3;
    else if (ratio < 1.0) score += 1;
    else if (ratio > 1.2) score -= 3;
    else if (ratio > 1.0) score -= 1;

    return score;
  }

  // Assign slots
  for (const slot of slots) {
    const candidates: { agent: Agent; score: number }[] = [];

    for (const agent of agents) {
      if (canAssign(agent, slot)) {
        candidates.push({ agent, score: scoreAgent(agent, slot) });
      }
    }

    if (candidates.length === 0) {
      // No valid candidate, leave unassigned
      continue;
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0].agent;

    // Assign
    schedule[slot.day][slot.shift] = best.id;
    assignedHours.set(
      best.id,
      assignedHours.get(best.id)! + shiftDurationHours(slot.shift)
    );
    agentDayAssignment.get(best.id)!.add(slot.day);

    if (slot.shift === 's5') {
      s5Assignments.set(slot.day, best.id);
    }
  }

  return schedule;
}
