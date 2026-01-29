import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type {
  Agent,
  AppData,
  DayOfWeek,
  ShiftId,
  PreferenceStatus,
  WeekSchedule,
  WorkspaceMeta,
  WorkspaceRegistry,
} from '../types';
import {
  createAgent,
  createEmptyAppData,
  createEmptyWeekSchedule,
  createWorkspaceMeta,
  MAX_WORKSPACES,
} from '../types';
import { getNextPreferenceStatus } from '../domain';
import { workspaceRepository, fileService } from '../infrastructure';
import { scheduleCalculator } from '../services';
import { generateId } from '../utils';

// Context value type
interface AppContextValue {
  // Existing state
  agents: Agent[];
  schedule: WeekSchedule;
  selectedAgentId: string | null;
  saveError: boolean;

  // Workspace state
  currentWorkspace: WorkspaceMeta;
  workspaces: WorkspaceMeta[];
  userRole: 'admin' | 'agent' | null;

  // Existing actions
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
  dismissSaveError: () => void;

  // Workspace actions
  createWorkspace: (name: string) => WorkspaceMeta | null;
  switchWorkspace: (workspaceId: string) => void;
  renameWorkspace: (workspaceId: string, name: string) => void;
  deleteWorkspace: (workspaceId: string) => void;
  importAsNewWorkspace: (data: AppData, name: string) => WorkspaceMeta | null;
  refreshWorkspaceData?: () => Promise<void>;
}

// Export the context so SupabaseAppProvider can also use it
export const AppContext = createContext<AppContextValue | null>(null);

// Export the context value type for type safety
export type { AppContextValue };

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Initialize registry (with migration if needed)
  const [registry, setRegistry] = useState<WorkspaceRegistry>(() => {
    const loaded = workspaceRepository.loadRegistry();
    if (loaded) {
      return loaded;
    }
    // Migrate from legacy or create fresh
    return workspaceRepository.migrateFromLegacy();
  });

  // Initialize data from active workspace
  const [data, setData] = useState<AppData>(() => {
    const loaded = workspaceRepository.loadWorkspace(registry.activeWorkspaceId);
    return loaded ?? createEmptyAppData();
  });

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  // Track if this is the initial mount to avoid double-save
  const isInitialMount = useRef(true);

  // Auto-save workspace data when it changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const success = workspaceRepository.saveWorkspace(registry.activeWorkspaceId, data);
    setSaveError(!success);

    // Update lastModifiedAt in registry
    if (success) {
      setRegistry((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((w) =>
          w.id === prev.activeWorkspaceId
            ? { ...w, lastModifiedAt: new Date().toISOString() }
            : w
        ),
      }));
    }
  }, [data, registry.activeWorkspaceId]);

  // Save registry when it changes
  useEffect(() => {
    workspaceRepository.saveRegistry(registry);
  }, [registry]);

  // Derived workspace values
  const currentWorkspace = registry.workspaces.find(
    (w) => w.id === registry.activeWorkspaceId
  ) ?? registry.workspaces[0];

  const workspaces = registry.workspaces;

  const dismissSaveError = useCallback(() => {
    setSaveError(false);
  }, []);

  // ==================== Agent Actions ====================

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

  // ==================== Schedule Actions ====================

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

  // ==================== Import/Export Actions ====================

  const exportData = useCallback((): void => {
    // Include workspace name in export
    const exportPayload = {
      ...data,
      workspaceName: currentWorkspace.name,
    };
    fileService.exportToFile(exportPayload, currentWorkspace.name);
  }, [data, currentWorkspace.name]);

  const importData = useCallback((newData: AppData): void => {
    setData(newData);
    setSelectedAgentId(null);
  }, []);

  // ==================== Workspace Actions ====================

  const createWorkspace = useCallback((name: string): WorkspaceMeta | null => {
    if (registry.workspaces.length >= MAX_WORKSPACES) {
      console.warn(`Maximum workspaces (${MAX_WORKSPACES}) reached`);
      return null;
    }

    const id = generateId();
    const newWorkspace = createWorkspaceMeta(id, name);
    const emptyData = createEmptyAppData();

    // Save empty data for new workspace
    workspaceRepository.saveWorkspace(id, emptyData);

    // Add to registry and switch to it
    setRegistry((prev) => ({
      ...prev,
      activeWorkspaceId: id,
      workspaces: [...prev.workspaces, newWorkspace],
    }));

    // Load empty data for new workspace
    setData(emptyData);
    setSelectedAgentId(null);

    return newWorkspace;
  }, [registry.workspaces.length]);

  const switchWorkspace = useCallback((workspaceId: string): void => {
    if (workspaceId === registry.activeWorkspaceId) {
      return; // Already active
    }

    // Current data is auto-saved via useEffect
    // Update active workspace
    setRegistry((prev) => ({
      ...prev,
      activeWorkspaceId: workspaceId,
    }));

    // Load new workspace data
    const newData = workspaceRepository.loadWorkspace(workspaceId) ?? createEmptyAppData();
    setData(newData);
    setSelectedAgentId(null);
  }, [registry.activeWorkspaceId]);

  const renameWorkspace = useCallback((workspaceId: string, name: string): void => {
    setRegistry((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, name: name.trim() || w.name, lastModifiedAt: new Date().toISOString() }
          : w
      ),
    }));
  }, []);

  const deleteWorkspace = useCallback((workspaceId: string): void => {
    // Cannot delete the last workspace
    if (registry.workspaces.length <= 1) {
      console.warn('Cannot delete the last workspace');
      return;
    }

    const wasActive = registry.activeWorkspaceId === workspaceId;
    const remainingWorkspaces = registry.workspaces.filter((w) => w.id !== workspaceId);

    // If deleting active workspace, switch to first remaining
    if (wasActive) {
      const newActiveId = remainingWorkspaces[0].id;
      const newData = workspaceRepository.loadWorkspace(newActiveId) ?? createEmptyAppData();
      setData(newData);
      setSelectedAgentId(null);
    }

    // Update registry
    setRegistry((prev) => ({
      ...prev,
      activeWorkspaceId: wasActive ? remainingWorkspaces[0].id : prev.activeWorkspaceId,
      workspaces: remainingWorkspaces,
    }));

    // Delete storage
    workspaceRepository.deleteWorkspace(workspaceId);
  }, [registry.workspaces.length, registry.activeWorkspaceId]);

  const importAsNewWorkspace = useCallback((newData: AppData, name: string): WorkspaceMeta | null => {
    if (registry.workspaces.length >= MAX_WORKSPACES) {
      console.warn(`Maximum workspaces (${MAX_WORKSPACES}) reached`);
      return null;
    }

    const id = generateId();
    const newWorkspace = createWorkspaceMeta(id, name);

    // Save imported data for new workspace
    workspaceRepository.saveWorkspace(id, newData);

    // Add to registry and switch to it
    setRegistry((prev) => ({
      ...prev,
      activeWorkspaceId: id,
      workspaces: [...prev.workspaces, newWorkspace],
    }));

    // Load the imported data
    setData(newData);
    setSelectedAgentId(null);

    return newWorkspace;
  }, [registry.workspaces.length]);

  const value: AppContextValue = {
    agents: data.agents,
    schedule: data.schedule,
    selectedAgentId,
    saveError,
    currentWorkspace,
    workspaces,
    userRole: 'admin', // localStorage mode is always single-user admin
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
    dismissSaveError,
    createWorkspace,
    switchWorkspace,
    renameWorkspace,
    deleteWorkspace,
    importAsNewWorkspace,
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
