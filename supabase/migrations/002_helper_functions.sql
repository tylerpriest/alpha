-- Helper function to insert chunks with embeddings
create or replace function insert_chunk(
  p_document_id uuid,
  p_content text,
  p_embedding float[],
  p_chunk_index int,
  p_page_number int,
  p_token_count int
)
returns uuid
language plpgsql
as $$
declare
  v_chunk_id uuid;
begin
  insert into document_chunks (document_id, content, embedding, chunk_index, page_number, token_count)
  values (p_document_id, p_content, p_embedding::vector, p_chunk_index, p_page_number, p_token_count)
  returning id into v_chunk_id;

  return v_chunk_id;
end;
$$;

-- Helper function to increment query count
create or replace function increment_query_count(org_id uuid)
returns void
language plpgsql
as $$
begin
  update organizations
  set queries_used_this_month = queries_used_this_month + 1
  where id = org_id;

  -- Reset count if past reset date
  update organizations
  set queries_used_this_month = 1, queries_reset_at = now() + interval '1 month'
  where id = org_id
    and (queries_reset_at is null or queries_reset_at < now());
end;
$$;
