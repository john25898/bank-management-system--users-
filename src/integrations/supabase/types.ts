export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      account_levels: {
        Row: {
          benefits: Json | null
          created_at: string
          id: string
          interest_rate: number
          loan_limit_multiplier: number
          min_balance: number
          name: string
        }
        Insert: {
          benefits?: Json | null
          created_at?: string
          id?: string
          interest_rate: number
          loan_limit_multiplier: number
          min_balance: number
          name: string
        }
        Update: {
          benefits?: Json | null
          created_at?: string
          id?: string
          interest_rate?: number
          loan_limit_multiplier?: number
          min_balance?: number
          name?: string
        }
        Relationships: []
      }
      loan_eligibility_criteria: {
        Row: {
          created_at: string
          id: string
          interest_rate: number
          is_active: boolean
          max_loan_amount: number | null
          max_loan_to_savings_ratio: number
          max_term_months: number
          min_guarantors: number
          min_months_membership: number
          min_savings_balance: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_rate: number
          is_active?: boolean
          max_loan_amount?: number | null
          max_loan_to_savings_ratio?: number
          max_term_months?: number
          min_guarantors?: number
          min_months_membership?: number
          min_savings_balance?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_rate?: number
          is_active?: boolean
          max_loan_amount?: number | null
          max_loan_to_savings_ratio?: number
          max_term_months?: number
          min_guarantors?: number
          min_months_membership?: number
          min_savings_balance?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      loan_guarantors: {
        Row: {
          created_at: string
          guaranteed_amount: number
          guarantor_user_id: string
          id: string
          loan_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guaranteed_amount: number
          guarantor_user_id: string
          id?: string
          loan_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guaranteed_amount?: number
          guarantor_user_id?: string
          id?: string
          loan_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_guarantors_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_repayments: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          id: string
          interest_amount: number
          loan_id: string
          payment_date: string
          payment_type: string
          principal_amount: number
          reference_number: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          id?: string
          interest_amount: number
          loan_id: string
          payment_date?: string
          payment_type?: string
          principal_amount: number
          reference_number?: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          id?: string
          interest_amount?: number
          loan_id?: string
          payment_date?: string
          payment_type?: string
          principal_amount?: number
          reference_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          id: string
          user_id: string
          amount: number
          interest_rate: number
          term_months: number
          purpose: string
          status: string
          monthly_payment: number
          total_payable: number
          admin_notes: string | null
          member_notes: string | null
          applied_at: string
          reviewed_at: string | null
          approved_at: string | null
          rejected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          interest_rate: number
          term_months: number
          purpose: string
          status?: string
          monthly_payment: number
          total_payable: number
          admin_notes?: string | null
          member_notes?: string | null
          applied_at?: string
          reviewed_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          interest_rate?: number
          term_months?: number
          purpose?: string
          status?: string
          monthly_payment?: number
          total_payable?: number
          admin_notes?: string | null
          member_notes?: string | null
          applied_at?: string
          reviewed_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          document_url: string
          expiry_date: string | null
          file_size: number | null
          id: string
          is_shared: boolean | null
          mime_type: string | null
          notes: string | null
          shared_with: string[] | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          document_url: string
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          is_shared?: boolean | null
          mime_type?: string | null
          notes?: string | null
          shared_with?: string[] | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          document_url?: string
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          is_shared?: boolean | null
          mime_type?: string | null
          notes?: string | null
          shared_with?: string[] | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      medical_verification: {
        Row: {
          additional_documents_urls: string[] | null
          certificate_document_url: string | null
          created_at: string | null
          id: string
          institution_name: string | null
          license_document_url: string | null
          license_number: string | null
          specialty: Database["public"]["Enums"]["medical_specialty"] | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          verification_notes: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
          years_of_experience: number | null
        }
        Insert: {
          additional_documents_urls?: string[] | null
          certificate_document_url?: string | null
          created_at?: string | null
          id?: string
          institution_name?: string | null
          license_document_url?: string | null
          license_number?: string | null
          specialty?: Database["public"]["Enums"]["medical_specialty"] | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          years_of_experience?: number | null
        }
        Update: {
          additional_documents_urls?: string[] | null
          certificate_document_url?: string | null
          created_at?: string | null
          id?: string
          institution_name?: string | null
          license_document_url?: string | null
          license_number?: string | null
          specialty?: Database["public"]["Enums"]["medical_specialty"] | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_verification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "medical_verification_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      medicine_requests: {
        Row: {
          alternative_names_accepted: boolean | null
          brand_name: string | null
          created_at: string
          days_treatment: number
          form_type: string
          generic_name: string
          home_delivery: boolean | null
          hospital_clinic_pickup: boolean | null
          id: string
          max_distance: number | null
          medical_condition: string
          medical_condition_other: string | null
          meet_at_pharmacy: boolean | null
          pickup_from_lender: boolean | null
          prescription_status: string
          quantity_units: number
          reason: string
          return_method: string
          status: string
          strength_dosage: string
          total_amount: number | null
          updated_at: string
          urgency_level: string
          user_id: string
        }
        Insert: {
          alternative_names_accepted?: boolean | null
          brand_name?: string | null
          created_at?: string
          days_treatment?: number
          form_type?: string
          generic_name?: string
          home_delivery?: boolean | null
          hospital_clinic_pickup?: boolean | null
          id?: string
          max_distance?: number | null
          medical_condition?: string
          medical_condition_other?: string | null
          meet_at_pharmacy?: boolean | null
          pickup_from_lender?: boolean | null
          prescription_status?: string
          quantity_units?: number
          reason: string
          return_method?: string
          status?: string
          strength_dosage?: string
          total_amount?: number | null
          updated_at?: string
          urgency_level?: string
          user_id: string
        }
        Update: {
          alternative_names_accepted?: boolean | null
          brand_name?: string | null
          created_at?: string
          days_treatment?: number
          form_type?: string
          generic_name?: string
          home_delivery?: boolean | null
          hospital_clinic_pickup?: boolean | null
          id?: string
          max_distance?: number | null
          medical_condition?: string
          medical_condition_other?: string | null
          meet_at_pharmacy?: boolean | null
          pickup_from_lender?: boolean | null
          prescription_status?: string
          quantity_units?: number
          reason?: string
          return_method?: string
          status?: string
          strength_dosage?: string
          total_amount?: number | null
          updated_at?: string
          urgency_level?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string[] | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          current_medications: string[] | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          full_name: string | null
          gender: string | null
          id: string
          medical_conditions: string[] | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_medications?: string[] | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_conditions?: string[] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_medications?: string[] | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_conditions?: string[] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          description: string | null
          id: string
          is_completed: boolean
          name: string
          priority: string
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_amount?: number
          description?: string | null
          id?: string
          is_completed?: boolean
          name: string
          priority?: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          description?: string | null
          id?: string
          is_completed?: boolean
          name?: string
          priority?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_plans: {
        Row: {
          auto_deduct: boolean
          contribution_amount: number
          contribution_frequency: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_deduct?: boolean
          contribution_amount: number
          contribution_frequency: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          start_date?: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_deduct?: boolean
          contribution_amount?: number
          contribution_frequency?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string
          id: string
          metadata: Json | null
          reference_number: string
          savings_goal_id: string | null
          savings_plan_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          reference_number?: string
          savings_goal_id?: string | null
          savings_plan_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          reference_number?: string
          savings_goal_id?: string | null
          savings_plan_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_savings_goal_id_fkey"
            columns: ["savings_goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_savings_plan_id_fkey"
            columns: ["savings_plan_id"]
            isOneToOne: false
            referencedRelation: "savings_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          marketing_emails: boolean | null
          privacy_level: string | null
          push_notifications: boolean | null
          show_contact_info: boolean | null
          show_medical_conditions: boolean | null
          sms_notifications: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          marketing_emails?: boolean | null
          privacy_level?: string | null
          push_notifications?: boolean | null
          show_contact_info?: boolean | null
          show_medical_conditions?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          marketing_emails?: boolean | null
          privacy_level?: string | null
          push_notifications?: boolean | null
          show_contact_info?: boolean | null
          show_medical_conditions?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_reviews: {
        Row: {
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          rating: number
          review_text: string | null
          reviewed_user_id: string
          reviewer_id: string
          transaction_id: string | null
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          rating: number
          review_text?: string | null
          reviewed_user_id: string
          reviewer_id: string
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          rating?: number
          review_text?: string | null
          reviewed_user_id?: string
          reviewer_id?: string
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_loan_eligibility: {
        Args: { user_uuid: string }
        Returns: {
          eligible: boolean
          max_loan_amount: number
          required_guarantors: number
          available_criteria: Json
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_account_level: {
        Args: { user_uuid: string }
        Returns: {
          level_name: string
          min_balance: number
          interest_rate: number
          loan_limit_multiplier: number
          benefits: Json
        }[]
      }
      get_user_rating: {
        Args: { user_uuid: string }
        Returns: {
          average_rating: number
          total_reviews: number
        }[]
      }
      get_user_total_savings: {
        Args: { user_uuid: string }
        Returns: number
      }
    }
    Enums: {
      medical_specialty:
        | "general_practitioner"
        | "cardiologist"
        | "dermatologist"
        | "endocrinologist"
        | "gastroenterologist"
        | "neurologist"
        | "oncologist"
        | "pediatrician"
        | "psychiatrist"
        | "surgeon"
        | "pharmacist"
        | "other"
      user_role: "patient" | "doctor" | "pharmacist" | "admin"
      verification_status: "pending" | "verified" | "rejected"
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
      medical_specialty: [
        "general_practitioner",
        "cardiologist",
        "dermatologist",
        "endocrinologist",
        "gastroenterologist",
        "neurologist",
        "oncologist",
        "pediatrician",
        "psychiatrist",
        "surgeon",
        "pharmacist",
        "other",
      ],
      user_role: ["patient", "doctor", "pharmacist", "admin"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
