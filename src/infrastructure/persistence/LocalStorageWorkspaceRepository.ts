import type { AppData, WorkspaceRegistry } from '../../types';
import {
  normalizeAppData,
  normalizeWorkspaceRegistry,
  createDefaultRegistry,
  createDefaultWorkspace,
  DEFAULT_WORKSPACE_ID,
} from '../../types';
import type { IWorkspaceRepository } from '../../domain/repositories';

// Storage keys
const REGISTRY_KEY = 'shapeshifter-registry';
const WORKSPACE_KEY_PREFIX = 'shapeshifter_workspace_';
const LEGACY_KEY = 'shapeshifter-data';

/**
 * Get the storage key for a workspace's data.
 */
function getWorkspaceKey(workspaceId: string): string {
  return `${WORKSPACE_KEY_PREFIX}${workspaceId}`;
}

/**
 * LocalStorage implementation of the workspace repository.
 * Manages workspace registry and individual workspace data.
 */
export class LocalStorageWorkspaceRepository implements IWorkspaceRepository {
  loadRegistry(): WorkspaceRegistry | null {
    try {
      const raw = localStorage.getItem(REGISTRY_KEY);
      if (raw === null) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return normalizeWorkspaceRegistry(parsed);
    } catch (error) {
      console.warn('Failed to load workspace registry:', error);
      return null;
    }
  }

  saveRegistry(registry: WorkspaceRegistry): boolean {
    try {
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
      return true;
    } catch (error) {
      console.error('Failed to save workspace registry:', error);
      return false;
    }
  }

  loadWorkspace(workspaceId: string): AppData | null {
    try {
      const key = getWorkspaceKey(workspaceId);
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return normalizeAppData(parsed);
    } catch (error) {
      console.warn(`Failed to load workspace ${workspaceId}:`, error);
      return null;
    }
  }

  saveWorkspace(workspaceId: string, data: AppData): boolean {
    try {
      const key = getWorkspaceKey(workspaceId);
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Failed to save workspace ${workspaceId}:`, error);
      return false;
    }
  }

  deleteWorkspace(workspaceId: string): boolean {
    try {
      const key = getWorkspaceKey(workspaceId);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete workspace ${workspaceId}:`, error);
      return false;
    }
  }

  hasLegacyData(): boolean {
    return localStorage.getItem(LEGACY_KEY) !== null;
  }

  migrateFromLegacy(): WorkspaceRegistry {
    // Check for legacy data
    const legacyRaw = localStorage.getItem(LEGACY_KEY);

    if (legacyRaw !== null) {
      try {
        // Parse and normalize legacy data
        const legacyData = JSON.parse(legacyRaw);
        const normalizedData = normalizeAppData(legacyData);

        // Create default workspace with legacy data
        const defaultWorkspace = createDefaultWorkspace();
        const registry: WorkspaceRegistry = {
          version: 1,
          activeWorkspaceId: DEFAULT_WORKSPACE_ID,
          workspaces: [defaultWorkspace],
        };

        // Save workspace data to new key
        this.saveWorkspace(DEFAULT_WORKSPACE_ID, normalizedData);

        // Save new registry
        this.saveRegistry(registry);

        // Note: We keep legacy data for rollback safety
        // Could add: localStorage.removeItem(LEGACY_KEY);

        console.info('Migrated legacy data to workspace:', DEFAULT_WORKSPACE_ID);
        return registry;
      } catch (error) {
        console.warn('Failed to migrate legacy data, creating fresh workspace:', error);
      }
    }

    // No legacy data or migration failed - create fresh default workspace
    const registry = createDefaultRegistry();
    this.saveRegistry(registry);
    return registry;
  }
}

/**
 * Default singleton instance for the application.
 */
export const workspaceRepository = new LocalStorageWorkspaceRepository();
