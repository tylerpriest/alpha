-- AlphaIntel Database Schema
-- Run this in Supabase SQL Editor or via migrations

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Enums
create type plan as enum ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
create type user_role as enum ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
create type document_status as enum ('PENDING', 'PROCESSING', 'INDEXED', 'FAILED');
create type document_type as enum ('PITCH_DECK', 'DEAL_MEMO', 'TERM_SHEET', 'FINANCIAL_MODEL', 'DD_REPORT', 'MARKET_RESEARCH', 'OTHER');
create type source_type as enum ('UPLOAD', 'EMAIL', 'GDRIVE', 'DROPBOX', 'API');
create type deal_stage as enum ('SOURCED', 'SCREENING', 'FIRST_MEETING', 'DD', 'IC', 'TERM_SHEET', 'CLOSED_WON', 'PASSED');
create type message_role as enum ('user', 'assistant', 'system');

-- Organizations (multi-tenancy root)
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  stripe_customer_id text unique,
  plan plan default 'FREE',
  documents_limit int default 100,
  queries_per_month int default 500,
  queries_used_this_month int default 0,
  queries_reset_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Organization members (links users to orgs with roles)
create table organization_members (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role user_role default 'MEMBER',
  created_at timestamptz default now(),
  unique(organization_id, user_id)
);

-- Documents
create table documents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  title text not null,
  original_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes int not null,
  status document_status default 'PENDING',
  processing_error text,
  text_content text,
  page_count int,
  document_type document_type default 'OTHER',
  source_type source_type default 'UPLOAD',
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Document chunks with vector embeddings
create table document_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete cascade not null,
  content text not null,
  embedding vector(1536), -- OpenAI ada-002 dimensions
  chunk_index int not null,
  page_number int,
  token_count int not null,
  created_at timestamptz default now()
);

-- HNSW index for fast vector similarity search
create index on document_chunks using hnsw (embedding vector_cosine_ops);

-- Deals (investment pipeline)
create table deals (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  company_name text not null,
  website text,
  description text,
  sector text,
  current_stage deal_stage default 'SOURCED',
  ask_amount numeric(14,2),
  valuation numeric(14,2),
  lead_partner text,
  source text,
  pass_reason text,
  ai_summary text,
  ai_risks text[],
  ai_score float,
  ai_score_reason text,
  last_analyzed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Deal stage history (audit trail)
create table deal_stage_history (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references deals(id) on delete cascade not null,
  from_stage deal_stage,
  to_stage deal_stage not null,
  changed_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- Link documents to deals
create table deal_documents (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references deals(id) on delete cascade not null,
  document_id uuid references documents(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(deal_id, document_id)
);

-- Conversations (AI chat)
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  title text,
  deal_id uuid references deals(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages in conversations
create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role message_role not null,
  content text not null,
  model text,
  prompt_tokens int,
  completion_tokens int,
  citations jsonb,
  created_at timestamptz default now()
);

-- Activity log (compliance audit trail)
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index on organization_members(user_id);
create index on organization_members(organization_id);
create index on documents(organization_id);
create index on documents(status);
create index on document_chunks(document_id);
create index on deals(organization_id);
create index on deals(current_stage);
create index on deal_stage_history(deal_id);
create index on conversations(organization_id);
create index on conversations(user_id);
create index on messages(conversation_id);
create index on activity_log(organization_id, created_at);
create index on activity_log(entity_type, entity_id);

-- Function for vector similarity search
create or replace function match_documents(
  query_embedding vector(1536),
  match_count int,
  filter_org_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where d.organization_id = filter_org_id
    and d.status = 'INDEXED'
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Row Level Security (RLS) policies
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table deals enable row level security;
alter table deal_stage_history enable row level security;
alter table deal_documents enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table activity_log enable row level security;

-- Policy: Users can only see organizations they belong to
create policy "Users can view their organizations"
  on organizations for select
  using (
    id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

-- Policy: Users can only see documents in their organization
create policy "Users can view organization documents"
  on documents for select
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

create policy "Users can insert documents in their organization"
  on documents for insert
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

-- Policy: Users can see chunks of documents they can access
create policy "Users can view document chunks"
  on document_chunks for select
  using (
    document_id in (
      select d.id from documents d
      join organization_members om on om.organization_id = d.organization_id
      where om.user_id = auth.uid()
    )
  );

-- Policy: Users can view deals in their organization
create policy "Users can view organization deals"
  on deals for select
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

create policy "Users can manage organization deals"
  on deals for all
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

-- Policy: Users can view their conversations
create policy "Users can view their conversations"
  on conversations for select
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

create policy "Users can create conversations"
  on conversations for insert
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

-- Policy: Users can view messages in their conversations
create policy "Users can view conversation messages"
  on messages for select
  using (
    conversation_id in (
      select c.id from conversations c
      join organization_members om on om.organization_id = c.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Users can create messages"
  on messages for insert
  with check (
    conversation_id in (
      select c.id from conversations c
      join organization_members om on om.organization_id = c.organization_id
      where om.user_id = auth.uid()
    )
  );

-- Policy: Organization members visible to org members
create policy "Users can view organization members"
  on organization_members for select
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

create trigger deals_updated_at
  before update on deals
  for each row execute function update_updated_at();

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();
