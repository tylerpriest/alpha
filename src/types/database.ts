// Database types for Supabase
// These types map to our database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enums
export type Plan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';
export type DocumentType =
  | 'PITCH_DECK'
  | 'DEAL_MEMO'
  | 'TERM_SHEET'
  | 'FINANCIAL_MODEL'
  | 'DD_REPORT'
  | 'MARKET_RESEARCH'
  | 'OTHER';
export type SourceType = 'UPLOAD' | 'EMAIL' | 'GDRIVE' | 'DROPBOX' | 'API';
export type DealStage =
  | 'SOURCED'
  | 'SCREENING'
  | 'FIRST_MEETING'
  | 'DD'
  | 'IC'
  | 'TERM_SHEET'
  | 'CLOSED_WON'
  | 'PASSED';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          stripe_customer_id: string | null;
          plan: Plan;
          documents_limit: number;
          queries_per_month: number;
          queries_used_this_month: number;
          queries_reset_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          stripe_customer_id?: string | null;
          plan?: Plan;
          documents_limit?: number;
          queries_per_month?: number;
          queries_used_this_month?: number;
          queries_reset_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          stripe_customer_id?: string | null;
          plan?: Plan;
          documents_limit?: number;
          queries_per_month?: number;
          queries_used_this_month?: number;
          queries_reset_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: UserRole;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          uploaded_by: string;
          title: string;
          original_name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          status: DocumentStatus;
          processing_error: string | null;
          text_content: string | null;
          page_count: number | null;
          document_type: DocumentType;
          source_type: SourceType;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          uploaded_by: string;
          title: string;
          original_name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          status?: DocumentStatus;
          processing_error?: string | null;
          text_content?: string | null;
          page_count?: number | null;
          document_type?: DocumentType;
          source_type?: SourceType;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          uploaded_by?: string;
          title?: string;
          original_name?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          status?: DocumentStatus;
          processing_error?: string | null;
          text_content?: string | null;
          page_count?: number | null;
          document_type?: DocumentType;
          source_type?: SourceType;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          page_number: number | null;
          token_count: number;
          created_at: string;
          // embedding is vector type, accessed via RPC functions
        };
        Insert: {
          id?: string;
          document_id: string;
          content: string;
          chunk_index: number;
          page_number?: number | null;
          token_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          content?: string;
          chunk_index?: number;
          page_number?: number | null;
          token_count?: number;
          created_at?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          organization_id: string;
          company_name: string;
          website: string | null;
          description: string | null;
          sector: string | null;
          current_stage: DealStage;
          ask_amount: number | null;
          valuation: number | null;
          lead_partner: string | null;
          source: string | null;
          pass_reason: string | null;
          ai_summary: string | null;
          ai_risks: string[] | null;
          ai_score: number | null;
          ai_score_reason: string | null;
          last_analyzed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          company_name: string;
          website?: string | null;
          description?: string | null;
          sector?: string | null;
          current_stage?: DealStage;
          ask_amount?: number | null;
          valuation?: number | null;
          lead_partner?: string | null;
          source?: string | null;
          pass_reason?: string | null;
          ai_summary?: string | null;
          ai_risks?: string[] | null;
          ai_score?: number | null;
          ai_score_reason?: string | null;
          last_analyzed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          company_name?: string;
          website?: string | null;
          description?: string | null;
          sector?: string | null;
          current_stage?: DealStage;
          ask_amount?: number | null;
          valuation?: number | null;
          lead_partner?: string | null;
          source?: string | null;
          pass_reason?: string | null;
          ai_summary?: string | null;
          ai_risks?: string[] | null;
          ai_score?: number | null;
          ai_score_reason?: string | null;
          last_analyzed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      deal_stage_history: {
        Row: {
          id: string;
          deal_id: string;
          from_stage: DealStage | null;
          to_stage: DealStage;
          changed_by: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          from_stage?: DealStage | null;
          to_stage: DealStage;
          changed_by: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          from_stage?: DealStage | null;
          to_stage?: DealStage;
          changed_by?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      deal_documents: {
        Row: {
          id: string;
          deal_id: string;
          document_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          document_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          document_id?: string;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          title: string | null;
          deal_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          title?: string | null;
          deal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          title?: string | null;
          deal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: MessageRole;
          content: string;
          model: string | null;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          citations: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: MessageRole;
          content: string;
          model?: string | null;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          citations?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: MessageRole;
          content?: string;
          model?: string | null;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          citations?: Json | null;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_count: number;
          filter_org_id: string;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      plan: Plan;
      user_role: UserRole;
      document_status: DocumentStatus;
      document_type: DocumentType;
      source_type: SourceType;
      deal_stage: DealStage;
      message_role: MessageRole;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenient type aliases
export type Organization = Tables<'organizations'>;
export type OrganizationMember = Tables<'organization_members'>;
export type Document = Tables<'documents'>;
export type DocumentChunk = Tables<'document_chunks'>;
export type Deal = Tables<'deals'>;
export type DealStageHistory = Tables<'deal_stage_history'>;
export type Conversation = Tables<'conversations'>;
export type Message = Tables<'messages'>;
export type ActivityLog = Tables<'activity_log'>;
