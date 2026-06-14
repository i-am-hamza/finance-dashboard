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
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          base_currency: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          base_currency?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          base_currency?: string;
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          id: string;
          user_id: string;
          currency_code: string;
          rate_to_base: number;
          last_updated: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency_code: string;
          rate_to_base: number;
          last_updated?: string;
        };
        Update: {
          rate_to_base?: number;
          last_updated?: string;
        };
        Relationships: [];
      };
      cash_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_type: string;
          balance: number;
          currency: string;
          rate_at_entry: number;
          bank_name: string | null;
          notes: string | null;
          fd_maturity_date: string | null;
          fd_interest_rate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          account_type: string;
          balance?: number;
          currency: string;
          rate_at_entry?: number;
          bank_name?: string | null;
          notes?: string | null;
          fd_maturity_date?: string | null;
          fd_interest_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          account_type?: string;
          balance?: number;
          currency?: string;
          rate_at_entry?: number;
          bank_name?: string | null;
          notes?: string | null;
          fd_maturity_date?: string | null;
          fd_interest_rate?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cash_transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          transaction_type: string;
          amount: number;
          currency: string;
          rate_at_entry: number;
          date: string;
          category: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          transaction_type: string;
          amount: number;
          currency: string;
          rate_at_entry?: number;
          date: string;
          category?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          transaction_type?: string;
          amount?: number;
          currency?: string;
          rate_at_entry?: number;
          date?: string;
          category?: string | null;
          note?: string | null;
        };
        Relationships: [];
      };
      income: {
        Row: {
          id: string;
          user_id: string;
          source_name: string;
          amount: number;
          currency: string;
          rate_at_entry: number;
          date: string;
          category: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_name: string;
          amount: number;
          currency: string;
          rate_at_entry?: number;
          date: string;
          category?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          source_name?: string;
          amount?: number;
          currency?: string;
          rate_at_entry?: number;
          date?: string;
          category?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          lender: string;
          loan_type: string;
          principal: number;
          outstanding: number;
          interest_rate: number;
          emi_amount: number;
          currency: string;
          rate_at_entry: number;
          due_day: number;
          start_date: string;
          end_date: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lender: string;
          loan_type: string;
          principal: number;
          outstanding: number;
          interest_rate: number;
          emi_amount: number;
          currency: string;
          rate_at_entry?: number;
          due_day: number;
          start_date: string;
          end_date: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          lender?: string;
          loan_type?: string;
          principal?: number;
          outstanding?: number;
          interest_rate?: number;
          emi_amount?: number;
          currency?: string;
          rate_at_entry?: number;
          due_day?: number;
          start_date?: string;
          end_date?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      emi_payments: {
        Row: {
          id: string;
          user_id: string;
          loan_id: string;
          payment_date: string;
          amount_paid: number;
          currency: string;
          rate_at_entry: number;
          principal_component: number | null;
          interest_component: number | null;
          outstanding_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          loan_id: string;
          payment_date: string;
          amount_paid: number;
          currency: string;
          rate_at_entry?: number;
          principal_component?: number | null;
          interest_component?: number | null;
          outstanding_after: number;
          created_at?: string;
        };
        Update: {
          payment_date?: string;
          amount_paid?: number;
          principal_component?: number | null;
          interest_component?: number | null;
          outstanding_after?: number;
        };
        Relationships: [];
      };
      budget_categories: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          category: string;
          budgeted_amount: number;
          currency: string;
          rate_at_entry: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          category: string;
          budgeted_amount: number;
          currency: string;
          rate_at_entry?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          budgeted_amount?: number;
          currency?: string;
          rate_at_entry?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      budget_expenses: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          amount: number;
          currency: string;
          rate_at_entry: number;
          category: string;
          note: string | null;
          source: string;
          source_id: string | null;
          is_auto: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          amount: number;
          currency: string;
          rate_at_entry?: number;
          category: string;
          note?: string | null;
          source?: string;
          source_id?: string | null;
          is_auto?: boolean;
          created_at?: string;
        };
        Update: {
          date?: string;
          amount?: number;
          currency?: string;
          rate_at_entry?: number;
          category?: string;
          note?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          service_name: string;
          amount: number;
          currency: string;
          rate_at_entry: number;
          billing_cycle: string;
          next_renewal_date: string;
          category: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_name: string;
          amount: number;
          currency: string;
          rate_at_entry?: number;
          billing_cycle: string;
          next_renewal_date: string;
          category?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          service_name?: string;
          amount?: number;
          currency?: string;
          rate_at_entry?: number;
          billing_cycle?: string;
          next_renewal_date?: string;
          category?: string | null;
          status?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          asset_name: string;
          asset_type: string;
          buy_price: number;
          current_price: number;
          quantity: number;
          currency: string;
          rate_at_entry: number;
          buy_date: string;
          price_updated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset_name: string;
          asset_type: string;
          buy_price: number;
          current_price: number;
          quantity: number;
          currency: string;
          rate_at_entry?: number;
          buy_date: string;
          price_updated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          asset_name?: string;
          asset_type?: string;
          buy_price?: number;
          current_price?: number;
          quantity?: number;
          currency?: string;
          rate_at_entry?: number;
          buy_date?: string;
          price_updated_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
