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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approved_at: string
          approved_by: string
          id: string
          notes: string | null
          post_id: string
        }
        Insert: {
          approved_at?: string
          approved_by: string
          id?: string
          notes?: string | null
          post_id: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          id?: string
          notes?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          audience: string | null
          created_at: string
          id: string
          idea: string
          status: Database["public"]["Enums"]["campaign_status"]
          tone: string | null
          user_id: string | null
        }
        Insert: {
          audience?: string | null
          created_at?: string
          id?: string
          idea: string
          status?: Database["public"]["Enums"]["campaign_status"]
          tone?: string | null
          user_id?: string | null
        }
        Update: {
          audience?: string | null
          created_at?: string
          id?: string
          idea?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          tone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          data: Json | null
          entity_id: string
          entity_type: string
          id: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          type?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          comments: number | null
          fetched_at: string
          id: string
          impressions: number | null
          likes: number | null
          post_id: string
          shares: number | null
        }
        Insert: {
          comments?: number | null
          fetched_at?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id: string
          shares?: number | null
        }
        Update: {
          comments?: number | null
          fetched_at?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id?: string
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          campaign_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          last_error: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          scheduled_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["post_status"]
          temporal_run_id: string | null
          temporal_workflow_id: string | null
        }
        Insert: {
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_error?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          scheduled_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          temporal_run_id?: string | null
          temporal_workflow_id?: string | null
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_error?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          scheduled_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          temporal_run_id?: string | null
          temporal_workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          access_token: string | null
          access_token_encrypted: string | null
          created_at: string
          expires_at: string | null
          handle: string | null
          id: string
          refresh_token: string | null
          refresh_token_encrypted: string | null
          token_refreshed_at: string | null
          type: Database["public"]["Enums"]["provider_type"]
          user_id: string
        }
        Insert: {
          access_token?: string | null
          access_token_encrypted?: string | null
          created_at?: string
          expires_at?: string | null
          handle?: string | null
          id?: string
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          token_refreshed_at?: string | null
          type: Database["public"]["Enums"]["provider_type"]
          user_id: string
        }
        Update: {
          access_token?: string | null
          access_token_encrypted?: string | null
          created_at?: string
          expires_at?: string | null
          handle?: string | null
          id?: string
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          token_refreshed_at?: string | null
          type?: Database["public"]["Enums"]["provider_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          picture: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          picture?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          picture?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrypt_provider_token: {
        Args: { encrypted_token: string }
        Returns: string
      }
      encrypt_provider_token: {
        Args: { token: string }
        Returns: string
      }
      log_audit_event: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_event_type: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: string
      }
      update_post_status: {
        Args: { p_error?: string; p_post_id: string; p_status: string }
        Returns: undefined
      }
    }
    Enums: {
      campaign_status:
        | "draft"
        | "awaiting_approval"
        | "scheduled"
        | "published"
        | "failed"
      platform_type: "linkedin" | "x" | "instagram"
      post_status:
        | "draft"
        | "awaiting_approval"
        | "scheduled"
        | "published"
        | "failed"
      provider_type: "linkedin" | "x" | "instagram"
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
      campaign_status: [
        "draft",
        "awaiting_approval",
        "scheduled",
        "published",
        "failed",
      ],
      platform_type: ["linkedin", "x", "instagram"],
      post_status: [
        "draft",
        "awaiting_approval",
        "scheduled",
        "published",
        "failed",
      ],
      provider_type: ["linkedin", "x", "instagram"],
    },
  },
} as const
