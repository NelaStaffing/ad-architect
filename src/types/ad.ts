export interface SizeSpec {
  width: number;
  height: number;
}

export interface SizePreset {
  name: string;
  width: number;
  height: number;
}

export interface AdSize {
  id: string;
  ad_size_fraction: string;
  ad_size_words: string;
  size_id: string;
  width_in: number;
  height_in: number;
  dpi: number;
  width_px: number;
  height_px: number;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Publication {
  id: string;
  name: string;
  dpi_default: number;
  min_font_size: number;
  bleed_px: number;
  safe_px: number;
  size_presets: SizePreset[];
  created_at: string;
  updated_at: string;
}

export interface PublicationIssue {
  id: string;
  publication_id: string;
  client_id: string;
  issue_date: string; // ISO date string (YYYY-MM-DD)
  created_at: string;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface Ad {
  id: string;
  user_id: string;
  client_name: string;
  ad_name: string | null;
  publication_id: string | null;
  publication_issue: string | null;
  ad_size_id: string | null;
  aspect_ratio: AspectRatio | null;
  size_spec: SizeSpec;
  dpi: number;
  bleed_px: number | null;
  safe_px: number | null;
  min_font_size: number | null;
  brief: string | null;
  copy: string | null;
  status: 'draft' | 'in_review' | 'approved' | 'exported';
  target_date: string | null;
  created_at: string;
  updated_at: string;
  publications?: Publication;
  publication_issues?: PublicationIssue;
  ad_sizes?: AdSize;
  selected_version_preview?: string | null;
}

export interface Asset {
  id: string;
  ad_id: string;
  type: 'product' | 'logo';
  url: string;
  width: number | null;
  height: number | null;
  name: string | null;
  created_at: string;
}

export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
}

export interface Version {
  id: string;
  ad_id: string;
  source: 'ai' | 'manual';
  layout_json: LayoutJSON;
  preview_url: string | null;
  is_selected: boolean;
  image_transform: ImageTransform | null;
  status: 'pending' | 'kept' | 'discarded';
  created_at: string;
}

export interface Comment {
  id: string;
  ad_id: string;
  author: string;
  message: string;
  created_at: string;
}

// LayoutJSON Schema
export interface LayoutElement {
  type: 'text' | 'image' | 'shape';
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    lineHeight?: number;
    color?: string;
    alignment?: 'left' | 'center' | 'right';
    padding?: number;
    backgroundColor?: string;
    borderRadius?: number;
  };
  content?: string;
  assetRef?: string;
}

export interface LayoutDocument {
  widthPx: number;
  heightPx: number;
  dpi: number;
  bleedPx: number;
  safePx: number;
}

export interface LayoutJSON {
  document: LayoutDocument;
  elements: LayoutElement[];
  metadata: {
    templateName: string;
    rationale: string;
    warnings: string[];
  };
}
