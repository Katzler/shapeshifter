import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../store';
import { useAuth } from '../../store/AuthContext';
import { swapService } from '../../infrastructure/persistence/SwapService';
import { generateId } from '../../utils';
import type { SwapRequest, DayOfWeek, ShiftId } from '../../types';
import { formatShiftDisplay, DAYS, SHIFTS } from '../../types';
import './SwapsGrid.css';

type SwapTab = 'available' | 'awaiting' | 'history';

export function SwapsGrid() {
  const { agents, schedule, currentWorkspace, userRole, setScheduleAssignment } = useApp();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<SwapTab>('available');
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkedAgentId, setLinkedAgentId] = useState<string | null>(null);

  // Modal states
  const [showPostModal, setShowPostModal] = useState(false);
  const [postingSwap, setPostingSwap] = useState(false);

  const currentUserEmail = user?.email?.toLowerCase();
  const isAdmin = userRole === 'admin';

  // Load linked agent for current user
  useEffect(() => {
    if (!currentWorkspace?.id || !currentUserEmail) return;

    swapService.getLinkedAgentId(currentWorkspace.id, currentUserEmail)
      .then(setLinkedAgentId);
  }, [currentWorkspace?.id, currentUserEmail]);

  // Load swap data
  const loadSwaps = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setLoading(true);
    setError(null);

    try {
      const requests = await swapService.getSwapRequests(currentWorkspace.id);
      setSwapRequests(requests);
    } catch (err) {
      console.error('Failed to load swaps:', err);
      setError('Failed to load swap requests');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadSwaps();
  }, [loadSwaps]);

  // Get agent name by ID
  const getAgentName = (agentId: string | undefined) => {
    if (!agentId) return 'Unknown';
    return agents.find(a => a.id === agentId)?.name ?? agentId;
  };

  // Get linked agent's name
  const getLinkedAgentName = () => {
    if (!linkedAgentId) return null;
    return agents.find(a => a.id === linkedAgentId)?.name ?? null;
  };

  // Get shifts assigned to current user's linked agent
  const getUserAssignedShifts = (): { day: DayOfWeek; shiftId: ShiftId }[] => {
    if (!linkedAgentId) return [];

    const assigned: { day: DayOfWeek; shiftId: ShiftId }[] = [];
    for (const day of DAYS) {
      for (const shift of SHIFTS) {
        if (schedule[day.id][shift.id] === linkedAgentId) {
          assigned.push({ day: day.id, shiftId: shift.id });
        }
      }
    }
    return assigned;
  };

  // Filter requests by tab
  const availableRequests = swapRequests.filter(r => r.status === 'available');
  const awaitingRequests = swapRequests.filter(r => r.status === 'claimed');
  const historyRequests = swapRequests.filter(r =>
    r.status === 'approved' || r.status === 'denied' || r.status === 'cancelled'
  ).slice(0, 10);

  // Post a new swap request (make shift available)
  const handlePostSwap = async (
    day: DayOfWeek,
    shiftId: ShiftId,
    note?: string
  ) => {
    const agentName = getLinkedAgentName();
    if (!agentName || !currentWorkspace?.id) return;

    setPostingSwap(true);
    const success = await swapService.createSwapRequest(
      generateId(),
      currentWorkspace.id,
      day,
      shiftId,
      agentName,
      note
    );

    if (success) {
      setShowPostModal(false);
      await loadSwaps();
    } else {
      setError('Failed to post swap request');
    }
    setPostingSwap(false);
  };

  // Claim an available shift
  const handleClaimShift = async (swapRequest: SwapRequest, claimNote?: string) => {
    const agentName = getLinkedAgentName();
    if (!agentName) {
      setError('You must be linked to a schedule agent to claim shifts');
      return;
    }

    const success = await swapService.claimShift(
      swapRequest.id,
      agentName,
      claimNote
    );

    if (success) {
      await loadSwaps();
    } else {
      setError('Failed to claim shift - it may have already been taken');
    }
  };

  // Admin approve swap
  const handleApprove = async (swapRequest: SwapRequest) => {
    if (!currentUserEmail) return;

    const success = await swapService.approveSwap(swapRequest.id, currentUserEmail);
    if (success) {
      // Update the schedule: reassign shift from original agent to claimer
      const claimerAgent = agents.find(a => a.name === swapRequest.claimedBy);
      if (claimerAgent) {
        setScheduleAssignment(swapRequest.day, swapRequest.shiftId, claimerAgent.id);
      }
      await loadSwaps();
    } else {
      setError('Failed to approve swap');
    }
  };

  // Admin deny swap
  const handleDeny = async (swapRequest: SwapRequest, reason?: string) => {
    if (!currentUserEmail) return;

    const success = await swapService.denySwap(swapRequest.id, currentUserEmail, reason);
    if (success) {
      await loadSwaps();
    } else {
      setError('Failed to deny swap');
    }
  };

  // Cancel own swap (only if still available)
  const handleCancel = async (swapRequest: SwapRequest) => {
    const success = await swapService.cancelSwap(swapRequest.id);
    if (success) {
      await loadSwaps();
    } else {
      setError('Failed to cancel swap - it may have already been claimed');
    }
  };

  // Format relative time
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderAvailableCard = (request: SwapRequest) => {
    const isOwnRequest = linkedAgentId && getAgentName(linkedAgentId) === request.fromAgent;

    return (
      <div key={request.id} className="swap-card">
        <div className="swap-card__header">
          <span className="swap-card__shift">{formatShiftDisplay(request.day, request.shiftId)}</span>
        </div>
        <div className="swap-card__meta">
          From: {request.fromAgent} · Posted {formatTimeAgo(request.createdAt)}
        </div>
        {request.note && <div className="swap-card__note">"{request.note}"</div>}

        <div className="swap-card__actions">
          {isOwnRequest ? (
            <button className="btn-cancel" onClick={() => handleCancel(request)}>
              Cancel
            </button>
          ) : (
            <button
              className="btn-claim"
              onClick={() => handleClaimShift(request)}
              disabled={!linkedAgentId}
              title={!linkedAgentId ? 'You must be linked to a schedule agent' : undefined}
            >
              I'll Take This
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAwaitingCard = (request: SwapRequest) => {
    return (
      <div key={request.id} className="swap-card swap-card--awaiting">
        <div className="swap-card__header">
          <span className="swap-card__shift">{formatShiftDisplay(request.day, request.shiftId)}</span>
        </div>
        <div className="swap-card__trade-info">
          {request.fromAgent} → {request.claimedBy}
        </div>
        <div className="swap-card__meta">
          Agreed {formatTimeAgo(request.claimedAt ?? request.createdAt)}
        </div>

        {/* Show notes from both parties */}
        {request.note && (
          <div className="swap-card__note">
            {request.fromAgent}: "{request.note}"
          </div>
        )}
        {request.claimNote && (
          <div className="swap-card__note">
            {request.claimedBy}: "{request.claimNote}"
          </div>
        )}

        {isAdmin && (
          <div className="swap-card__actions">
            <button className="btn-approve" onClick={() => handleApprove(request)}>
              Approve
            </button>
            <button className="btn-deny" onClick={() => handleDeny(request)}>
              Deny
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderHistoryCard = (request: SwapRequest) => {
    const statusIcon = request.status === 'approved' ? '✓' : request.status === 'denied' ? '✗' : '⊘';
    const statusClass = request.status;

    return (
      <div key={request.id} className={`swap-card swap-card--${statusClass}`}>
        <div className="swap-card__header">
          <span className="swap-card__status-icon">{statusIcon}</span>
          <span className="swap-card__shift">{formatShiftDisplay(request.day, request.shiftId)}</span>
        </div>
        <div className="swap-card__meta">
          {request.fromAgent}
          {request.claimedBy && <> → {request.claimedBy}</>}
        </div>
        <div className="swap-card__meta">
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)} · {formatTimeAgo(request.reviewedAt ?? request.createdAt)}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="swaps-grid__loading">Loading swaps...</div>;
  }

  return (
    <div className="swaps-grid">
      <div className="swaps-grid__header">
        <h2>Shift Swaps</h2>
        <button
          className="btn-post-swap"
          onClick={() => setShowPostModal(true)}
          disabled={!linkedAgentId}
          title={!linkedAgentId ? 'You must be linked to a schedule agent in Team Management' : undefined}
        >
          + Make Available
        </button>
      </div>

      {!linkedAgentId && (
        <div className="swaps-grid__warning">
          You are not linked to a schedule agent. Ask your admin to link your account in Team Management.
        </div>
      )}

      {error && <div className="swaps-grid__error">{error}</div>}

      <div className="swaps-grid__tabs">
        <button
          className={`swaps-tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available ({availableRequests.length})
        </button>
        <button
          className={`swaps-tab ${activeTab === 'awaiting' ? 'active' : ''}`}
          onClick={() => setActiveTab('awaiting')}
        >
          Awaiting Approval ({awaitingRequests.length})
        </button>
        <button
          className={`swaps-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      <div className="swaps-grid__content">
        {activeTab === 'available' && (
          availableRequests.length === 0 ? (
            <div className="swaps-grid__empty">
              <p>No shifts available for swap right now.</p>
              <p className="swaps-grid__empty-hint">
                Agents can make their shifts available if they need someone else to cover.
              </p>
            </div>
          ) : (
            availableRequests.map(renderAvailableCard)
          )
        )}

        {activeTab === 'awaiting' && (
          awaitingRequests.length === 0 ? (
            <div className="swaps-grid__empty">No swaps awaiting approval</div>
          ) : (
            awaitingRequests.map(renderAwaitingCard)
          )
        )}

        {activeTab === 'history' && (
          historyRequests.length === 0 ? (
            <div className="swaps-grid__empty">No completed swaps yet</div>
          ) : (
            historyRequests.map(renderHistoryCard)
          )
        )}
      </div>

      {/* Post Swap Modal */}
      {showPostModal && (
        <PostSwapModal
          assignedShifts={getUserAssignedShifts()}
          onPost={handlePostSwap}
          onClose={() => setShowPostModal(false)}
          loading={postingSwap}
        />
      )}
    </div>
  );
}

// Post Swap Modal Component
interface PostSwapModalProps {
  assignedShifts: { day: DayOfWeek; shiftId: ShiftId }[];
  onPost: (day: DayOfWeek, shiftId: ShiftId, note?: string) => void;
  onClose: () => void;
  loading: boolean;
}

function PostSwapModal({ assignedShifts, onPost, onClose, loading }: PostSwapModalProps) {
  const [selectedShift, setSelectedShift] = useState<{ day: DayOfWeek; shiftId: ShiftId } | null>(
    assignedShifts[0] ?? null
  );
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;
    onPost(selectedShift.day, selectedShift.shiftId, note || undefined);
  };

  if (assignedShifts.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Make Shift Available</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <p className="modal-empty">You don't have any assigned shifts to make available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Make Shift Available</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Select Shift</label>
          <select
            value={selectedShift ? `${selectedShift.day}-${selectedShift.shiftId}` : ''}
            onChange={(e) => {
              const [day, shiftId] = e.target.value.split('-') as [DayOfWeek, ShiftId];
              setSelectedShift({ day, shiftId });
            }}
          >
            {assignedShifts.map(({ day, shiftId }) => (
              <option key={`${day}-${shiftId}`} value={`${day}-${shiftId}`}>
                {formatShiftDisplay(day, shiftId)}
              </option>
            ))}
          </select>

          <label>Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Doctor appointment"
          />

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !selectedShift}>
              {loading ? 'Posting...' : 'Make Available'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
