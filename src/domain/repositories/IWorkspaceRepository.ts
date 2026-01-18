import type { AppData, WorkspaceRegistry } from '../../types';

/**
 * Repository interface for workspace management.
 * Handles registry and individual workspace data persistence.
 */
export interface IWorkspaceRepository {
  /**
   * Load the workspace registry.
   * @returns The registry, or null if none exists
   */
  loadRegistry(): WorkspaceRegistry | null;

  /**
   * Save the workspace registry.
   * @param registry - The registry to persist
   * @returns true if save succeeded, false if it failed
   */
  saveRegistry(registry: WorkspaceRegistry): boolean;

  /**
   * Load data for a specific workspace.
   * @param workspaceId - The workspace ID
   * @returns The workspace data, or null if none exists
   */
  loadWorkspace(workspaceId: string): AppData | null;

  /**
   * Save data for a specific workspace.
   * @param workspaceId - The workspace ID
   * @param data - The data to persist
   * @returns true if save succeeded, false if it failed
   */
  saveWorkspace(workspaceId: string, data: AppData): boolean;

  /**
   * Delete a workspace's data from storage.
   * @param workspaceId - The workspace ID to delete
   * @returns true if deletion succeeded
   */
  deleteWorkspace(workspaceId: string): boolean;

  /**
   * Check if legacy single-workspace data exists.
   * @returns true if legacy data exists
   */
  hasLegacyData(): boolean;

  /**
   * Migrate from legacy single-workspace format.
   * Creates default workspace with existing data, or empty if no data.
   * @returns The new registry after migration
   */
  migrateFromLegacy(): WorkspaceRegistry;
}
