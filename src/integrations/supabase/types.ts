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
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      catering_requests: {
        Row: {
          assigned_to: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string | null
          event_date: string | null
          event_type: string | null
          guests: number | null
          id: string
          message: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          guests?: number | null
          id?: string
          message?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          guests?: number | null
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          allergens: string[]
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_menu_del_dia: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          allergens?: string[]
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_menu_del_dia?: boolean
          name: string
          price: number
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          allergens?: string[]
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_menu_del_dia?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dishes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          items: Json
          notes: string | null
          order_type: string
          status: string
          stripe_payment_intent_id: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          items: Json
          notes?: string | null
          order_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          items?: Json
          notes?: string | null
          order_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          google_calendar_event_id: string | null
          id: string
          notes: string | null
          party_size: number
          reservation_date: string
          reservation_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          google_calendar_event_id?: string | null
          id?: string
          notes?: string | null
          party_size: number
          reservation_date: string
          reservation_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          google_calendar_event_id?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          reservation_date?: string
          reservation_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurant_settings: {
        Row: {
          address: string
          city: string
          created_at: string | null
          description: string | null
          email: string | null
          facebook_url: string | null
          hero_image_url: string | null
          id: number
          instagram_url: string | null
          landing_content: Json
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          opening_hours: Json
          phone: string
          postal_code: string | null
          slug: string
          updated_at: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          hero_image_url?: string | null
          id?: number
          instagram_url?: string | null
          landing_content?: Json
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          opening_hours: Json
          phone: string
          postal_code?: string | null
          slug: string
          updated_at?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          hero_image_url?: string | null
          id?: number
          instagram_url?: string | null
          landing_content?: Json
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          opening_hours?: Json
          phone?: string
          postal_code?: string | null
          slug?: string
          updated_at?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role_is: { Args: { _role: string }; Returns: boolean }
      current_user_is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
