import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../store';
import { useAuth } from '../../store/AuthContext';
import { swapService } from '../../infrastructure/persistence/SwapService';
import { generateId } from '../../utils';
import type { SwapRequest, SwapOffer, DayOfWeek, ShiftId } from '../../types';
import { formatShiftDisplay, DAYS, SHIFTS } from '../../types';
import './SwapsGrid.css';

type SwapTab = 'pending' | 'awaiting' | 'completed';

export function SwapsGrid() {
  const { agents, schedule, currentWorkspace, userRole, setScheduleAssignment } = useApp();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<SwapTab>('pending');
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [swapOffers, setSwapOffers] = useState<Record<string, SwapOffer[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showPostModal, setShowPostModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState<SwapRequest | null>(null);
  const [postingSwap, setPostingSwap] = useState(false);

  const currentUserEmail = user?.email?.toLowerCase();

  // Load swap data
  const loadSwaps = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setLoading(true);
    setError(null);

    try {
      const requests = await swapService.getSwapRequests(currentWorkspace.id);
      setSwapRequests(requests);

      const requestIds = requests.map(r => r.id);
      const offers = await swapService.getSwapOffers(requestIds);
      setSwapOffers(offers);
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
  const getAgentName = (agentId: string) => {
    return agents.find(a => a.id === agentId)?.name ?? 'Unknown';
  };

  // Get current user's agent ID
  const getCurrentUserAgentId = () => {
    return agents.find(a => a.name.toLowerCase().includes(currentUserEmail?.split('@')[0] ?? ''))?.id;
  };

  // Get shifts assigned to current user
  const getUserAssignedShifts = (): { day: DayOfWeek; shiftId: ShiftId }[] => {
    const userAgentId = getCurrentUserAgentId();
    if (!userAgentId) return [];

    const assigned: { day: DayOfWeek; shiftId: ShiftId }[] = [];
    for (const day of DAYS) {
      for (const shift of SHIFTS) {
        if (schedule[day.id][shift.id] === userAgentId) {
          assigned.push({ day: day.id, shiftId: shift.id });
        }
      }
    }
    return assigned;
  };

  // Filter requests by tab
  const pendingRequests = swapRequests.filter(r => r.status === 'pending');
  const awaitingRequests = swapRequests.filter(r => r.status === 'awaiting_approval');
  const completedRequests = swapRequests.filter(r =>
    r.status === 'approved' || r.status === 'denied' || r.status === 'cancelled'
  ).slice(0, 10); // Last 10

  // Post a new swap request
  const handlePostSwap = async (
    day: DayOfWeek,
    shiftId: ShiftId,
    type: 'trade' | 'giveaway',
    note?: string
  ) => {
    const userAgentId = getCurrentUserAgentId();
    if (!userAgentId || !currentUserEmail || !currentWorkspace?.id) return;

    setPostingSwap(true);
    const success = await swapService.createSwapRequest(
      generateId(),
      currentWorkspace.id,
      day,
      shiftId,
      userAgentId,
      currentUserEmail,
      type,
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

  // Offer a trade
  const handleOfferTrade = async (
    swapRequest: SwapRequest,
    day: DayOfWeek,
    shiftId: ShiftId,
    note?: string
  ) => {
    const userAgentId = getCurrentUserAgentId();
    if (!userAgentId || !currentUserEmail) return;

    const success = await swapService.createSwapOffer(
      generateId(),
      swapRequest.id,
      userAgentId,
      currentUserEmail,
      day,
      shiftId,
      note
    );

    if (success) {
      setShowOfferModal(null);
      await loadSwaps();
    } else {
      setError('Failed to submit offer');
    }
  };

  // Claim a giveaway
  const handleClaimGiveaway = async (swapRequest: SwapRequest) => {
    const userAgentId = getCurrentUserAgentId();
    if (!userAgentId || !currentUserEmail) return;

    const success = await swapService.claimGiveaway(
      swapRequest.id,
      userAgentId,
      currentUserEmail
    );

    if (success) {
      await loadSwaps();
    } else {
      setError('Failed to claim shift - it may have already been taken');
    }
  };

  // Accept a trade offer
  const handleAcceptOffer = async (swapRequest: SwapRequest, offer: SwapOffer) => {
    const success = await swapService.acceptOffer(swapRequest.id, offer);
    if (success) {
      await loadSwaps();
    } else {
      setError('Failed to accept offer');
    }
  };

  // Admin approve swap
  const handleApprove = async (swapRequest: SwapRequest) => {
    if (!currentUserEmail) return;

    const success = await swapService.approveSwap(swapRequest.id, currentUserEmail);
    if (success) {
      // Update the schedule
      if (swapRequest.type === 'trade' && swapRequest.toDay && swapRequest.toShiftId) {
        // Swap both shifts
        setScheduleAssignment(swapRequest.day, swapRequest.shiftId, swapRequest.toAgentId ?? null);
        setScheduleAssignment(swapRequest.toDay, swapRequest.toShiftId, swapRequest.fromAgentId);
      } else if (swapRequest.type === 'giveaway' && swapRequest.toAgentId) {
        // Just reassign the single shift
        setScheduleAssignment(swapRequest.day, swapRequest.shiftId, swapRequest.toAgentId);
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

  // Cancel own swap
  const handleCancel = async (swapRequest: SwapRequest) => {
    const success = await swapService.cancelSwap(swapRequest.id);
    if (success) {
      await loadSwaps();
    } else {
      setError('Failed to cancel swap');
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

  const renderPendingCard = (request: SwapRequest) => {
    const offers = swapOffers[request.id] ?? [];
    const isOwnRequest = request.fromAgentEmail === currentUserEmail;
    const userAssignedShifts = getUserAssignedShifts();
    const canOffer = !isOwnRequest && request.type === 'trade' && userAssignedShifts.length > 0;
    const canClaim = !isOwnRequest && request.type === 'giveaway';

    return (
      <div key={request.id} className="swap-card">
        <div className="swap-card__header">
          <span className="swap-card__shift">{formatShiftDisplay(request.day, request.shiftId)}</span>
          <span className={`swap-card__type swap-card__type--${request.type}`}>
            {request.type === 'trade' ? 'Looking for trade' : 'Free shift'}
          </span>
        </div>
        <div className="swap-card__meta">
          Posted by {getAgentName(request.fromAgentId)} · {formatTimeAgo(request.createdAt)}
        </div>
        {request.note && <div className="swap-card__note">"{request.note}"</div>}

        {request.type === 'trade' && offers.length > 0 && (
          <div className="swap-card__offers">
            <div className="swap-card__offers-title">Offers ({offers.length}):</div>
            {offers.map(offer => (
              <div key={offer.id} className="swap-offer">
                <span className="swap-offer__info">
                  {getAgentName(offer.fromAgentId)} offered {formatShiftDisplay(offer.day, offer.shiftId)}
                </span>
                {isOwnRequest && (
                  <div className="swap-offer__actions">
                    <button
                      className="btn-accept-offer"
                      onClick={() => handleAcceptOffer(request, offer)}
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="swap-card__actions">
          {canOffer && (
            <button className="btn-offer" onClick={() => setShowOfferModal(request)}>
              Offer Trade
            </button>
          )}
          {canClaim && (
            <button className="btn-claim" onClick={() => handleClaimGiveaway(request)}>
              I'll Take This Shift
            </button>
          )}
          {isOwnRequest && (
            <button className="btn-cancel" onClick={() => handleCancel(request)}>
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAwaitingCard = (request: SwapRequest) => {
    const isAdmin = userRole === 'admin';

    return (
      <div key={request.id} className="swap-card swap-card--awaiting">
        <div className="swap-card__header">
          {request.type === 'trade' ? (
            <span className="swap-card__trade-info">
              {getAgentName(request.fromAgentId)} ↔ {getAgentName(request.toAgentId ?? '')}
            </span>
          ) : (
            <span className="swap-card__trade-info">
              {getAgentName(request.fromAgentId)} → {getAgentName(request.toAgentId ?? '')}
            </span>
          )}
        </div>
        <div className="swap-card__meta">
          {formatShiftDisplay(request.day, request.shiftId)}
          {request.type === 'trade' && request.toDay && request.toShiftId && (
            <> ↔ {formatShiftDisplay(request.toDay, request.toShiftId)}</>
          )}
        </div>
        <div className="swap-card__meta">
          Agreed {formatTimeAgo(request.claimedAt ?? request.createdAt)}
        </div>

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

  const renderCompletedCard = (request: SwapRequest) => {
    const statusIcon = request.status === 'approved' ? '✓' : request.status === 'denied' ? '✗' : '⊘';
    const statusClass = request.status;

    return (
      <div key={request.id} className={`swap-card swap-card--${statusClass}`}>
        <div className="swap-card__header">
          <span className="swap-card__status-icon">{statusIcon}</span>
          <span>
            {formatShiftDisplay(request.day, request.shiftId)} - {getAgentName(request.fromAgentId)}
            {request.toAgentId && <> → {getAgentName(request.toAgentId)}</>}
          </span>
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
        <button className="btn-post-swap" onClick={() => setShowPostModal(true)}>
          + Post Swap
        </button>
      </div>

      {error && <div className="swaps-grid__error">{error}</div>}

      <div className="swaps-grid__tabs">
        <button
          className={`swaps-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          className={`swaps-tab ${activeTab === 'awaiting' ? 'active' : ''}`}
          onClick={() => setActiveTab('awaiting')}
        >
          Awaiting Approval ({awaitingRequests.length})
        </button>
        <button
          className={`swaps-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
      </div>

      <div className="swaps-grid__content">
        {activeTab === 'pending' && (
          pendingRequests.length === 0 ? (
            <div className="swaps-grid__empty">No pending swap requests</div>
          ) : (
            pendingRequests.map(renderPendingCard)
          )
        )}

        {activeTab === 'awaiting' && (
          awaitingRequests.length === 0 ? (
            <div className="swaps-grid__empty">No swaps awaiting approval</div>
          ) : (
            awaitingRequests.map(renderAwaitingCard)
          )
        )}

        {activeTab === 'completed' && (
          completedRequests.length === 0 ? (
            <div className="swaps-grid__empty">No completed swaps yet</div>
          ) : (
            completedRequests.map(renderCompletedCard)
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

      {/* Offer Trade Modal */}
      {showOfferModal && (
        <OfferTradeModal
          swapRequest={showOfferModal}
          assignedShifts={getUserAssignedShifts()}
          onOffer={(day, shiftId, note) => handleOfferTrade(showOfferModal, day, shiftId, note)}
          onClose={() => setShowOfferModal(null)}
        />
      )}
    </div>
  );
}

// Post Swap Modal Component
interface PostSwapModalProps {
  assignedShifts: { day: DayOfWeek; shiftId: ShiftId }[];
  onPost: (day: DayOfWeek, shiftId: ShiftId, type: 'trade' | 'giveaway', note?: string) => void;
  onClose: () => void;
  loading: boolean;
}

function PostSwapModal({ assignedShifts, onPost, onClose, loading }: PostSwapModalProps) {
  const [selectedShift, setSelectedShift] = useState<{ day: DayOfWeek; shiftId: ShiftId } | null>(
    assignedShifts[0] ?? null
  );
  const [swapType, setSwapType] = useState<'trade' | 'giveaway'>('trade');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;
    onPost(selectedShift.day, selectedShift.shiftId, swapType, note || undefined);
  };

  if (assignedShifts.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Post Swap</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <p>You don't have any assigned shifts to swap.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Post Swap Request</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Select Shift to Swap</label>
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

          <label>Swap Type</label>
          <div className="swap-type-options">
            <label className="swap-type-option">
              <input
                type="radio"
                name="swapType"
                checked={swapType === 'trade'}
                onChange={() => setSwapType('trade')}
              />
              <span>Trade</span>
              <small>Want another shift in return</small>
            </label>
            <label className="swap-type-option">
              <input
                type="radio"
                name="swapType"
                checked={swapType === 'giveaway'}
                onChange={() => setSwapType('giveaway')}
              />
              <span>Giveaway</span>
              <small>Anyone can take it</small>
            </label>
          </div>

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
              {loading ? 'Posting...' : 'Post Swap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Offer Trade Modal Component
interface OfferTradeModalProps {
  swapRequest: SwapRequest;
  assignedShifts: { day: DayOfWeek; shiftId: ShiftId }[];
  onOffer: (day: DayOfWeek, shiftId: ShiftId, note?: string) => void;
  onClose: () => void;
}

function OfferTradeModal({ swapRequest, assignedShifts, onOffer, onClose }: OfferTradeModalProps) {
  const [selectedShift, setSelectedShift] = useState<{ day: DayOfWeek; shiftId: ShiftId } | null>(
    assignedShifts[0] ?? null
  );
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;
    onOffer(selectedShift.day, selectedShift.shiftId, note || undefined);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Offer Trade</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p className="modal-subtitle">
          Offering to trade for: <strong>{formatShiftDisplay(swapRequest.day, swapRequest.shiftId)}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <label>Your Shift to Offer</label>
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
            placeholder="Message to poster"
          />

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!selectedShift}>
              Submit Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
