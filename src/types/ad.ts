export interface SizeSpec {
  width: number;
  height: number;
}

export interface SizePreset {
  name: string;
  width: number;
  height: number;
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

export interface Ad {
  id: string;
  user_id: string;
  client_name: string;
  publication_id: string | null;
  size_spec: SizeSpec;
  dpi: number;
  brief: string | null;
  copy: string | null;
  status: 'draft' | 'in_review' | 'approved' | 'exported';
  created_at: string;
  updated_at: string;
  publications?: Publication;
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

export interface Version {
  id: string;
  ad_id: string;
  source: 'ai' | 'manual';
  layout_json: LayoutJSON;
  preview_url: string | null;
  is_selected: boolean;
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
