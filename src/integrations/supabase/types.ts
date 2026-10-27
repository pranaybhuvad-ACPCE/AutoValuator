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
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          public_display_name: string | null
          account_mode: Database["public"]["Enums"]["account_mode"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          phone?: string | null
          public_display_name?: string | null
          account_mode?: Database["public"]["Enums"]["account_mode"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          public_display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      car_listings: {
        Row: {
          id: string
          seller_id: string
          brand: string
          model: string
          manufacturing_year: number
          fuel_type: string
          transmission: string
          engine_size: number | null
          kilometers_driven: number
          number_of_owners: number
          description: string
          city: string
          asking_price: number
          estimated_price: number | null
          image_urls: string[]
          status: Database["public"]["Enums"]["car_listing_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          brand: string
          model: string
          manufacturing_year: number
          fuel_type: string
          transmission: string
          engine_size?: number | null
          kilometers_driven: number
          number_of_owners?: number
          description?: string
          city: string
          asking_price: number
          estimated_price?: number | null
          image_urls?: string[]
          status?: Database["public"]["Enums"]["car_listing_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          brand?: string
          model?: string
          manufacturing_year?: number
          fuel_type?: string
          transmission?: string
          engine_size?: number | null
          kilometers_driven?: number
          number_of_owners?: number
          description?: string
          city?: string
          asking_price?: number
          estimated_price?: number | null
          image_urls?: string[]
          status?: Database["public"]["Enums"]["car_listing_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: { id: string; buyer_id: string; listing_id: string; created_at: string }
        Insert: { id?: string; buyer_id: string; listing_id: string; created_at?: string }
        Update: { id?: string; buyer_id?: string; listing_id?: string; created_at?: string }
        Relationships: [
          {
            foreignKeyName: "favorites_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          seller_id: string
          message: string
          status: Database["public"]["Enums"]["inquiry_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id?: string
          seller_id?: string
          message: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_id?: string
          seller_id?: string
          message?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_messages: {
        Row: { id: string; inquiry_id: string; sender_id: string; message: string; created_at: string }
        Insert: { id?: string; inquiry_id: string; sender_id?: string; message: string; created_at?: string }
        Update: { id?: string; inquiry_id?: string; sender_id?: string; message?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "inquiry_messages_inquiry_id_fkey"; columns: ["inquiry_id"]; isOneToOne: false; referencedRelation: "inquiries"; referencedColumns: ["id"] },
          { foreignKeyName: "inquiry_messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      seller_access_requests: {
        Row: {
          id: string
          user_id: string
          requested_mode: Database["public"]["Enums"]["account_mode"]
          status: Database["public"]["Enums"]["seller_access_request_status"]
          created_at: string
          updated_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          requested_mode: "seller" | "both"
          status?: Database["public"]["Enums"]["seller_access_request_status"]
          created_at?: string
          updated_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          requested_mode?: "seller" | "both"
          status?: Database["public"]["Enums"]["seller_access_request_status"]
          created_at?: string
          updated_at?: string
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_access_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_listing_seller_names: {
        Args: { listing_ids: string[] }
        Returns: { listing_id: string; public_display_name: string }[]
      }
    }
    Enums: {
      account_mode: "buyer" | "seller" | "both"
      car_listing_status: "draft" | "active" | "under_offer" | "sold"
      inquiry_status: "pending" | "contacted" | "negotiating" | "closed"
      seller_access_request_status: "pending" | "approved" | "rejected"
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
    Enums: {},
  },
} as const
