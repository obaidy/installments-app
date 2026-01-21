export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          id: number;
          actor: string | null;
          action: string;
          entity: string;
          entity_id: string;
          meta: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          actor?: string | null;
          action: string;
          entity: string;
          entity_id: string;
          meta?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          actor?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string;
          meta?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      client_complex_status: {
        Row: {
          user_id: string;
          complex_id: number;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
        };
        Insert: {
          user_id: string;
          complex_id: number;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Update: {
          user_id?: string;
          complex_id?: number;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Relationships: [];
      };
      complexes: {
        Row: {
          id: number;
          name: string;
          code: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          code?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          code?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: number;
          user_id: string | null;
          kind: string;
          url: string;
          verified: boolean | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          kind: string;
          url: string;
          verified?: boolean | null;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          kind?: string;
          url?: string;
          verified?: boolean | null;
        };
        Relationships: [];
      };
      gl_accounts: {
        Row: {
          id: number;
          code: string;
          name: string;
          type: string;
        };
        Insert: {
          id?: number;
          code: string;
          name: string;
          type: string;
        };
        Update: {
          id?: number;
          code?: string;
          name?: string;
          type?: string;
        };
        Relationships: [];
      };
      gl_entries: {
        Row: {
          id: number;
          entry_date: string;
          memo: string | null;
          posted_by: string | null;
          posted_at: string | null;
          locked: boolean | null;
        };
        Insert: {
          id?: number;
          entry_date?: string;
          memo?: string | null;
          posted_by?: string | null;
          posted_at?: string | null;
          locked?: boolean | null;
        };
        Update: {
          id?: number;
          entry_date?: string;
          memo?: string | null;
          posted_by?: string | null;
          posted_at?: string | null;
          locked?: boolean | null;
        };
        Relationships: [];
      };
      gl_lines: {
        Row: {
          id: number;
          entry_id: number | null;
          account_code: string | null;
          dr: number | null;
          cr: number | null;
          ref_entity: string | null;
          ref_id: string | null;
        };
        Insert: {
          id?: number;
          entry_id?: number | null;
          account_code?: string | null;
          dr?: number | null;
          cr?: number | null;
          ref_entity?: string | null;
          ref_id?: string | null;
        };
        Update: {
          id?: number;
          entry_id?: number | null;
          account_code?: string | null;
          dr?: number | null;
          cr?: number | null;
          ref_entity?: string | null;
          ref_id?: string | null;
        };
        Relationships: [];
      };
      installments: {
        Row: {
          id: number;
          unit_id: number;
          amount_iqd: number;
          due_date: string;
          paid: boolean | null;
          paid_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          unit_id: number;
          amount_iqd: number;
          due_date: string;
          paid?: boolean | null;
          paid_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          unit_id?: number;
          amount_iqd?: number;
          due_date?: string;
          paid?: boolean | null;
          paid_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      manager_complexes: {
        Row: {
          manager_id: string;
          complex_id: number;
        };
        Insert: {
          manager_id: string;
          complex_id: number;
        };
        Update: {
          manager_id?: string;
          complex_id?: number;
        };
        Relationships: [];
      };
      payment_intents: {
        Row: {
          id: string;
          unit_id: number | null;
          target_type: string;
          target_id: number;
          amount: number;
          provider: string | null;
          provider_ref: string | null;
          status: string;
          return_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          unit_id?: number | null;
          target_type: string;
          target_id: number;
          amount: number;
          provider?: string | null;
          provider_ref?: string | null;
          status?: string;
          return_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          unit_id?: number | null;
          target_type?: string;
          target_id?: number;
          amount?: number;
          provider?: string | null;
          provider_ref?: string | null;
          status?: string;
          return_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: number;
          unit_id: number;
          installment_id: number | null;
          service_fee_id: number | null;
          amount: number;
          status: string;
          paid_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          unit_id: number;
          installment_id?: number | null;
          service_fee_id?: number | null;
          amount: number;
          status?: string;
          paid_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          unit_id?: number;
          installment_id?: number | null;
          service_fee_id?: number | null;
          amount?: number;
          status?: string;
          paid_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      paylinks: {
        Row: {
          token: string;
          unit_id: number | null;
          target_type: string;
          target_id: number | null;
          amount: number | null;
          expires_at: string | null;
          created_at: string | null;
          created_by: string | null;
        };
        Insert: {
          token: string;
          unit_id?: number | null;
          target_type: string;
          target_id?: number | null;
          amount?: number | null;
          expires_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          token?: string;
          unit_id?: number | null;
          target_type?: string;
          target_id?: number | null;
          amount?: number | null;
          expires_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      promises: {
        Row: {
          id: number;
          user_id: string | null;
          target_type: string;
          target_id: number;
          promise_date: string;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          target_type: string;
          target_id: number;
          promise_date: string;
          status?: string;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          target_type?: string;
          target_id?: number;
          promise_date?: string;
          status?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: number;
          user_id: string | null;
          target_type: string;
          target_id: number;
          schedule_at: string;
          channel: string;
          template_code: string;
          state: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          target_type: string;
          target_id: number;
          schedule_at: string;
          channel: string;
          template_code: string;
          state?: string;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          target_type?: string;
          target_id?: number;
          schedule_at?: string;
          channel?: string;
          template_code?: string;
          state?: string;
        };
        Relationships: [];
      };
      service_fees: {
        Row: {
          id: number;
          unit_id: number;
          label: string | null;
          amount_iqd: number;
          due_date: string;
          paid: boolean | null;
          paid_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          unit_id: number;
          label?: string | null;
          amount_iqd: number;
          due_date: string;
          paid?: boolean | null;
          paid_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          unit_id?: number;
          label?: string | null;
          amount_iqd?: number;
          due_date?: string;
          paid?: boolean | null;
          paid_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      units: {
        Row: {
          id: number;
          complex_id: number;
          user_id: string | null;
          name: string;
          unit_number: string | null;
          service_fee: number | null;
          customer_id: string | null;
          created_at: string | null;
          autopay_enabled: boolean | null;
          autopay_day: number | null;
        };
        Insert: {
          id?: number;
          complex_id: number;
          user_id?: string | null;
          name: string;
          unit_number?: string | null;
          service_fee?: number | null;
          customer_id?: string | null;
          created_at?: string | null;
          autopay_enabled?: boolean | null;
          autopay_day?: number | null;
        };
        Update: {
          id?: number;
          complex_id?: number;
          user_id?: string | null;
          name?: string;
          unit_number?: string | null;
          service_fee?: number | null;
          customer_id?: string | null;
          created_at?: string | null;
          autopay_enabled?: boolean | null;
          autopay_day?: number | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: string;
        };
        Insert: {
          user_id: string;
          role: string;
        };
        Update: {
          user_id?: string;
          role?: string;
        };
        Relationships: [];
      };
      user_status: {
        Row: {
          user_id: string;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
        };
        Insert: {
          user_id: string;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Update: {
          user_id?: string;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          user_id: string;
          balance: number;
        };
        Insert: {
          user_id: string;
          balance?: number;
        };
        Update: {
          user_id?: string;
          balance?: number;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          id: number;
          user_id: string | null;
          amount: number;
          kind: string;
          ref: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          amount: number;
          kind: string;
          ref?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          amount?: number;
          kind?: string;
          ref?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      v_user_dues: {
        Row: {
          id: number | null;
          unit_id: number | null;
          amount_iqd: number | null;
          due_date: string | null;
          paid: boolean | null;
          paid_at: string | null;
          type: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      client_is_approved_for: {
        Args: { uid: string; cid: number };
        Returns: boolean;
      };
      is_accountant: {
        Args: { uid: string };
        Returns: boolean;
      };
      is_admin: {
        Args: { uid: string };
        Returns: boolean;
      };
      is_manager_of: {
        Args: { uid: string; cid: number };
        Returns: boolean;
      };
      sum_collected_mtd: {
        Args: Record<string, never>;
        Returns: number;
      };
      sum_collected_mtd_by_complex: {
        Args: { cid: number };
        Returns: number;
      };
      sum_collected_mtd_for_manager: {
        Args: { uid: string };
        Returns: number;
      };
      sum_due_today: {
        Args: Record<string, never>;
        Returns: number;
      };
      sum_due_today_by_complex: {
        Args: { cid: number };
        Returns: number;
      };
      sum_due_today_for_manager: {
        Args: { uid: string };
        Returns: number;
      };
      sum_next_30: {
        Args: Record<string, never>;
        Returns: number;
      };
      sum_next_30_by_complex: {
        Args: { cid: number };
        Returns: number;
      };
      sum_next_30_for_manager: {
        Args: { uid: string };
        Returns: number;
      };
      sum_past_due: {
        Args: Record<string, never>;
        Returns: number;
      };
      sum_past_due_by_complex: {
        Args: { cid: number };
        Returns: number;
      };
      sum_past_due_for_manager: {
        Args: { uid: string };
        Returns: number;
      };
      user_is_approved: {
        Args: { uid: string };
        Returns: boolean;
      };
      wallet_apply: {
        Args: { p_user_id: string; p_unit_id?: number | null };
        Returns: { applied: number; remaining: number }[];
      };
      wallet_topup: {
        Args: { p_user_id: string; p_amount: number; p_ref?: string | null };
        Returns: number;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
