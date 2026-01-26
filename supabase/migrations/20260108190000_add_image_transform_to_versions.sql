-- Add image_transform column to versions table to store position and scale adjustments
ALTER TABLE public.versions
ADD COLUMN IF NOT EXISTS image_transform jsonb DEFAULT '{"x": 0, "y": 0, "scale": 1}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.versions.image_transform IS 'Stores the image position (x, y) and scale adjustments made in the editor';
