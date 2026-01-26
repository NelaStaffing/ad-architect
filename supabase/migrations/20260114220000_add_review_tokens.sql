-- Create review_tokens table for client review links
CREATE TABLE public.review_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  client_email TEXT NOT NULL,
  client_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  response TEXT CHECK (response IN ('approved', 'changes_requested')),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view review tokens for their own ads
CREATE POLICY "Users can view review tokens for their ads"
ON public.review_tokens FOR SELECT
USING (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = review_tokens.ad_id AND ads.user_id = auth.uid()));

-- Users can create review tokens for their own ads
CREATE POLICY "Users can create review tokens for their ads"
ON public.review_tokens FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = review_tokens.ad_id AND ads.user_id = auth.uid()));

-- Users can update review tokens for their own ads
CREATE POLICY "Users can update review tokens for their ads"
ON public.review_tokens FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.ads WHERE ads.id = review_tokens.ad_id AND ads.user_id = auth.uid()));

-- Public access for review responses (clients don't have auth)
-- This allows the public review page to read token info and submit responses
CREATE POLICY "Anyone can read review tokens by token value"
ON public.review_tokens FOR SELECT
USING (true);

CREATE POLICY "Anyone can update review tokens by token value"
ON public.review_tokens FOR UPDATE
USING (true);

-- Create index for fast token lookups
CREATE INDEX idx_review_tokens_token ON public.review_tokens(token);
CREATE INDEX idx_review_tokens_ad_id ON public.review_tokens(ad_id);
