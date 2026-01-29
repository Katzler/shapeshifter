-- Simplify swap system: remove trade/offer complexity, add agent linking
-- Flow: available -> claimed -> approved/denied/cancelled

-- 1. Add linked_agent_id to workspace_members for agent linking
ALTER TABLE workspace_members
ADD COLUMN IF NOT EXISTS linked_agent_id TEXT;

-- 2. Drop swap_offers table (no longer needed - no trade offers)
DROP TABLE IF EXISTS swap_offers;

-- 3. Modify swap_requests table

-- Drop columns we no longer need
ALTER TABLE swap_requests
DROP COLUMN IF EXISTS type,
DROP COLUMN IF EXISTS from_agent_email,
DROP COLUMN IF EXISTS to_agent_email,
DROP COLUMN IF EXISTS to_day,
DROP COLUMN IF EXISTS to_shift_id;

-- Add claim_note column for claimer's message
ALTER TABLE swap_requests
ADD COLUMN IF NOT EXISTS claim_note TEXT;

-- Rename columns for clarity
ALTER TABLE swap_requests RENAME COLUMN from_agent_id TO from_agent;
ALTER TABLE swap_requests RENAME COLUMN to_agent_id TO claimed_by;

-- Update status constraint (drop old, add new)
-- First update any existing 'pending' or 'awaiting_approval' records
UPDATE swap_requests SET status = 'available' WHERE status = 'pending';
UPDATE swap_requests SET status = 'claimed' WHERE status = 'awaiting_approval';

ALTER TABLE swap_requests DROP CONSTRAINT IF EXISTS swap_requests_status_check;
ALTER TABLE swap_requests
ADD CONSTRAINT swap_requests_status_check
CHECK (status IN ('available', 'claimed', 'approved', 'denied', 'cancelled'));

-- Update default status
ALTER TABLE swap_requests ALTER COLUMN status SET DEFAULT 'available';
