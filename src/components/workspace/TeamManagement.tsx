import { useState, useEffect, useCallback } from 'react';
import { supabaseWorkspaceService } from '../../infrastructure/persistence/SupabaseWorkspaceService';
import { useAuth } from '../../store/AuthContext';
import './TeamManagement.css';

interface Member {
  user_email: string;
  role: 'admin' | 'agent';
  joined_at: string;
}

interface Invite {
  id: string;
  user_email: string;
  role: 'admin' | 'agent';
  invited_by: string;
  invited_at: string;
}

interface TeamManagementProps {
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
}

export function TeamManagement({ workspaceId, workspaceName, onClose }: TeamManagementProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [workspaceCreator, setWorkspaceCreator] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentUserEmail = user?.email?.toLowerCase();
  const isCurrentUserAdmin = members.find(m => m.user_email === currentUserEmail)?.role === 'admin';

  const loadTeamData = useCallback(async () => {
    try {
      const [membersData, invitesData, creator] = await Promise.all([
        supabaseWorkspaceService.getWorkspaceMembers(workspaceId),
        supabaseWorkspaceService.getWorkspaceInvites(workspaceId),
        supabaseWorkspaceService.getWorkspaceCreator(workspaceId),
      ]);

      setMembers(membersData);
      setInvites(invitesData);
      if (creator) {
        setWorkspaceCreator(creator);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const handleRoleChange = async (memberEmail: string, newRole: 'admin' | 'agent') => {
    setActionLoading(memberEmail);
    setError(null);

    try {
      const success = await supabaseWorkspaceService.updateMemberRole(workspaceId, memberEmail, newRole);
      if (!success) throw new Error('Failed to change role');
      await loadTeamData();
    } catch (err) {
      console.error('Failed to change role:', err);
      setError('Failed to change role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    if (memberEmail === workspaceCreator) {
      setError('Cannot remove the workspace creator');
      return;
    }

    if (!confirm(`Remove ${memberEmail} from this workspace?`)) return;

    setActionLoading(memberEmail);
    setError(null);

    try {
      const success = await supabaseWorkspaceService.removeMember(workspaceId, memberEmail);
      if (!success) throw new Error('Failed to remove member');
      await loadTeamData();
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError('Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    setError(null);

    try {
      const success = await supabaseWorkspaceService.deleteInvite(inviteId);
      if (!success) throw new Error('Failed to cancel invite');
      await loadTeamData();
    } catch (err) {
      console.error('Failed to cancel invite:', err);
      setError('Failed to cancel invite');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="team-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Team Management</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p className="modal-subtitle">{workspaceName}</p>

        {error && <div className="modal-error">{error}</div>}

        {loading ? (
          <div className="team-loading">Loading...</div>
        ) : (
          <>
            <section className="team-section">
              <h3>Members ({members.length})</h3>
              <div className="team-list">
                {members.map(member => (
                  <div key={member.user_email} className="team-item">
                    <div className="team-item-info">
                      <div className="team-item-email">
                        {member.user_email}
                        {member.user_email === workspaceCreator && (
                          <span className="badge badge-creator">Creator</span>
                        )}
                        {member.user_email === currentUserEmail && (
                          <span className="badge badge-you">You</span>
                        )}
                      </div>
                      <div className="team-item-meta">
                        Joined {formatDate(member.joined_at)}
                      </div>
                    </div>
                    <div className="team-item-actions">
                      {isCurrentUserAdmin && member.user_email !== currentUserEmail ? (
                        <>
                          <select
                            value={member.role}
                            onChange={e => handleRoleChange(member.user_email, e.target.value as 'admin' | 'agent')}
                            disabled={actionLoading === member.user_email}
                          >
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                          </select>
                          {member.user_email !== workspaceCreator && (
                            <button
                              className="btn-remove"
                              onClick={() => handleRemoveMember(member.user_email)}
                              disabled={actionLoading === member.user_email}
                            >
                              Remove
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="role-badge">{member.role}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {invites.length > 0 && (
              <section className="team-section">
                <h3>Pending Invites ({invites.length})</h3>
                <div className="team-list">
                  {invites.map(invite => (
                    <div key={invite.id} className="team-item">
                      <div className="team-item-info">
                        <div className="team-item-email">{invite.user_email}</div>
                        <div className="team-item-meta">
                          Invited as {invite.role} by {invite.invited_by} &middot; {formatDate(invite.invited_at)}
                        </div>
                      </div>
                      {isCurrentUserAdmin && (
                        <div className="team-item-actions">
                          <button
                            className="btn-cancel"
                            onClick={() => handleCancelInvite(invite.id)}
                            disabled={actionLoading === invite.id}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
