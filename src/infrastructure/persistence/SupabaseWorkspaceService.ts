import { supabase } from '../../lib/supabase';
import type { AppData, WorkspaceMeta } from '../../types';
import { createEmptyAppData, normalizeAppData, createAgent } from '../../types';
import { generateId } from '../../utils';

// Helper to safely extract workspace fields from Supabase join response
interface WorkspaceJoinResult {
  id?: string;
  name?: string;
  created_at?: string;
}

function parseWorkspaceJoin(workspaces: unknown): WorkspaceJoinResult {
  if (workspaces && typeof workspaces === 'object') {
    const ws = workspaces as Record<string, unknown>;
    return {
      id: typeof ws.id === 'string' ? ws.id : undefined,
      name: typeof ws.name === 'string' ? ws.name : undefined,
      created_at: typeof ws.created_at === 'string' ? ws.created_at : undefined,
    };
  }
  return {};
}

/**
 * Service for Supabase workspace operations.
 * Uses async/await pattern for database operations.
 */
export const supabaseWorkspaceService = {
  /**
   * Load workspace data from Supabase.
   */
  async loadWorkspace(workspaceId: string): Promise<AppData | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('data')
      .eq('id', workspaceId)
      .single();

    if (error) {
      console.error('Failed to load workspace:', error);
      return null;
    }

    if (!data?.data) {
      return createEmptyAppData();
    }

    // Normalize the data to ensure it has all required fields
    return normalizeAppData(data.data as AppData);
  },

  /**
   * Save workspace data to Supabase.
   */
  async saveWorkspace(workspaceId: string, appData: AppData): Promise<boolean> {
    const { error } = await supabase
      .from('workspaces')
      .update({ data: appData })
      .eq('id', workspaceId);

    if (error) {
      console.error('Failed to save workspace:', error);
      return false;
    }

    return true;
  },

  /**
   * Get workspace metadata.
   */
  async getWorkspaceMeta(workspaceId: string): Promise<WorkspaceMeta | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, created_at')
      .eq('id', workspaceId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      lastModifiedAt: data.created_at, // Will be updated when we track this
    };
  },

  /**
   * Get all workspaces for a user.
   */
  async getUserWorkspaces(userEmail: string): Promise<WorkspaceMeta[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        workspaces (
          id,
          name,
          created_at
        )
      `)
      .eq('user_email', userEmail.toLowerCase());

    if (error || !data) {
      console.error('Failed to fetch workspaces:', error);
      return [];
    }

    return data.map((row) => {
      const workspace = parseWorkspaceJoin(row.workspaces);
      return {
        id: workspace.id ?? row.workspace_id,
        name: workspace.name ?? 'Unknown',
        createdAt: workspace.created_at ?? new Date().toISOString(),
        lastModifiedAt: workspace.created_at ?? new Date().toISOString(),
      };
    });
  },

  /**
   * Get user's role in a workspace.
   */
  async getUserRole(workspaceId: string, userEmail: string): Promise<'admin' | 'agent' | null> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_email', userEmail.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return data.role as 'admin' | 'agent';
  },

  /**
   * Rename a workspace.
   */
  async renameWorkspace(workspaceId: string, name: string): Promise<boolean> {
    const { error } = await supabase
      .from('workspaces')
      .update({ name: name.trim() })
      .eq('id', workspaceId);

    if (error) {
      console.error('Failed to rename workspace:', error);
      return false;
    }

    return true;
  },

  /**
   * Delete a workspace.
   */
  async deleteWorkspace(workspaceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (error) {
      console.error('Failed to delete workspace:', error);
      return false;
    }

    return true;
  },

  /**
   * Create a new workspace.
   */
  async createWorkspace(
    workspaceId: string,
    name: string,
    createdBy: string,
    data: AppData
  ): Promise<boolean> {
    const { error } = await supabase
      .from('workspaces')
      .insert({
        id: workspaceId,
        name,
        created_by: createdBy,
        data,
      });

    if (error) {
      console.error('Failed to create workspace:', error);
      return false;
    }

    return true;
  },

  /**
   * Add a member to a workspace.
   */
  async addWorkspaceMember(
    workspaceId: string,
    userEmail: string,
    role: 'admin' | 'agent'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_email: userEmail.toLowerCase(),
        role,
      });

    if (error) {
      console.error('Failed to add workspace member:', error);
      return false;
    }

    return true;
  },

  /**
   * Get all members of a workspace.
   */
  async getWorkspaceMembers(workspaceId: string): Promise<{
    user_email: string;
    role: 'admin' | 'agent';
    joined_at: string;
  }[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('user_email, role, joined_at')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Failed to get workspace members:', error);
      return [];
    }

    return (data ?? []) as { user_email: string; role: 'admin' | 'agent'; joined_at: string }[];
  },

  /**
   * Get all pending invites for a workspace.
   */
  async getWorkspaceInvites(workspaceId: string): Promise<{
    id: string;
    user_email: string;
    role: 'admin' | 'agent';
    invited_by: string;
    invited_at: string;
  }[]> {
    const { data, error } = await supabase
      .from('workspace_invites')
      .select('id, user_email, role, invited_by, invited_at')
      .eq('workspace_id', workspaceId)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Failed to get workspace invites:', error);
      return [];
    }

    return (data ?? []) as {
      id: string;
      user_email: string;
      role: 'admin' | 'agent';
      invited_by: string;
      invited_at: string;
    }[];
  },

  /**
   * Get workspace creator email.
   */
  async getWorkspaceCreator(workspaceId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('created_by')
      .eq('id', workspaceId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.created_by;
  },

  /**
   * Update a member's role.
   */
  async updateMemberRole(
    workspaceId: string,
    userEmail: string,
    newRole: 'admin' | 'agent'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('workspace_id', workspaceId)
      .eq('user_email', userEmail.toLowerCase());

    if (error) {
      console.error('Failed to update member role:', error);
      return false;
    }

    return true;
  },

  /**
   * Remove a member from a workspace.
   */
  async removeMember(workspaceId: string, userEmail: string): Promise<boolean> {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_email', userEmail.toLowerCase());

    if (error) {
      console.error('Failed to remove member:', error);
      return false;
    }

    return true;
  },

  /**
   * Get emails that are already members of a workspace.
   */
  async getExistingMemberEmails(workspaceId: string, emails: string[]): Promise<string[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('user_email')
      .eq('workspace_id', workspaceId)
      .in('user_email', emails);

    if (error) {
      console.error('Failed to check existing members:', error);
      return [];
    }

    return (data ?? []).map(m => m.user_email);
  },

  /**
   * Get emails that already have pending invites.
   */
  async getExistingInviteEmails(workspaceId: string, emails: string[]): Promise<string[]> {
    const { data, error } = await supabase
      .from('workspace_invites')
      .select('user_email')
      .eq('workspace_id', workspaceId)
      .in('user_email', emails);

    if (error) {
      console.error('Failed to check existing invites:', error);
      return [];
    }

    return (data ?? []).map(i => i.user_email);
  },

  /**
   * Create multiple invites.
   */
  async createInvites(
    invites: {
      id: string;
      workspace_id: string;
      user_email: string;
      role: 'admin' | 'agent';
      invited_by: string;
    }[]
  ): Promise<boolean> {
    const { error } = await supabase
      .from('workspace_invites')
      .insert(invites);

    if (error) {
      console.error('Failed to create invites:', error);
      return false;
    }

    return true;
  },

  /**
   * Delete an invite.
   */
  async deleteInvite(inviteId: string): Promise<boolean> {
    const { error } = await supabase
      .from('workspace_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      console.error('Failed to delete invite:', error);
      return false;
    }

    return true;
  },

  /**
   * Get user's workspace memberships with workspace names.
   * Used by AuthContext to populate the memberships list.
   */
  async getUserMemberships(userEmail: string): Promise<{
    workspaceId: string;
    workspaceName: string;
    role: 'admin' | 'agent';
  }[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces (
          name
        )
      `)
      .eq('user_email', userEmail.toLowerCase());

    if (error || !data) {
      console.error('Failed to fetch memberships:', error);
      throw error ?? new Error('Failed to fetch memberships');
    }

    return data.map((row) => {
      const workspace = parseWorkspaceJoin(row.workspaces);
      return {
        workspaceId: row.workspace_id,
        workspaceName: workspace.name ?? 'Unknown',
        role: row.role as 'admin' | 'agent',
      };
    });
  },

  /**
   * Get user's pending invites with workspace names.
   * Used by AuthContext to populate the invites list.
   */
  async getUserPendingInvites(userEmail: string): Promise<{
    id: string;
    workspaceId: string;
    workspaceName: string;
    role: 'admin' | 'agent';
    invitedBy: string;
    invitedAt: string;
  }[]> {
    const { data, error } = await supabase
      .from('workspace_invites')
      .select(`
        id,
        workspace_id,
        role,
        invited_by,
        invited_at,
        workspaces (
          name
        )
      `)
      .eq('user_email', userEmail.toLowerCase());

    if (error || !data) {
      console.error('Failed to fetch invites:', error);
      throw error ?? new Error('Failed to fetch invites');
    }

    return data.map((row) => {
      const workspace = parseWorkspaceJoin(row.workspaces);
      return {
        id: row.id,
        workspaceId: row.workspace_id,
        workspaceName: workspace.name ?? 'Unknown',
        role: row.role as 'admin' | 'agent',
        invitedBy: row.invited_by,
        invitedAt: row.invited_at,
      };
    });
  },

  /**
   * Accept invite and create linked agent in one operation.
   * Creates the agent, adds member with linked_agent_id, and deletes invite.
   */
  async acceptInviteWithAgent(
    workspaceId: string,
    userEmail: string,
    role: 'admin' | 'agent',
    agentName: string,
    inviteId: string
  ): Promise<{ success: boolean; agentId?: string }> {
    try {
      // 1. Load current workspace data
      const workspaceData = await this.loadWorkspace(workspaceId);
      if (!workspaceData) {
        console.error('Failed to load workspace data');
        return { success: false };
      }

      // 2. Create new agent
      const agentId = generateId();
      const newAgent = createAgent(agentId, agentName);
      workspaceData.agents.push(newAgent);

      // 3. Save updated workspace data
      const saved = await this.saveWorkspace(workspaceId, workspaceData);
      if (!saved) {
        console.error('Failed to save workspace with new agent');
        return { success: false };
      }

      // 4. Add workspace member with linked_agent_id
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_email: userEmail.toLowerCase(),
          role,
          linked_agent_id: agentId,
        });

      if (memberError) {
        console.error('Failed to add workspace member:', memberError);
        return { success: false };
      }

      // 5. Delete the invite (non-fatal)
      await this.deleteInvite(inviteId);

      return { success: true, agentId };
    } catch (err) {
      console.error('Failed to accept invite with agent:', err);
      return { success: false };
    }
  },
};
