-- Add editable specification fields to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS bleed_px integer DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS safe_px integer DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS min_font_size integer DEFAULT 6;
