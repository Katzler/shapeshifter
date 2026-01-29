import {
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
  WorkspaceMeta,
} from '../types';
import {
  createAgent,
  createEmptyAppData,
  createEmptyWeekSchedule,
} from '../types';
import { getNextPreferenceStatus } from '../domain';
import { fileService } from '../infrastructure';
import { scheduleCalculator } from '../services';
import { generateId } from '../utils';
import { supabaseWorkspaceService } from '../infrastructure/persistence/SupabaseWorkspaceService';
import { useAuth } from './AuthContext';
import { AppContext } from './index';

interface SupabaseAppProviderProps {
  children: ReactNode;
  initialWorkspaceId: string;
}

export function SupabaseAppProvider({ children, initialWorkspaceId }: SupabaseAppProviderProps) {
  const { user, workspaceMemberships, refreshMemberships } = useAuth();

  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [data, setData] = useState<AppData>(createEmptyAppData());
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceMeta | null>(null);

  // Track if this is the initial mount to avoid double-save
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load workspace data on mount or workspace change
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!user?.email) return;

      setLoading(true);
      isInitialMount.current = true;

      try {
        const [workspaceData, meta, role] = await Promise.all([
          supabaseWorkspaceService.loadWorkspace(workspaceId),
          supabaseWorkspaceService.getWorkspaceMeta(workspaceId),
          supabaseWorkspaceService.getUserRole(workspaceId, user.email),
        ]);

        if (cancelled) return;

        setData(workspaceData ?? createEmptyAppData());
        setCurrentWorkspace(meta);
        setUserRole(role);
        setSelectedAgentId(null);
      } catch (err) {
        console.error('Failed to load workspace:', err);
        setSaveError(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, user?.email]);

  // Debounced auto-save when data changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves by 500ms
    saveTimeoutRef.current = setTimeout(async () => {
      const success = await supabaseWorkspaceService.saveWorkspace(workspaceId, data);
      setSaveError(!success);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, workspaceId]);

  // Derive workspaces from memberships
  const workspaces: WorkspaceMeta[] = workspaceMemberships.map((m) => ({
    id: m.workspaceId,
    name: m.workspaceName,
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
  }));

  const dismissSaveError = useCallback(() => {
    setSaveError(false);
  }, []);

  // ==================== Agent Actions ====================

  const addAgent = useCallback((name: string, email?: string): Agent => {
    const id = generateId();
    const agent = createAgent(id, name, email);
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
    const exportPayload = {
      ...data,
      workspaceName: currentWorkspace?.name ?? 'workspace',
    };
    fileService.exportToFile(exportPayload, currentWorkspace?.name ?? 'workspace');
  }, [data, currentWorkspace?.name]);

  const importData = useCallback((newData: AppData): void => {
    setData(newData);
    setSelectedAgentId(null);
  }, []);

  // ==================== Workspace Actions ====================

  const switchWorkspace = useCallback((newWorkspaceId: string): void => {
    if (newWorkspaceId === workspaceId) return;
    setWorkspaceId(newWorkspaceId);
  }, [workspaceId]);

  const renameWorkspace = useCallback(async (targetWorkspaceId: string, name: string): Promise<boolean> => {
    const success = await supabaseWorkspaceService.renameWorkspace(targetWorkspaceId, name);
    if (success) {
      // Refresh memberships to get updated name
      await refreshMemberships();
      if (targetWorkspaceId === workspaceId) {
        setCurrentWorkspace((prev) => prev ? { ...prev, name: name.trim() } : null);
      }
    }
    return success;
  }, [workspaceId, refreshMemberships]);

  // Stub functions for features handled differently in Supabase mode
  // These throw errors to surface accidental usage during development
  const createWorkspace = useCallback((): null => {
    throw new Error('createWorkspace not available in Supabase mode - use CreateWorkspace component instead');
  }, []);

  const deleteWorkspace = useCallback((): void => {
    throw new Error('deleteWorkspace not available in Supabase mode - use workspace settings instead');
  }, []);

  const importAsNewWorkspace = useCallback((): null => {
    throw new Error('importAsNewWorkspace not available in Supabase mode');
  }, []);

  // Show loading state while data loads
  if (loading) {
    return (
      <AppContext.Provider value={null as never}>
        <div className="loading-screen">
          <div className="loading-spinner" />
        </div>
      </AppContext.Provider>
    );
  }

  const value = {
    agents: data.agents,
    schedule: data.schedule,
    selectedAgentId,
    saveError,
    currentWorkspace: currentWorkspace ?? {
      id: workspaceId,
      name: 'Workspace',
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    },
    workspaces,
    userRole,
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
