import { supabase } from '../../lib/supabase';
import type { SwapRequest, SwapOffer, DayOfWeek, ShiftId, SwapType } from '../../types';

// Database row types (snake_case)
interface SwapRequestRow {
  id: string;
  workspace_id: string;
  day: string;
  shift_id: string;
  from_agent_id: string;
  from_agent_email: string;
  type: string;
  status: string;
  note: string | null;
  to_agent_id: string | null;
  to_agent_email: string | null;
  to_day: string | null;
  to_shift_id: string | null;
  created_at: string;
  claimed_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  denial_reason: string | null;
}

interface SwapOfferRow {
  id: string;
  swap_request_id: string;
  from_agent_id: string;
  from_agent_email: string;
  day: string;
  shift_id: string;
  note: string | null;
  created_at: string;
}

// Convert database row to SwapRequest
function rowToSwapRequest(row: SwapRequestRow): SwapRequest {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    day: row.day as DayOfWeek,
    shiftId: row.shift_id as ShiftId,
    fromAgentId: row.from_agent_id,
    fromAgentEmail: row.from_agent_email,
    type: row.type as SwapType,
    status: row.status as SwapRequest['status'],
    note: row.note ?? undefined,
    toAgentId: row.to_agent_id ?? undefined,
    toAgentEmail: row.to_agent_email ?? undefined,
    toDay: row.to_day as DayOfWeek | undefined,
    toShiftId: row.to_shift_id as ShiftId | undefined,
    createdAt: row.created_at,
    claimedAt: row.claimed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    denialReason: row.denial_reason ?? undefined,
  };
}

// Convert database row to SwapOffer
function rowToSwapOffer(row: SwapOfferRow): SwapOffer {
  return {
    id: row.id,
    swapRequestId: row.swap_request_id,
    fromAgentId: row.from_agent_id,
    fromAgentEmail: row.from_agent_email,
    day: row.day as DayOfWeek,
    shiftId: row.shift_id as ShiftId,
    note: row.note ?? undefined,
    createdAt: row.created_at,
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
   * Get all offers for swap requests
   */
  async getSwapOffers(swapRequestIds: string[]): Promise<Record<string, SwapOffer[]>> {
    if (swapRequestIds.length === 0) return {};

    const { data, error } = await supabase
      .from('swap_offers')
      .select('*')
      .in('swap_request_id', swapRequestIds)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to get swap offers:', error);
      return {};
    }

    const result: Record<string, SwapOffer[]> = {};
    for (const row of data as SwapOfferRow[]) {
      const offer = rowToSwapOffer(row);
      if (!result[offer.swapRequestId]) {
        result[offer.swapRequestId] = [];
      }
      result[offer.swapRequestId].push(offer);
    }
    return result;
  },

  /**
   * Create a new swap request
   */
  async createSwapRequest(
    id: string,
    workspaceId: string,
    day: DayOfWeek,
    shiftId: ShiftId,
    fromAgentId: string,
    fromAgentEmail: string,
    type: SwapType,
    note?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('swap_requests')
      .insert({
        id,
        workspace_id: workspaceId,
        day,
        shift_id: shiftId,
        from_agent_id: fromAgentId,
        from_agent_email: fromAgentEmail,
        type,
        note: note ?? null,
        status: 'pending',
      });

    if (error) {
      console.error('Failed to create swap request:', error);
      return false;
    }
    return true;
  },

  /**
   * Create a trade offer on an existing swap request
   */
  async createSwapOffer(
    id: string,
    swapRequestId: string,
    fromAgentId: string,
    fromAgentEmail: string,
    day: DayOfWeek,
    shiftId: ShiftId,
    note?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('swap_offers')
      .insert({
        id,
        swap_request_id: swapRequestId,
        from_agent_id: fromAgentId,
        from_agent_email: fromAgentEmail,
        day,
        shift_id: shiftId,
        note: note ?? null,
      });

    if (error) {
      console.error('Failed to create swap offer:', error);
      return false;
    }
    return true;
  },

  /**
   * Accept a trade offer (original poster accepts someone's offer)
   */
  async acceptOffer(swapRequestId: string, offer: SwapOffer): Promise<boolean> {
    const { error } = await supabase
      .from('swap_requests')
      .update({
        status: 'awaiting_approval',
        to_agent_id: offer.fromAgentId,
        to_agent_email: offer.fromAgentEmail,
        to_day: offer.day,
        to_shift_id: offer.shiftId,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', swapRequestId);

    if (error) {
      console.error('Failed to accept offer:', error);
      return false;
    }
    return true;
  },

  /**
   * Claim a giveaway shift (first-come-first-served)
   */
  async claimGiveaway(
    swapRequestId: string,
    toAgentId: string,
    toAgentEmail: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('swap_requests')
      .update({
        status: 'awaiting_approval',
        to_agent_id: toAgentId,
        to_agent_email: toAgentEmail,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', swapRequestId)
      .eq('status', 'pending'); // Only if still pending (first-come-first-served)

    if (error) {
      console.error('Failed to claim giveaway:', error);
      return false;
    }
    return true;
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
   * Cancel a swap request (only by original poster)
   */
  async cancelSwap(swapRequestId: string): Promise<boolean> {
    const { error } = await supabase
      .from('swap_requests')
      .update({
        status: 'cancelled',
      })
      .eq('id', swapRequestId);

    if (error) {
      console.error('Failed to cancel swap:', error);
      return false;
    }
    return true;
  },

  /**
   * Delete a swap offer
   */
  async deleteSwapOffer(offerId: string): Promise<boolean> {
    const { error } = await supabase
      .from('swap_offers')
      .delete()
      .eq('id', offerId);

    if (error) {
      console.error('Failed to delete swap offer:', error);
      return false;
    }
    return true;
  },
};
