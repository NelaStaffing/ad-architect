-- Add ad_size_id foreign key and ad_name to ads table
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS ad_size_id UUID REFERENCES public.ad_sizes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ad_name TEXT;

-- Create index for ad_size_id
CREATE INDEX IF NOT EXISTS idx_ads_ad_size_id ON public.ads(ad_size_id);

-- Create index for ad_name for quick lookups
CREATE INDEX IF NOT EXISTS idx_ads_ad_name ON public.ads(ad_name);

-- Add RLS policy for ad_sizes table
ALTER TABLE public.ad_sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_sizes_select_authenticated" ON public.ad_sizes;
CREATE POLICY "ad_sizes_select_authenticated"
ON public.ad_sizes FOR SELECT
TO authenticated
USING (true);
