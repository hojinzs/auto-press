-- Add scheduled_at column and scheduled status to content_drafts
ALTER TABLE content_drafts
  ADD COLUMN scheduled_at timestamptz;
