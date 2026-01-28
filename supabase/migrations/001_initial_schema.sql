-- ShapeShifter Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Workspaces table
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT NOT NULL,  -- user email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::jsonb  -- Contains { version, agents[], schedule }
);

-- Workspace members (who has access to which workspace)
CREATE TABLE workspace_members (
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_email)
);

-- Workspace invites (pending invitations)
CREATE TABLE workspace_invites (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  invited_by TEXT NOT NULL,  -- email of inviter
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_email)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_workspace_members_email ON workspace_members(user_email);
CREATE INDEX idx_workspace_invites_email ON workspace_invites(user_email);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- Simple non-recursive policies (admin logic handled in app)
CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (true);
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (created_by = auth.jwt() ->> 'email');
CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE USING (created_by = auth.jwt() ->> 'email');

CREATE POLICY "members_select" ON workspace_members FOR SELECT USING (user_email = auth.jwt() ->> 'email');
CREATE POLICY "members_insert" ON workspace_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "members_update" ON workspace_members FOR UPDATE USING (user_email = auth.jwt() ->> 'email');
CREATE POLICY "members_delete" ON workspace_members FOR DELETE USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "invites_select" ON workspace_invites FOR SELECT USING (user_email = auth.jwt() ->> 'email');
CREATE POLICY "invites_insert" ON workspace_invites FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "invites_delete" ON workspace_invites FOR DELETE USING (user_email = auth.jwt() ->> 'email');
