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
} from '../types';
import { createAgent, createEmptyAppData } from '../types';
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
  // Fallback: timestamp + random hex string
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

// Context value type
interface AppContextValue {
  agents: Agent[];
  selectedAgentId: string | null;
  addAgent: (name: string) => Agent;
  renameAgent: (id: string, name: string) => void;
  deleteAgent: (id: string) => void;
  setPreference: (
    agentId: string,
    day: DayOfWeek,
    shift: ShiftId,
    status: PreferenceStatus
  ) => void;
  cyclePreference: (agentId: string, day: DayOfWeek, shift: ShiftId) => void;
  selectAgent: (id: string | null) => void;
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
    setData((prev) => ({
      ...prev,
      agents: prev.agents.filter((agent) => agent.id !== id),
    }));
    setSelectedAgentId((prev) => (prev === id ? null : prev));
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

  const exportData = useCallback((): void => {
    exportToFile(data);
  }, [data]);

  const importData = useCallback((newData: AppData): void => {
    setData(newData);
    setSelectedAgentId(null);
  }, []);

  const value: AppContextValue = {
    agents: data.agents,
    selectedAgentId,
    addAgent,
    renameAgent,
    deleteAgent,
    setPreference,
    cyclePreference,
    selectAgent,
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
