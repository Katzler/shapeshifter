-- Swap Requests table
CREATE TABLE swap_requests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Original shift being offered
  day TEXT NOT NULL,
  shift_id TEXT NOT NULL,
  from_agent_id TEXT NOT NULL,
  from_agent_email TEXT NOT NULL,

  -- Swap type: 'trade' (want something in return) or 'giveaway' (free)
  type TEXT NOT NULL CHECK (type IN ('trade', 'giveaway')),

  -- Status workflow: pending -> awaiting_approval -> approved/denied
  -- Or: pending -> cancelled
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_approval', 'approved', 'denied', 'cancelled')),

  -- Optional note from poster
  note TEXT,

  -- Filled when someone claims giveaway or trade offer is accepted
  to_agent_id TEXT,
  to_agent_email TEXT,
  to_day TEXT,
  to_shift_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,

  -- Admin review info
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  denial_reason TEXT
);

-- Swap Offers table (for trades - other agents offering their shifts)
CREATE TABLE swap_offers (
  id TEXT PRIMARY KEY,
  swap_request_id TEXT NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
  from_agent_id TEXT NOT NULL,
  from_agent_email TEXT NOT NULL,
  day TEXT NOT NULL,
  shift_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_swap_requests_workspace ON swap_requests(workspace_id);
CREATE INDEX idx_swap_requests_status ON swap_requests(workspace_id, status);
CREATE INDEX idx_swap_offers_request ON swap_offers(swap_request_id);

-- RLS Policies

ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_offers ENABLE ROW LEVEL SECURITY;

-- Swap requests: workspace members can view and create
CREATE POLICY swap_requests_select ON swap_requests
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY swap_requests_insert ON swap_requests
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY swap_requests_update ON swap_requests
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY swap_requests_delete ON swap_requests
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_email = auth.jwt() ->> 'email'
    )
  );

-- Swap offers: workspace members can view and create
CREATE POLICY swap_offers_select ON swap_offers
  FOR SELECT
  USING (
    swap_request_id IN (
      SELECT id FROM swap_requests
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY swap_offers_insert ON swap_offers
  FOR INSERT
  WITH CHECK (
    swap_request_id IN (
      SELECT id FROM swap_requests
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY swap_offers_delete ON swap_offers
  FOR DELETE
  USING (
    swap_request_id IN (
      SELECT id FROM swap_requests
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_email = auth.jwt() ->> 'email'
      )
    )
  );
