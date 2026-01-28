import { useState } from 'react';
import { supabaseWorkspaceService } from '../../infrastructure/persistence/SupabaseWorkspaceService';
import { useAuth } from '../../store/AuthContext';
import { generateId } from '../../utils';
import './InviteModal.css';

interface InviteModalProps {
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
  onInvitesSent: () => void;
}

export function InviteModal({ workspaceId, workspaceName, onClose, onInvitesSent }: InviteModalProps) {
  const { user } = useAuth();
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('agent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (email: string): boolean => {
    // Basic email validation: user@domain.tld format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setError('You must be signed in to send invites');
      return;
    }

    // Parse and validate emails
    const emailList = emails
      .split(/[\n,;]/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    if (emailList.length === 0) {
      setError('Please enter at least one email address');
      return;
    }

    const invalidEmails = emailList.filter(e => !validateEmail(e));
    if (invalidEmails.length > 0) {
      setError(`Invalid email(s): ${invalidEmails.join(', ')}`);
      return;
    }

    // Check for self-invite
    if (emailList.includes(user.email.toLowerCase())) {
      setError('You cannot invite yourself');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check for existing members and invites
      const [alreadyMembers, alreadyInvited] = await Promise.all([
        supabaseWorkspaceService.getExistingMemberEmails(workspaceId, emailList),
        supabaseWorkspaceService.getExistingInviteEmails(workspaceId, emailList),
      ]);

      // Filter to only new invites
      const newEmails = emailList.filter(
        e => !alreadyMembers.includes(e) && !alreadyInvited.includes(e)
      );

      if (newEmails.length === 0) {
        if (alreadyMembers.length > 0) {
          setError(`Already members: ${alreadyMembers.join(', ')}`);
        } else {
          setError(`Already invited: ${alreadyInvited.join(', ')}`);
        }
        setLoading(false);
        return;
      }

      // Create invites
      const inviterEmail = user.email!.toLowerCase();
      const invites = newEmails.map(email => ({
        id: generateId(),
        workspace_id: workspaceId,
        user_email: email,
        role,
        invited_by: inviterEmail,
      }));

      const success = await supabaseWorkspaceService.createInvites(invites);

      if (!success) {
        throw new Error('Failed to create invites');
      }

      const skippedCount = emailList.length - newEmails.length;
      let message = `${newEmails.length} invite(s) sent`;
      if (skippedCount > 0) {
        message += ` (${skippedCount} skipped - already member or invited)`;
      }

      setSubmitted(true);
      setSuccess(message);
      setEmails('');
      onInvitesSent();

      // Close after a brief delay to show success
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Failed to send invites:', err);
      setError('Failed to send invites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite Team Members</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p className="modal-subtitle">
          Invite people to join <strong>{workspaceName}</strong>
        </p>

        {error && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="invite-emails">Email addresses</label>
          <textarea
            id="invite-emails"
            value={emails}
            onChange={e => setEmails(e.target.value)}
            placeholder="Enter email addresses (one per line)"
            rows={4}
            disabled={loading}
          />

          <label htmlFor="invite-role">Role</label>
          <select
            id="invite-role"
            value={role}
            onChange={e => setRole(e.target.value as 'admin' | 'agent')}
            disabled={loading}
          >
            <option value="agent">Agent - Can view and edit preferences</option>
            <option value="admin">Admin - Full access including team management</option>
          </select>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || submitted || !emails.trim()}>
              {loading ? 'Sending...' : 'Send Invites'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
