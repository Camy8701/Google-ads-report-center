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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ad_accounts: {
        Row: {
          client_id: string
          created_at: string
          currency: string
          data_source_status: Database["public"]["Enums"]["data_source_status"]
          google_ads_customer_id: string | null
          google_ads_manager_id: string | null
          id: string
          label: string | null
          last_sync_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          currency?: string
          data_source_status?: Database["public"]["Enums"]["data_source_status"]
          google_ads_customer_id?: string | null
          google_ads_manager_id?: string | null
          id?: string
          label?: string | null
          last_sync_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          currency?: string
          data_source_status?: Database["public"]["Enums"]["data_source_status"]
          google_ads_customer_id?: string | null
          google_ads_manager_id?: string | null
          id?: string
          label?: string | null
          last_sync_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          agency_email: string | null
          agency_name: string
          brand_accent: string
          data: Json
          google_ads_developer_token: string | null
          google_ads_login_customer_id: string | null
          google_ads_oauth_client_id: string | null
          google_ads_status: Database["public"]["Enums"]["data_source_status"]
          key: string
          report_intro: string | null
          report_signoff: string | null
          updated_at: string
        }
        Insert: {
          agency_email?: string | null
          agency_name?: string
          brand_accent?: string
          data?: Json
          google_ads_developer_token?: string | null
          google_ads_login_customer_id?: string | null
          google_ads_oauth_client_id?: string | null
          google_ads_status?: Database["public"]["Enums"]["data_source_status"]
          key: string
          report_intro?: string | null
          report_signoff?: string | null
          updated_at?: string
        }
        Update: {
          agency_email?: string | null
          agency_name?: string
          brand_accent?: string
          data?: Json
          google_ads_developer_token?: string | null
          google_ads_login_customer_id?: string | null
          google_ads_oauth_client_id?: string | null
          google_ads_status?: Database["public"]["Enums"]["data_source_status"]
          key?: string
          report_intro?: string | null
          report_signoff?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_main: boolean
          is_report_recipient: boolean
          role: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_main?: boolean
          is_report_recipient?: boolean
          role?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_main?: boolean
          is_report_recipient?: boolean
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived: boolean
          brand_notes: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string
          id: string
          industry: string | null
          last_report_month: string | null
          name: string
          next_report_due: string | null
          reporting_status: Database["public"]["Enums"]["reporting_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          archived?: boolean
          brand_notes?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          id?: string
          industry?: string | null
          last_report_month?: string | null
          name: string
          next_report_due?: string | null
          reporting_status?: Database["public"]["Enums"]["reporting_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          archived?: boolean
          brand_notes?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          id?: string
          industry?: string | null
          last_report_month?: string | null
          name?: string
          next_report_due?: string | null
          reporting_status?: Database["public"]["Enums"]["reporting_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      report_files: {
        Row: {
          file_size: number | null
          generated_at: string
          id: string
          mime_type: string
          report_id: string
          storage_path: string
        }
        Insert: {
          file_size?: number | null
          generated_at?: string
          id?: string
          mime_type?: string
          report_id: string
          storage_path: string
        }
        Update: {
          file_size?: number | null
          generated_at?: string
          id?: string
          mime_type?: string
          report_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_files_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_metrics: {
        Row: {
          clicks: number
          conversion_rate: number
          conversion_value: number
          conversions: number
          cost: number
          cpa: number
          cpc: number
          created_at: string
          ctr: number
          device_split: Json
          id: string
          impressions: number
          prior: Json
          report_id: string
          roas: number
          top_campaigns: Json
          top_keywords: Json
          top_products: Json
          top_search_terms: Json
        }
        Insert: {
          clicks?: number
          conversion_rate?: number
          conversion_value?: number
          conversions?: number
          cost?: number
          cpa?: number
          cpc?: number
          created_at?: string
          ctr?: number
          device_split?: Json
          id?: string
          impressions?: number
          prior?: Json
          report_id: string
          roas?: number
          top_campaigns?: Json
          top_keywords?: Json
          top_products?: Json
          top_search_terms?: Json
        }
        Update: {
          clicks?: number
          conversion_rate?: number
          conversion_value?: number
          conversions?: number
          cost?: number
          cpa?: number
          cpc?: number
          created_at?: string
          ctr?: number
          device_split?: Json
          id?: string
          impressions?: number
          prior?: Json
          report_id?: string
          roas?: number
          top_campaigns?: Json
          top_keywords?: Json
          top_products?: Json
          top_search_terms?: Json
        }
        Relationships: [
          {
            foreignKeyName: "report_metrics_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_recommendations: {
        Row: {
          created_at: string
          expected_impact: string
          id: string
          position: number
          report_id: string
          title: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          why: string
        }
        Insert: {
          created_at?: string
          expected_impact: string
          id?: string
          position?: number
          report_id: string
          title: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          why: string
        }
        Update: {
          created_at?: string
          expected_impact?: string
          id?: string
          position?: number
          report_id?: string
          title?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_recommendations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_sections: {
        Row: {
          body: string | null
          data: Json
          id: string
          kind: Database["public"]["Enums"]["section_kind"]
          position: number
          report_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          data?: Json
          id?: string
          kind: Database["public"]["Enums"]["section_kind"]
          position?: number
          report_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          data?: Json
          id?: string
          kind?: Database["public"]["Enums"]["section_kind"]
          position?: number
          report_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ad_account_id: string | null
          approved_at: string | null
          client_id: string
          created_at: string
          exported_at: string | null
          headline: string | null
          id: string
          overall_status: Database["public"]["Enums"]["urgency_level"]
          period_month: string
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
        }
        Insert: {
          ad_account_id?: string | null
          approved_at?: string | null
          client_id: string
          created_at?: string
          exported_at?: string | null
          headline?: string | null
          id?: string
          overall_status?: Database["public"]["Enums"]["urgency_level"]
          period_month: string
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
        }
        Update: {
          ad_account_id?: string | null
          approved_at?: string | null
          client_id?: string
          created_at?: string
          exported_at?: string | null
          headline?: string | null
          id?: string
          overall_status?: Database["public"]["Enums"]["urgency_level"]
          period_month?: string
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      business_type: "ecommerce" | "lead_gen" | "local_services" | "saas"
      data_source_status:
        | "mock"
        | "connected"
        | "syncing"
        | "error"
        | "not_configured"
      report_status: "draft" | "in_review" | "approved" | "exported"
      reporting_status: "on_track" | "due_soon" | "overdue" | "paused"
      section_kind:
        | "executive_summary"
        | "best_performing"
        | "what_changed"
        | "opportunities"
        | "decision_page"
        | "appendix"
      urgency_level: "urgent" | "medium" | "good" | "info"
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
      business_type: ["ecommerce", "lead_gen", "local_services", "saas"],
      data_source_status: [
        "mock",
        "connected",
        "syncing",
        "error",
        "not_configured",
      ],
      report_status: ["draft", "in_review", "approved", "exported"],
      reporting_status: ["on_track", "due_soon", "overdue", "paused"],
      section_kind: [
        "executive_summary",
        "best_performing",
        "what_changed",
        "opportunities",
        "decision_page",
        "appendix",
      ],
      urgency_level: ["urgent", "medium", "good", "info"],
    },
  },
} as const
