import { supabase } from '../../lib/supabase';
import type { SwapRequest, DayOfWeek, ShiftId, SwapStatus } from '../../types';

// Database row type (snake_case)
interface SwapRequestRow {
  id: string;
  workspace_id: string;
  day: string;
  shift_id: string;
  from_agent: string;
  note: string | null;
  claimed_by: string | null;
  claim_note: string | null;
  claimed_at: string | null;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  denial_reason: string | null;
}

// Convert database row to SwapRequest
function rowToSwapRequest(row: SwapRequestRow): SwapRequest {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    day: row.day as DayOfWeek,
    shiftId: row.shift_id as ShiftId,
    fromAgent: row.from_agent,
    note: row.note ?? undefined,
    claimedBy: row.claimed_by ?? undefined,
    claimNote: row.claim_note ?? undefined,
    claimedAt: row.claimed_at ?? undefined,
    status: row.status as SwapStatus,
    createdAt: row.created_at,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    denialReason: row.denial_reason ?? undefined,
  };
}

export const swapService = {
  /**
   * Get all swap requests for a workspace
   */
  async getSwapRequests(workspaceId: string): Promise<SwapRequest[]> {
    const { data, error } = await supabase
      .from('swap_requests')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get swap requests:', error);
      return [];
    }

    return (data as SwapRequestRow[]).map(rowToSwapRequest);
  },

  /**
   * Create a new swap request (make shift available)
   */
  async createSwapRequest(
    id: string,
    workspaceId: string,
    day: DayOfWeek,
    shiftId: ShiftId,
    fromAgent: string,
    note?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('swap_requests')
      .insert({
        id,
        workspace_id: workspaceId,
        day,
        shift_id: shiftId,
        from_agent: fromAgent,
        note: note ?? null,
        status: 'available',
      });

    if (error) {
      console.error('Failed to create swap request:', error);
      return false;
    }
    return true;
  },

  /**
   * Claim an available shift (first-come-first-served)
   */
  async claimShift(
    swapRequestId: string,
    claimedBy: string,
    claimNote?: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('swap_requests')
      .update({
        status: 'claimed',
        claimed_by: claimedBy,
        claim_note: claimNote ?? null,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', swapRequestId)
      .eq('status', 'available') // Only if still available (first-come-first-served)
      .select();

    if (error) {
      console.error('Failed to claim shift:', error);
      return false;
    }

    // Check if update actually happened (row was still available)
    return data && data.length > 0;
  },

  /**
   * Admin approves a swap
   */
  async approveSwap(swapRequestId: string, adminEmail: string): Promise<boolean> {
    const { error } = await supabase
      .from('swap_requests')
      .update({
        status: 'approved',
        reviewed_by: adminEmail,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', swapRequestId);

    if (error) {
      console.error('Failed to approve swap:', error);
      return false;
    }
    return true;
  },

  /**
   * Admin denies a swap
   */
  async denySwap(swapRequestId: string, adminEmail: string, reason?: string): Promise<boolean> {
    const { error } = await supabase
      .from('swap_requests')
      .update({
        status: 'denied',
        reviewed_by: adminEmail,
        reviewed_at: new Date().toISOString(),
        denial_reason: reason ?? null,
      })
      .eq('id', swapRequestId);

    if (error) {
      console.error('Failed to deny swap:', error);
      return false;
    }
    return true;
  },

  /**
   * Cancel a swap request (only if not yet claimed)
   */
  async cancelSwap(swapRequestId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('swap_requests')
      .update({
        status: 'cancelled',
      })
      .eq('id', swapRequestId)
      .eq('status', 'available') // Can only cancel if still available
      .select();

    if (error) {
      console.error('Failed to cancel swap:', error);
      return false;
    }

    return data && data.length > 0;
  },

  /**
   * Get linked agent ID for a workspace member
   */
  async getLinkedAgentId(workspaceId: string, userEmail: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('linked_agent_id')
      .eq('workspace_id', workspaceId)
      .eq('user_email', userEmail.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return data.linked_agent_id;
  },

  /**
   * Link a workspace member to a schedule agent
   */
  async linkAgentToMember(
    workspaceId: string,
    userEmail: string,
    agentId: string | null
  ): Promise<boolean> {
    const { error } = await supabase
      .from('workspace_members')
      .update({
        linked_agent_id: agentId,
      })
      .eq('workspace_id', workspaceId)
      .eq('user_email', userEmail.toLowerCase());

    if (error) {
      console.error('Failed to link agent to member:', error);
      return false;
    }
    return true;
  },
};
