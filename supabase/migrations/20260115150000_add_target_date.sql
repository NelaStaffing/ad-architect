-- Add target_date column to ads table for deadline tracking
ALTER TABLE public.ads ADD COLUMN target_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.ads.target_date IS 'Target deadline date for when the ad should be ready';
