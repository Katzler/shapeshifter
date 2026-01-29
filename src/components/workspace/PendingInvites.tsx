import { useState, useRef, useEffect } from 'react';
import { supabaseWorkspaceService } from '../../infrastructure/persistence/SupabaseWorkspaceService';
import { useAuth, type PendingInvite } from '../../store/AuthContext';
import './PendingInvites.css';

interface PendingInvitesProps {
  invites: PendingInvite[];
  onInviteHandled: () => void;
}

export function PendingInvites({ invites, onInviteHandled }: PendingInvitesProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState<PendingInvite | null>(null);
  const [name, setName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input when modal opens
  useEffect(() => {
    if (acceptingInvite && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [acceptingInvite]);

  const handleAcceptClick = (invite: PendingInvite) => {
    setAcceptingInvite(invite);
    setName('');
    setError(null);
  };

  const handleAcceptWithName = async () => {
    if (!user?.email || !acceptingInvite || !name.trim()) return;

    setLoading(acceptingInvite.id);
    setError(null);

    try {
      const result = await supabaseWorkspaceService.acceptInviteWithAgent(
        acceptingInvite.workspaceId,
        user.email,
        acceptingInvite.role,
        name.trim(),
        acceptingInvite.id
      );

      if (!result.success) {
        throw new Error('Failed to join workspace');
      }

      // Store agent ID so the app can auto-select it and show the editor
      if (result.agentId) {
        sessionStorage.setItem('shapeshifter_new_agent_id', result.agentId);
      }

      setAcceptingInvite(null);
      onInviteHandled();
    } catch (err) {
      console.error('Failed to accept invite:', err);
      setError('Failed to join workspace. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelAccept = () => {
    setAcceptingInvite(null);
    setName('');
    setError(null);
  };

  const handleDecline = async (invite: PendingInvite) => {
    setLoading(invite.id);
    setError(null);

    try {
      const success = await supabaseWorkspaceService.deleteInvite(invite.id);

      if (!success) {
        throw new Error('Failed to delete invite');
      }

      onInviteHandled();
    } catch (err) {
      console.error('Failed to decline invite:', err);
      setError('Failed to decline invite. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleAcceptWithName();
    } else if (e.key === 'Escape') {
      handleCancelAccept();
    }
  };

  return (
    <div className="pending-invites-page">
      <div className="pending-invites-card">
        <h1>Pending Invitations</h1>
        <p className="pending-invites-subtitle">
          You have been invited to join the following workspace(s)
        </p>

        {error && <div className="invite-error">{error}</div>}

        <div className="invites-list">
          {invites.map(invite => (
            <div key={invite.id} className="invite-item">
              <div className="invite-info">
                <div className="invite-workspace">{invite.workspaceName}</div>
                <div className="invite-details">
                  Invited by {invite.invitedBy} as <strong>{invite.role}</strong>
                  <span className="invite-date"> &middot; {formatDate(invite.invitedAt)}</span>
                </div>
              </div>
              <div className="invite-actions">
                <button
                  className="btn-decline"
                  onClick={() => handleDecline(invite)}
                  disabled={loading === invite.id}
                >
                  Decline
                </button>
                <button
                  className="btn-accept"
                  onClick={() => handleAcceptClick(invite)}
                  disabled={loading === invite.id}
                >
                  {loading === invite.id ? 'Joining...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Name Input Modal */}
      {acceptingInvite && (
        <div className="modal-overlay" onClick={handleCancelAccept}>
          <div className="name-input-modal" onClick={e => e.stopPropagation()}>
            <h2>Welcome to ShapeShifter</h2>
            <p className="modal-subtitle">
              You've been invited to join <strong>{acceptingInvite.workspaceName}</strong>
            </p>

            <div className="name-input-section">
              <label htmlFor="agent-name">Enter your name to continue:</label>
              <input
                ref={nameInputRef}
                id="agent-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Your name"
                disabled={loading === acceptingInvite.id}
              />
              <p className="name-hint">This will be your name on the schedule.</p>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={handleCancelAccept}
                disabled={loading === acceptingInvite.id}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAcceptWithName}
                disabled={!name.trim() || loading === acceptingInvite.id}
              >
                {loading === acceptingInvite.id ? 'Joining...' : 'Join Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
