/**
 * Workspace types for multi-team support.
 */

// Workspace metadata (lightweight, stored in registry)
export interface WorkspaceMeta {
  id: string;
  name: string;
  createdAt: string;      // ISO 8601 timestamp
  lastModifiedAt: string; // ISO 8601 timestamp
}

// Registry of all workspaces
export interface WorkspaceRegistry {
  version: number;
  activeWorkspaceId: string;
  workspaces: WorkspaceMeta[];
}

// Current registry schema version
export const WORKSPACE_REGISTRY_VERSION = 1;

// Default workspace constants
export const DEFAULT_WORKSPACE_ID = 'default';
export const DEFAULT_WORKSPACE_NAME = 'My Team';

// Maximum number of workspaces allowed
export const MAX_WORKSPACES = 20;

/**
 * Create a new workspace metadata object.
 */
export function createWorkspaceMeta(id: string, name: string): WorkspaceMeta {
  const now = new Date().toISOString();
  return {
    id,
    name: name.trim() || 'New Team',
    createdAt: now,
    lastModifiedAt: now,
  };
}

/**
 * Create the default workspace for first-time users or migration.
 */
export function createDefaultWorkspace(): WorkspaceMeta {
  return createWorkspaceMeta(DEFAULT_WORKSPACE_ID, DEFAULT_WORKSPACE_NAME);
}

/**
 * Create a new registry with the default workspace.
 */
export function createDefaultRegistry(): WorkspaceRegistry {
  return {
    version: WORKSPACE_REGISTRY_VERSION,
    activeWorkspaceId: DEFAULT_WORKSPACE_ID,
    workspaces: [createDefaultWorkspace()],
  };
}

/**
 * Normalize a workspace registry from unknown input.
 * Returns null if invalid and unrecoverable.
 */
export function normalizeWorkspaceRegistry(input: unknown): WorkspaceRegistry | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const obj = input as Record<string, unknown>;

  // Must have workspaces array
  if (!Array.isArray(obj.workspaces) || obj.workspaces.length === 0) {
    return null;
  }

  // Normalize workspaces
  const workspaces: WorkspaceMeta[] = [];
  for (const ws of obj.workspaces) {
    const normalized = normalizeWorkspaceMeta(ws);
    if (normalized) {
      workspaces.push(normalized);
    }
  }

  if (workspaces.length === 0) {
    return null;
  }

  // Validate activeWorkspaceId
  let activeWorkspaceId = typeof obj.activeWorkspaceId === 'string'
    ? obj.activeWorkspaceId
    : workspaces[0].id;

  // Ensure active workspace exists
  if (!workspaces.some(w => w.id === activeWorkspaceId)) {
    activeWorkspaceId = workspaces[0].id;
  }

  return {
    version: WORKSPACE_REGISTRY_VERSION,
    activeWorkspaceId,
    workspaces,
  };
}

/**
 * Normalize a workspace metadata object from unknown input.
 */
function normalizeWorkspaceMeta(input: unknown): WorkspaceMeta | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const obj = input as Record<string, unknown>;

  // id and name are required
  if (typeof obj.id !== 'string' || obj.id.trim() === '') {
    return null;
  }
  if (typeof obj.name !== 'string' || obj.name.trim() === '') {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: obj.id,
    name: obj.name,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : now,
    lastModifiedAt: typeof obj.lastModifiedAt === 'string' ? obj.lastModifiedAt : now,
  };
}
