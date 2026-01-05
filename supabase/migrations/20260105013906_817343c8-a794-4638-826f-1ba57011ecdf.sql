-- Create publications table for print specs
CREATE TABLE public.publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  dpi_default INTEGER NOT NULL DEFAULT 300,
  min_font_size INTEGER NOT NULL DEFAULT 6,
  bleed_px INTEGER NOT NULL DEFAULT 0,
  safe_px INTEGER NOT NULL DEFAULT 0,
  size_presets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  publication_id UUID REFERENCES public.publications(id) ON DELETE SET NULL,
  size_spec JSONB NOT NULL DEFAULT '{"width": 300, "height": 250}'::jsonb,
  dpi INTEGER NOT NULL DEFAULT 300,
  brief TEXT,
  copy TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'exported')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assets table for product images and logos
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product', 'logo')),
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create versions table for layout snapshots
CREATE TABLE public.versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('ai', 'manual')),
  layout_json JSONB NOT NULL,
  preview_url TEXT,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  author TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Publications are readable by all authenticated users
CREATE POLICY "Publications are viewable by authenticated users"
ON public.publications FOR SELECT
TO authenticated
USING (true);

-- Ads policies
CREATE POLICY "Users can view their own ads"
ON public.ads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ads"
ON public.ads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads"
ON public.ads FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads"
ON public.ads FOR DELETE
USING (auth.uid() = user_id);

-- Assets policies (based on ad ownership)
CREATE POLICY "Users can view assets of their ads"
ON public.assets FOR SELECT
USING (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = assets.ad_id AND ads.user_id = auth.uid()));

CREATE POLICY "Users can create assets for their ads"
ON public.assets FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = assets.ad_id AND ads.user_id = auth.uid()));

CREATE POLICY "Users can delete assets from their ads"
ON public.assets FOR DELETE
USING (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = assets.ad_id AND ads.user_id = auth.uid()));

-- Versions policies (based on ad ownership)
CREATE POLICY "Users can view versions of their ads"
ON public.versions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = versions.ad_id AND ads.user_id = auth.uid()));

CREATE POLICY "Users can create versions for their ads"
ON public.versions FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = versions.ad_id AND ads.user_id = auth.uid()));

CREATE POLICY "Users can update versions of their ads"
ON public.versions FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = versions.ad_id AND ads.user_id = auth.uid()));

CREATE POLICY "Users can delete versions from their ads"
ON public.versions FOR DELETE
USING (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = versions.ad_id AND ads.user_id = auth.uid()));

-- Comments policies (based on ad ownership)
CREATE POLICY "Users can view comments on their ads"
ON public.comments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = comments.ad_id AND ads.user_id = auth.uid()));

CREATE POLICY "Users can create comments on their ads"
ON public.comments FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = comments.ad_id AND ads.user_id = auth.uid()));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed publications data
INSERT INTO public.publications (name, dpi_default, min_font_size, bleed_px, safe_px, size_presets) VALUES
('Metro Daily News', 300, 8, 9, 18, '[{"name": "1x1 (2\"x2\")", "width": 600, "height": 600}, {"name": "2x1 (4\"x2\")", "width": 1200, "height": 600}, {"name": "2x2 (4\"x4\")", "width": 1200, "height": 1200}]'),
('Lifestyle Magazine', 300, 6, 12, 24, '[{"name": "Quarter Page", "width": 1050, "height": 1350}, {"name": "Half Page", "width": 2100, "height": 1350}, {"name": "Full Page", "width": 2100, "height": 2700}]'),
('Local Weekly', 150, 9, 6, 12, '[{"name": "Small", "width": 300, "height": 300}, {"name": "Medium", "width": 600, "height": 450}, {"name": "Large", "width": 600, "height": 900}]');

-- Create storage bucket for assets
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-assets', 'ad-assets', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ad-assets');

CREATE POLICY "Anyone can view assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'ad-assets');

CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ad-assets');