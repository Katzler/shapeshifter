-- Allow any workspace member to update workspace data
-- Previously only the creator could update, which blocked new members
-- from saving their agent when accepting an invite.

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "workspaces_update" ON workspaces;

-- Create new policy: any member can update
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = workspaces.id
    AND workspace_members.user_email = auth.jwt() ->> 'email'
  )
);
