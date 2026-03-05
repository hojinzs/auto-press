-- Add scheduled_at column to content_drafts
ALTER TABLE content_drafts
  ADD COLUMN scheduled_at timestamptz;

-- Update status check constraint to include 'scheduled'
ALTER TABLE content_drafts
  DROP CONSTRAINT IF EXISTS content_drafts_status_check;

ALTER TABLE content_drafts
  ADD CONSTRAINT content_drafts_status_check
  CHECK (status IN ('draft', 'published', 'scheduled', 'archived'));
