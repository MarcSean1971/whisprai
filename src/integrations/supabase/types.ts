export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      ai_instructions: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          suspended: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          suspended?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          suspended?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          caller_id: string
          created_at: string
          duration: number | null
          ended_at: string | null
          id: string
          recipient_id: string
          started_at: string | null
          status: string
          twilio_call_sid: string | null
          twilio_room_name: string | null
          updated_at: string
        }
        Insert: {
          caller_id: string
          created_at?: string
          duration?: number | null
          ended_at?: string | null
          id?: string
          recipient_id: string
          started_at?: string | null
          status: string
          twilio_call_sid?: string | null
          twilio_room_name?: string | null
          updated_at?: string
        }
        Update: {
          caller_id?: string
          created_at?: string
          duration?: number | null
          ended_at?: string | null
          id?: string
          recipient_id?: string
          started_at?: string | null
          status?: string
          twilio_call_sid?: string | null
          twilio_room_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          id: string
          recipient_email: string
          recipient_id: string | null
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_email: string
          recipient_id?: string | null
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_email?: string
          recipient_id?: string | null
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_participants_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          ai_metadata: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          original_language: string | null
          private_recipient: string | null
          private_room: string | null
          sender_id: string | null
          status: string
        }
        Insert: {
          ai_metadata?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          original_language?: string | null
          private_recipient?: string | null
          private_room?: string | null
          sender_id?: string | null
          status?: string
        }
        Update: {
          ai_metadata?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          original_language?: string | null
          private_recipient?: string | null
          private_room?: string | null
          sender_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          created_at: string | null
          first_name: string | null
          id: string
          interests: Json | null
          language: string
          last_name: string | null
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          interests?: Json | null
          language?: string
          last_name?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          interests?: Json | null
          language?: string
          last_name?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          accuracy: number | null
          id: string
          last_updated: string
          latitude: number
          longitude: number
          share_location: boolean
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          id?: string
          last_updated?: string
          latitude: number
          longitude: number
          share_location?: boolean
          user_id: string
        }
        Update: {
          accuracy?: number | null
          id?: string
          last_updated?: string
          latitude?: number
          longitude?: number
          share_location?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_existing_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_ordered_participant_pair: {
        Args: { user1_id: string; user2_id: string }
        Returns: string[]
      }
      get_user_email: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_id_by_email: {
        Args: { email_to_find: string }
        Returns: string
      }
      is_conversation_member: {
        Args: { conversation_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
