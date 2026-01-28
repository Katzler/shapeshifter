import { useState } from 'react';
import { supabaseWorkspaceService } from '../../infrastructure/persistence/SupabaseWorkspaceService';
import { useAuth } from '../../store/AuthContext';
import { generateId } from '../../utils';
import { createEmptyAppData } from '../../types';
import './CreateWorkspace.css';

interface CreateWorkspaceProps {
  onWorkspaceCreated: () => void;
}

export function CreateWorkspace({ onWorkspaceCreated }: CreateWorkspaceProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a workspace name');
      return;
    }

    if (!user?.email) {
      setError('You must be signed in to create a workspace');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const workspaceId = generateId();
      const userEmail = user.email.toLowerCase();

      // Create the workspace
      const workspaceCreated = await supabaseWorkspaceService.createWorkspace(
        workspaceId,
        trimmedName,
        userEmail,
        createEmptyAppData()
      );

      if (!workspaceCreated) {
        throw new Error('Failed to create workspace');
      }

      // Add the user as admin
      const memberAdded = await supabaseWorkspaceService.addWorkspaceMember(
        workspaceId,
        userEmail,
        'admin'
      );

      if (!memberAdded) {
        // Attempt rollback - delete the orphaned workspace
        const rollbackSuccess = await supabaseWorkspaceService.deleteWorkspace(workspaceId);

        if (!rollbackSuccess) {
          console.error('Rollback failed');
          throw new Error('Failed to add you as member. Cleanup also failed - please contact support.');
        }
        throw new Error('Failed to add you as member');
      }

      onWorkspaceCreated();
    } catch (err) {
      console.error('Failed to create workspace:', err);
      setError('Failed to create workspace. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="create-workspace-page">
      <div className="create-workspace-card">
        <h1>Create Your Workspace</h1>
        <p className="create-workspace-subtitle">
          Get started by creating a workspace for your team
        </p>

        {error && <div className="create-workspace-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="workspace-name">Workspace Name</label>
          <input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Support Team"
            autoFocus
            disabled={loading}
          />

          <button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
