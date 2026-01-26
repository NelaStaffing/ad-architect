export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_sizes: {
        Row: {
          ad_size_fraction: string
          ad_size_words: string
          created_at: string
          dpi: number
          height_in: number
          height_px: number
          id: string
          size_id: string
          width_in: number
          width_px: number
        }
        Insert: {
          ad_size_fraction: string
          ad_size_words: string
          created_at?: string
          dpi?: number
          height_in: number
          height_px: number
          id?: string
          size_id: string
          width_in: number
          width_px: number
        }
        Update: {
          ad_size_fraction?: string
          ad_size_words?: string
          created_at?: string
          dpi?: number
          height_in?: number
          height_px?: number
          id?: string
          size_id?: string
          width_in?: number
          width_px?: number
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_name: string | null
          ad_size_id: string | null
          aspect_ratio: string | null
          bleed_px: number | null
          brief: string | null
          client_name: string
          copy: string | null
          created_at: string
          dpi: number
          id: string
          min_font_size: number | null
          publication_id: string | null
          publication_issue: string | null
          safe_px: number | null
          size_spec: Json
          status: Database["public"]["Enums"]["ad_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_name?: string | null
          ad_size_id?: string | null
          aspect_ratio?: string | null
          bleed_px?: number | null
          brief?: string | null
          client_name: string
          copy?: string | null
          created_at?: string
          dpi?: number
          id?: string
          min_font_size?: number | null
          publication_id?: string | null
          publication_issue?: string | null
          safe_px?: number | null
          size_spec: Json
          status?: Database["public"]["Enums"]["ad_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_name?: string | null
          ad_size_id?: string | null
          aspect_ratio?: string | null
          bleed_px?: number | null
          brief?: string | null
          client_name?: string
          copy?: string | null
          created_at?: string
          dpi?: number
          id?: string
          min_font_size?: number | null
          publication_id?: string | null
          publication_issue?: string | null
          safe_px?: number | null
          size_spec?: Json
          status?: Database["public"]["Enums"]["ad_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_ad_size_id_fkey"
            columns: ["ad_size_id"]
            isOneToOne: false
            referencedRelation: "ad_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_publication_issue_fkey"
            columns: ["publication_issue"]
            isOneToOne: false
            referencedRelation: "publication_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          ad_id: string
          created_at: string
          height: number | null
          id: string
          name: string | null
          type: Database["public"]["Enums"]["asset_type"]
          url: string
          width: number | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          height?: number | null
          id?: string
          name?: string | null
          type: Database["public"]["Enums"]["asset_type"]
          url: string
          width?: number | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          height?: number | null
          id?: string
          name?: string | null
          type?: Database["public"]["Enums"]["asset_type"]
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          ad_id: string
          author: string
          created_at: string
          id: string
          message: string
        }
        Insert: {
          ad_id: string
          author: string
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          ad_id?: string
          author?: string
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_issues: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          issue_date: string
          publication_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          issue_date: string
          publication_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          issue_date?: string
          publication_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_issues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_issues_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          bleed_px: number
          client_id: string | null
          created_at: string
          dpi_default: number
          id: string
          min_font_size: number
          name: string
          safe_px: number
          size_presets: Json
          updated_at: string
        }
        Insert: {
          bleed_px?: number
          client_id?: string | null
          created_at?: string
          dpi_default?: number
          id?: string
          min_font_size?: number
          name: string
          safe_px?: number
          size_presets?: Json
          updated_at?: string
        }
        Update: {
          bleed_px?: number
          client_id?: string | null
          created_at?: string
          dpi_default?: number
          id?: string
          min_font_size?: number
          name?: string
          safe_px?: number
          size_presets?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      versions: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          image_transform: Json | null
          is_selected: boolean
          layout_json: Json
          preview_url: string | null
          source: Database["public"]["Enums"]["version_source"]
          status: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          image_transform?: Json | null
          is_selected?: boolean
          layout_json: Json
          preview_url?: string | null
          source: Database["public"]["Enums"]["version_source"]
          status?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          image_transform?: Json | null
          is_selected?: boolean
          layout_json?: Json
          preview_url?: string | null
          source?: Database["public"]["Enums"]["version_source"]
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "versions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ad_status: "draft" | "in_review" | "approved" | "exported"
      asset_type: "product" | "logo"
      version_source: "ai" | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ad_status: ["draft", "in_review", "approved", "exported"],
      asset_type: ["product", "logo"],
      version_source: ["ai", "manual"],
    },
  },
} as const
