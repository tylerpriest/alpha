import { openai, streamChat } from '@/lib/ai/openai';
import { semanticSearch, type SearchResult } from './search';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  snippet: string;
  similarity: number;
  pageNumber?: number;
}

export interface ChatResponse {
  content: string;
  citations: Citation[];
  model: string;
  promptTokens: number;
  completionTokens: number;
}

// Build system prompt with context
function buildSystemPrompt(
  organizationType: string,
  relevantChunks: SearchResult[]
): string {
  const contextSection =
    relevantChunks.length > 0
      ? `\n\nRelevant context from your knowledge base:\n\n${relevantChunks
          .map(
            (chunk, i) =>
              `[${i + 1}] From "${chunk.documentTitle}"${
                chunk.pageNumber ? ` (page ${chunk.pageNumber})` : ''
              }:\n${chunk.content}`
          )
          .join('\n\n---\n\n')}`
      : '';

  return `You are AlphaIntel, an AI assistant for a ${organizationType} firm's internal knowledge base.

Your role is to help investment professionals find information, analyze deals, and leverage the firm's institutional knowledge.

IMPORTANT GUIDELINES:
1. Base your answers on the provided context from the knowledge base.
2. Always cite your sources using [1], [2], etc. format when referencing documents.
3. If the answer isn't in the provided context, clearly say "I don't have that information in the knowledge base."
4. Be concise but thorough. Investment professionals value precision.
5. When discussing deals or companies, maintain confidentiality appropriate for internal use.
6. For financial analysis, show your reasoning and calculations.
${contextSection}

If no relevant context is provided, you can still help with general questions about investing, finance, and business analysis.`;
}

// RAG-powered chat
export async function ragChat(
  message: string,
  conversationId: string,
  organizationId: string,
  options?: {
    model?: string;
    searchLimit?: number;
  }
): Promise<ChatResponse> {
  const { model = 'gpt-4-turbo-preview', searchLimit = 5 } = options ?? {};

  const supabase = await createServerSupabaseClient();

  // 1. Get conversation history
  const { data: historyMessages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(10);

  const history = (historyMessages ?? []).reverse() as ChatMessage[];

  // 2. Get organization info
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();

  // 3. Semantic search for relevant context
  const relevantChunks = await semanticSearch(message, organizationId, {
    limit: searchLimit,
    threshold: 0.7,
  });

  // 4. Build messages array
  const systemPrompt = buildSystemPrompt(
    org?.name ?? 'investment',
    relevantChunks
  );

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message },
  ];

  // 5. Call OpenAI
  const completion = await openai().chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  });

  const response = completion.choices[0].message.content ?? '';

  // 6. Build citations
  const citations: Citation[] = relevantChunks.map((chunk) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentTitle: chunk.documentTitle,
    snippet: chunk.content.slice(0, 200) + '...',
    similarity: chunk.similarity,
    pageNumber: chunk.pageNumber,
  }));

  return {
    content: response,
    citations,
    model,
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };
}

// Streaming RAG chat
export async function streamRagChat(
  message: string,
  conversationId: string,
  organizationId: string,
  options?: {
    model?: string;
    searchLimit?: number;
  }
): Promise<{
  stream: AsyncIterable<string>;
  citations: Citation[];
}> {
  const { model = 'gpt-4-turbo-preview', searchLimit = 5 } = options ?? {};

  const supabase = await createServerSupabaseClient();

  // 1. Get conversation history
  const { data: historyMessages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(10);

  const history = (historyMessages ?? []).reverse() as ChatMessage[];

  // 2. Get organization info
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();

  // 3. Semantic search for relevant context
  const relevantChunks = await semanticSearch(message, organizationId, {
    limit: searchLimit,
    threshold: 0.7,
  });

  // 4. Build messages array
  const systemPrompt = buildSystemPrompt(
    org?.name ?? 'investment',
    relevantChunks
  );

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message },
  ];

  // 5. Get streaming response
  const stream = await streamChat(messages, { model });

  // 6. Build citations
  const citations: Citation[] = relevantChunks.map((chunk) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentTitle: chunk.documentTitle,
    snippet: chunk.content.slice(0, 200) + '...',
    similarity: chunk.similarity,
    pageNumber: chunk.pageNumber,
  }));

  // Convert stream to async iterable of content
  async function* contentStream() {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  return {
    stream: contentStream(),
    citations,
  };
}

// Save message to database
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: {
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    citations?: Citation[];
  }
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
    model: metadata?.model,
    prompt_tokens: metadata?.promptTokens,
    completion_tokens: metadata?.completionTokens,
    citations: metadata?.citations,
  });
}

// Create a new conversation
export async function createConversation(
  organizationId: string,
  userId: string,
  options?: {
    title?: string;
    dealId?: string;
  }
): Promise<string> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      title: options?.title,
      deal_id: options?.dealId,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data.id;
}
