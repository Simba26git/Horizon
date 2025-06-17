import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface MaterialPrice {
  id: string;
  material_id: string;
  supplier_id: string;
  price: number;
  currency: string;
  timestamp: string;
}

export interface UserQuotation {
  id: string;
  user_id: string;
  quotation_number: string;
  specifications: any;
  materials: any[];
  total_cost: number;
  currency: string;
  created_at: string;
  status: 'draft' | 'final';
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'user';
          company_name: string | null;
          contact_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'user';
          company_name?: string | null;
          contact_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'admin' | 'user';
          company_name?: string | null;
          contact_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          rating: number | null;
          location: string | null;
          delivery_time: string | null;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rating?: number | null;
          location?: string | null;
          delivery_time?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rating?: number | null;
          location?: string | null;
          delivery_time?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          name: string;
          unit: string;
          category: 'structural' | 'finishing' | 'electrical' | 'plumbing';
          specifications: Record<string, any>;
          supplier_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit: string;
          category: 'structural' | 'finishing' | 'electrical' | 'plumbing';
          specifications?: Record<string, any>;
          supplier_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          unit?: string;
          category?: 'structural' | 'finishing' | 'electrical' | 'plumbing';
          specifications?: Record<string, any>;
          supplier_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      material_prices: {
        Row: {
          id: string;
          material_id: string;
          supplier_id: string;
          price: number;
          currency: string;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          supplier_id: string;
          price: number;
          currency?: string;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          supplier_id?: string;
          price?: number;
          currency?: string;
          timestamp?: string;
          created_at?: string;
        };
      };
      price_predictions: {
        Row: {
          id: string;
          material_id: string;
          predicted_price: number;
          prediction_date: string;
          confidence_score: number | null;
          factors: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          predicted_price: number;
          prediction_date: string;
          confidence_score?: number | null;
          factors?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          predicted_price?: number;
          prediction_date?: string;
          confidence_score?: number | null;
          factors?: Record<string, any>;
          created_at?: string;
        };
      };
      quotations: {
        Row: {
          id: string;
          user_id: string;
          quotation_number: string;
          specifications: Record<string, any>;
          materials: Record<string, any>;
          total_cost: number;
          currency: string;
          status: 'draft' | 'final';
          valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quotation_number: string;
          specifications: Record<string, any>;
          materials: Record<string, any>;
          total_cost: number;
          currency?: string;
          status?: 'draft' | 'final';
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quotation_number?: string;
          specifications?: Record<string, any>;
          materials?: Record<string, any>;
          total_cost?: number;
          currency?: string;
          status?: 'draft' | 'final';
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      update_schedules: {
        Row: {
          id: string;
          supplier_id: string;
          frequency: 'daily' | 'weekly' | 'monthly';
          last_update: string;
          next_update: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          frequency: 'daily' | 'weekly' | 'monthly';
          last_update?: string;
          next_update: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          frequency?: 'daily' | 'weekly' | 'monthly';
          last_update?: string;
          next_update?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}; 