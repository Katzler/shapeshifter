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
import { createAgent, createEmptyAppData, createEmptyWeekSchedule } from '../types';
import { getNextPreferenceStatus } from '../domain';
import { appDataRepository, fileService } from '../infrastructure';
import { scheduleCalculator } from '../services';
import { generateId } from '../utils';

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
    const loaded = appDataRepository.load();
    return loaded ?? createEmptyAppData();
  });
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Auto-save whenever data changes
  useEffect(() => {
    appDataRepository.save(data);
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
    setData((prev) => ({
      ...prev,
      agents: prev.agents.filter((agent) => agent.id !== id),
      schedule: scheduleCalculator.removeAgentFromSchedule(prev.schedule, id),
    }));
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
          const nextStatus = getNextPreferenceStatus(currentStatus);
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
    setData((prev) => ({
      ...prev,
      schedule: scheduleCalculator.generateOptimizedSchedule(prev.agents),
    }));
  }, []);

  const exportData = useCallback((): void => {
    fileService.exportToFile(data);
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
