-- Add status field to versions table for Keep/Discard workflow
-- 'pending' = newly generated, awaiting user decision
-- 'kept' = user chose to keep this version
-- 'discarded' = user chose to discard (soft delete)

ALTER TABLE versions ADD COLUMN IF NOT EXISTS status text DEFAULT 'kept' CHECK (status IN ('pending', 'kept', 'discarded'));

-- Set existing versions to 'kept' status
UPDATE versions SET status = 'kept' WHERE status IS NULL;
