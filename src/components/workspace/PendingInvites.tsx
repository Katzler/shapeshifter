import { useState } from 'react';
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

  const handleAccept = async (invite: PendingInvite) => {
    if (!user?.email) return;

    setLoading(invite.id);
    setError(null);

    try {
      // Add user to workspace members
      const memberAdded = await supabaseWorkspaceService.addWorkspaceMember(
        invite.workspaceId,
        user.email,
        invite.role
      );

      if (!memberAdded) {
        throw new Error('Failed to add member');
      }

      // Delete the invite (non-fatal if fails)
      await supabaseWorkspaceService.deleteInvite(invite.id);

      onInviteHandled();
    } catch (err) {
      console.error('Failed to accept invite:', err);
      setError('Failed to accept invite. Please try again.');
    } finally {
      setLoading(null);
    }
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
                  onClick={() => handleAccept(invite)}
                  disabled={loading === invite.id}
                >
                  {loading === invite.id ? 'Joining...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
