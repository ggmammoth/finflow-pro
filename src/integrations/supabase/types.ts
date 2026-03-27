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
      categories: {
        Row: {
          color: string | null
          created_at: string
          family_space_id: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          family_space_id?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          family_space_id?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      category_budgets: {
        Row: {
          budget_amount: number
          category_id: string
          created_at: string
          family_space_id: string | null
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_amount: number
          category_id: string
          created_at?: string
          family_space_id?: string | null
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_amount?: number
          category_id?: string
          created_at?: string
          family_space_id?: string | null
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_budgets_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      child_allowances: {
        Row: {
          amount: number
          auto_recurring: boolean
          child_member_id: string
          created_at: string
          created_by_user_id: string
          family_space_id: string
          frequency: string
          id: string
          next_due_date: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          auto_recurring?: boolean
          child_member_id: string
          created_at?: string
          created_by_user_id: string
          family_space_id: string
          frequency: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_recurring?: boolean
          child_member_id?: string
          created_at?: string
          created_by_user_id?: string
          family_space_id?: string
          frequency?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_allowances_child_member_id_fkey"
            columns: ["child_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_allowances_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invitations: {
        Row: {
          created_at: string
          expires_at: string | null
          family_space_id: string
          id: string
          invited_by: string
          invited_email: string
          role_to_assign: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          family_space_id: string
          id?: string
          invited_by: string
          invited_email: string
          role_to_assign: string
          status?: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          family_space_id?: string
          id?: string
          invited_by?: string
          invited_email?: string
          role_to_assign?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          display_name: string | null
          family_space_id: string
          id: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          family_space_id: string
          id?: string
          is_active?: boolean
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          family_space_id?: string
          id?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      family_spaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      goal_contributions: {
        Row: {
          amount: number
          contributed_by_user_id: string
          contribution_date: string
          created_at: string
          goal_id: string
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          contributed_by_user_id: string
          contribution_date?: string
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          contributed_by_user_id?: string
          contribution_date?: string
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      paydays: {
        Row: {
          created_at: string
          day_of_month: number
          id: string
          label: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_month: number
          id?: string
          label?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_month?: number
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_payments: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          next_due_date: string
          notes: string | null
          payment_method: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean | null
          next_due_date: string
          notes?: string | null
          payment_method?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_due_date?: string
          notes?: string | null
          payment_method?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_payments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          current_amount: number
          deadline: string | null
          family_space_id: string | null
          goal_type: string
          icon: string | null
          id: string
          name: string
          owner_member_id: string | null
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          family_space_id?: string | null
          goal_type?: string
          icon?: string | null
          id?: string
          name: string
          owner_member_id?: string | null
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          family_space_id?: string | null
          goal_type?: string
          icon?: string | null
          id?: string
          name?: string
          owner_member_id?: string | null
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goals_owner_member_id_fkey"
            columns: ["owner_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          created_by_user_id: string | null
          date: string
          family_space_id: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_method: string | null
          recurring_payment_id: string | null
          related_child_member_id: string | null
          related_goal_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          date?: string
          family_space_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          recurring_payment_id?: string | null
          related_child_member_id?: string | null
          related_goal_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          date?: string
          family_space_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          recurring_payment_id?: string | null
          related_child_member_id?: string | null
          related_goal_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recurring_payment"
            columns: ["recurring_payment_id"]
            isOneToOne: false
            referencedRelation: "recurring_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_family_space_id_fkey"
            columns: ["family_space_id"]
            isOneToOne: false
            referencedRelation: "family_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_child_member_id_fkey"
            columns: ["related_child_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_goal_id_fkey"
            columns: ["related_goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_child_member_id_for_user: {
        Args: { _family_space_id: string; _user_id: string }
        Returns: string
      }
      get_family_role: {
        Args: { _family_space_id: string; _user_id: string }
        Returns: string
      }
      get_user_family_space_id: { Args: { _user_id: string }; Returns: string }
      is_family_adult_or_owner: {
        Args: { _family_space_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_member: {
        Args: { _family_space_id: string; _user_id: string }
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
