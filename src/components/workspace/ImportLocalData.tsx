import { useState, useEffect } from 'react';
import { supabaseWorkspaceService } from '../../infrastructure/persistence/SupabaseWorkspaceService';
import { useAuth } from '../../store/AuthContext';
import { generateId } from '../../utils';
import { normalizeAppData } from '../../types';
import type { AppData, WorkspaceRegistry } from '../../types';
import './ImportLocalData.css';

const REGISTRY_KEY = 'shapeshifter-registry';
const LEGACY_KEY = 'shapeshifter-data';

interface LocalWorkspace {
  id: string;
  name: string;
  data: AppData;
}

interface ImportLocalDataProps {
  onComplete: () => void;
}

export function ImportLocalData({ onComplete }: ImportLocalDataProps) {
  const { user } = useAuth();
  const [localWorkspaces, setLocalWorkspaces] = useState<LocalWorkspace[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load local workspaces on mount
  useEffect(() => {
    const workspaces: LocalWorkspace[] = [];

    // Check for registry-based workspaces
    try {
      const registryJson = localStorage.getItem(REGISTRY_KEY);
      if (registryJson) {
        const registry: WorkspaceRegistry = JSON.parse(registryJson);
        for (const meta of registry.workspaces) {
          const dataJson = localStorage.getItem(`shapeshifter_workspace_${meta.id}`);
          if (dataJson) {
            const data = normalizeAppData(JSON.parse(dataJson));
            workspaces.push({
              id: meta.id,
              name: meta.name,
              data,
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse registry:', e);
    }

    // Check for legacy single-workspace data
    try {
      const legacyJson = localStorage.getItem(LEGACY_KEY);
      if (legacyJson && workspaces.length === 0) {
        const data = normalizeAppData(JSON.parse(legacyJson));
        workspaces.push({
          id: 'legacy',
          name: 'My Workspace',
          data,
        });
      }
    } catch (e) {
      console.error('Failed to parse legacy data:', e);
    }

    setLocalWorkspaces(workspaces);
    // Select all by default
    setSelectedIds(new Set(workspaces.map(w => w.id)));
  }, []);

  const handleToggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (!user?.email || selectedIds.size === 0) return;

    setLoading(true);
    setError(null);

    const userEmail = user.email.toLowerCase();
    const toImport = localWorkspaces.filter(w => selectedIds.has(w.id));
    const importedIds: string[] = [];
    const failedNames: string[] = [];

    for (const workspace of toImport) {
      const workspaceId = generateId();

      try {
        // Create workspace in Supabase
        const workspaceCreated = await supabaseWorkspaceService.createWorkspace(
          workspaceId,
          workspace.name,
          userEmail,
          workspace.data
        );

        if (!workspaceCreated) {
          failedNames.push(workspace.name);
          continue;
        }

        // Add user as admin
        const memberAdded = await supabaseWorkspaceService.addWorkspaceMember(
          workspaceId,
          userEmail,
          'admin'
        );

        if (!memberAdded) {
          // Rollback workspace creation
          await supabaseWorkspaceService.deleteWorkspace(workspaceId);
          failedNames.push(workspace.name);
          continue;
        }

        importedIds.push(workspace.id);
      } catch (err) {
        console.error(`Failed to import workspace ${workspace.name}:`, err);
        failedNames.push(workspace.name);
      }
    }

    if (importedIds.length > 0) {
      // Only clear localStorage for successfully imported workspaces
      clearLocalStorageForIds(importedIds);
    }

    if (failedNames.length > 0) {
      if (importedIds.length > 0) {
        setError(`Imported ${importedIds.length} workspace(s). Failed: ${failedNames.join(', ')}`);
      } else {
        setError(`Failed to import: ${failedNames.join(', ')}`);
      }
      setLoading(false);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    clearLocalStorage();
    onComplete();
  };

  const clearLocalStorageForIds = (ids: string[]) => {
    // Remove specific workspace data
    for (const id of ids) {
      localStorage.removeItem(`shapeshifter_workspace_${id}`);
    }

    // Update or clear registry
    try {
      const registryJson = localStorage.getItem(REGISTRY_KEY);
      if (registryJson) {
        const registry: WorkspaceRegistry = JSON.parse(registryJson);
        registry.workspaces = registry.workspaces.filter(w => !ids.includes(w.id));
        if (registry.workspaces.length === 0) {
          localStorage.removeItem(REGISTRY_KEY);
        } else {
          localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
        }
      }
    } catch (e) {
      console.error('Failed to update registry:', e);
    }

    // Clear legacy key if 'legacy' was imported
    if (ids.includes('legacy')) {
      localStorage.removeItem(LEGACY_KEY);
    }
  };

  const clearLocalStorage = () => {
    // Clear registry
    localStorage.removeItem(REGISTRY_KEY);
    localStorage.removeItem(LEGACY_KEY);

    // Clear workspace data
    for (const workspace of localWorkspaces) {
      localStorage.removeItem(`shapeshifter_workspace_${workspace.id}`);
    }
  };

  const getAgentCount = (data: AppData) => data.agents?.length ?? 0;

  if (localWorkspaces.length === 0) {
    return null; // No local data to import
  }

  return (
    <div className="import-local-page">
      <div className="import-local-card">
        <h1>Import Existing Data?</h1>
        <p className="import-local-subtitle">
          We found local data from a previous session. Would you like to import it?
        </p>

        {error && <div className="import-error">{error}</div>}

        <div className="import-list">
          {localWorkspaces.map(workspace => (
            <label key={workspace.id} className="import-item">
              <input
                type="checkbox"
                checked={selectedIds.has(workspace.id)}
                onChange={() => handleToggle(workspace.id)}
                disabled={loading}
              />
              <div className="import-item-info">
                <div className="import-item-name">{workspace.name}</div>
                <div className="import-item-meta">
                  {getAgentCount(workspace.data)} agent(s)
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="import-actions">
          <button
            className="btn-skip"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip
          </button>
          <button
            className="btn-import"
            onClick={handleImport}
            disabled={loading || selectedIds.size === 0}
          >
            {loading ? 'Importing...' : `Import ${selectedIds.size} workspace(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to check if there's local data to import
export function hasLocalData(): boolean {
  return !!(localStorage.getItem(REGISTRY_KEY) || localStorage.getItem(LEGACY_KEY));
}
