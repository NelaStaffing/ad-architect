-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS and basic policy for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients are viewable by authenticated users"
ON public.clients FOR SELECT
TO authenticated
USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add relation from publications to clients
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_publications_client_id ON public.publications(client_id);

-- Seed clients
INSERT INTO public.clients (name) VALUES
  ('PLAIN COMMUNITY BUSINESS EXCHANGE (PCBE)'),
  ('THE BUDGET NEWSPAPER'),
  ('BUSY BEAVER'),
  ('COMMUNITY CONNECTION'),
  ('LANCASTER GEMEINDE BRIEF'),
  ('PLAIN PRESS'),
  ('LYKENS VALLEY_BUSINESS GUIDE'),
  ('DIEBOTSCHAFT'),
  ('EZSELL'),
  ('AD CIRCULAR')
ON CONFLICT (name) DO NOTHING;
