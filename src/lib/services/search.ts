import { generateEmbedding } from '@/lib/ai/openai';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export interface SearchResult {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
  pageNumber?: number;
}

// Semantic search across documents
export async function semanticSearch(
  query: string,
  organizationId: string,
  options?: {
    limit?: number;
    threshold?: number;
    documentType?: string;
  }
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.7, documentType } = options ?? {};

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Use admin client for vector search (RPC function)
  const supabase = createAdminClient();

  // Call the match_documents function
  const { data: matches, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: limit * 2, // Get more than needed to filter
    filter_org_id: organizationId,
  });

  if (error) {
    console.error('Search error:', error);
    throw new Error('Search failed');
  }

  if (!matches || matches.length === 0) {
    return [];
  }

  // Get document details for the matched chunks
  const documentIds = [...new Set(matches.map((m: { document_id: string }) => m.document_id))];

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, document_type')
    .in('id', documentIds);

  const docMap = new Map(documents?.map((d) => [d.id, d]) ?? []);

  // Filter and format results
  const results: SearchResult[] = matches
    .filter((m: { similarity: number }) => m.similarity >= threshold)
    .filter((m: { document_id: string }) => {
      if (!documentType) return true;
      const doc = docMap.get(m.document_id);
      return doc?.document_type === documentType;
    })
    .slice(0, limit)
    .map((m: { id: string; document_id: string; content: string; similarity: number; page_number?: number }) => ({
      id: m.id,
      documentId: m.document_id,
      documentTitle: docMap.get(m.document_id)?.title ?? 'Unknown',
      content: m.content,
      similarity: m.similarity,
      pageNumber: m.page_number,
    }));

  return results;
}

// Hybrid search (vector + keyword)
export async function hybridSearch(
  query: string,
  organizationId: string,
  options?: {
    limit?: number;
    threshold?: number;
  }
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.5 } = options ?? {};

  // Get semantic results
  const semanticResults = await semanticSearch(query, organizationId, {
    limit: limit * 2,
    threshold,
  });

  // Get keyword results
  const supabase = await createServerSupabaseClient();

  const { data: keywordResults } = await supabase
    .from('documents')
    .select('id, title')
    .eq('organization_id', organizationId)
    .eq('status', 'INDEXED')
    .or(`title.ilike.%${query}%,text_content.ilike.%${query}%`)
    .limit(limit);

  // Merge and deduplicate results
  const seenDocIds = new Set(semanticResults.map((r) => r.documentId));
  const mergedResults = [...semanticResults];

  for (const doc of keywordResults ?? []) {
    if (!seenDocIds.has(doc.id)) {
      // Add keyword match with lower similarity
      mergedResults.push({
        id: doc.id,
        documentId: doc.id,
        documentTitle: doc.title,
        content: `Keyword match in: ${doc.title}`,
        similarity: 0.5, // Default score for keyword matches
        pageNumber: undefined,
      });
    }
  }

  // Sort by similarity and limit
  return mergedResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// Get similar documents to a given document
export async function findSimilarDocuments(
  documentId: string,
  organizationId: string,
  limit = 5
): Promise<SearchResult[]> {
  const supabase = await createServerSupabaseClient();

  // Get chunks from the source document
  const { data: sourceChunks } = await supabase
    .from('document_chunks')
    .select('content')
    .eq('document_id', documentId)
    .limit(3); // Use first few chunks for comparison

  if (!sourceChunks || sourceChunks.length === 0) {
    return [];
  }

  // Combine chunks for a representative query
  const combinedText = sourceChunks.map((c) => c.content).join('\n\n');

  // Search for similar documents
  const results = await semanticSearch(combinedText, organizationId, {
    limit: limit + 1, // +1 to exclude self
    threshold: 0.6,
  });

  // Exclude the source document
  return results.filter((r) => r.documentId !== documentId).slice(0, limit);
}
